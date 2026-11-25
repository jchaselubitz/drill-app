/* global AbortController, AbortSignal, Buffer, clearInterval, fetch, process, setInterval */

import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';

import { verifyAssertion, verifyAttestation } from 'node-app-attest';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1';
const CHAT_MODELS = new Set(['google/gemini-3.1-flash-lite', 'google/gemini-3.6-flash']);
const SPEECH_MODEL = 'google/gemini-3.8-flash-lite-tts';
const BUNDLE_ID = 'com.drillapp.mobile';
const TEAM_ID = 'X84RPB4674';
const DAY = 86_400_000;
const CHALLENGE_TTL = 5 * 60_000;
const SESSION_TTL = 30 * 60_000;
const MAX_BODY_BYTES = 256 * 1024;
const MODEL_TIMEOUT = 60_000;
const MAX_IN_FLIGHT = 12;

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function requiredText(value, maxLength) {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new RequestError(400, 'Invalid request text');
  }
  return value;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function buildUpstreamRequest(path, body) {
  if (!isObject(body)) throw new RequestError(400, 'Invalid request body');

  const privacy = { zdr: true, data_collection: 'deny' };
  if (path === '/audio/speech') {
    if (body.model !== SPEECH_MODEL || body.voice !== 'Kore' || body.response_format !== 'pcm') {
      throw new RequestError(400, 'Unsupported speech configuration');
    }
    return {
      model: SPEECH_MODEL,
      voice: 'Kore',
      response_format: 'pcm',
      input: requiredText(body.input, 500),
      instructions: requiredText(body.instructions, 200),
      provider: privacy,
    };
  }

  if (!CHAT_MODELS.has(body.model) || !Array.isArray(body.messages)) {
    throw new RequestError(400, 'Unsupported language model or messages');
  }
  const roles = body.messages.map((message) => message?.role).join(',');
  if (roles !== 'user' && roles !== 'system,user') {
    throw new RequestError(400, 'Unsupported message roles');
  }
  const request = {
    model: body.model,
    messages: body.messages.map(({ role, content }) => ({
      role,
      content: requiredText(content, role === 'system' ? 12_000 : 80_000),
    })),
    max_tokens: 8192,
    provider: privacy,
  };
  if (body.response_format !== undefined) {
    const format = body.response_format;
    const schema = format?.json_schema?.schema;
    if (
      format?.type !== 'json_schema' ||
      !isObject(schema) ||
      schema.type !== 'object' ||
      JSON.stringify(schema).length > 12_000
    ) {
      throw new RequestError(400, 'Unsupported response schema');
    }
    request.response_format = {
      type: 'json_schema',
      json_schema: { name: 'drill_response', strict: true, schema },
    };
    request.provider.require_parameters = true;
  }
  return request;
}

async function readJson(req) {
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') {
    throw new RequestError(415, 'JSON request required');
  }
  if (Number(req.headers['content-length']) > MAX_BODY_BYTES) {
    throw new RequestError(413, 'Request is too large');
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new RequestError(413, 'Request is too large');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new RequestError(400, 'Invalid JSON');
  }
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(data));
}

const randomToken = () => randomBytes(32).toString('base64url');
const tokenHash = (token) => createHash('sha256').update(token).digest('hex');

function openDatabase(databasePath) {
  if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS installs (
      id TEXT PRIMARY KEY, public_key TEXT NOT NULL, count INTEGER NOT NULL, last_seen INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS challenges (
      token TEXT PRIMARY KEY, install TEXT NOT NULL, expires INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, install TEXT NOT NULL REFERENCES installs(id) ON DELETE CASCADE,
      expires INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS usage (
      day INTEGER NOT NULL, owner TEXT NOT NULL, units INTEGER NOT NULL,
      PRIMARY KEY (day, owner)
    );
  `);
  return db;
}

function getLimits(env) {
  const read = (name, fallback) => {
    const value = Number(env[name] ?? fallback);
    if (!Number.isSafeInteger(value) || value < 1) throw new Error('Invalid ' + name);
    return value;
  };
  return {
    device: read('DRILL_DAILY_DEVICE_UNITS', 150),
    total: read('DRILL_DAILY_TOTAL_UNITS', 1000),
  };
}

export function createDrillServer({
  apiKey,
  databasePath,
  limits = { device: 150, total: 1000 },
  sandbox = false,
  attest = verifyAttestation,
  assert = verifyAssertion,
  fetchUpstream = fetch,
}) {
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is required');
  const db = openDatabase(databasePath);
  const getInstall = db.prepare('SELECT * FROM installs WHERE id = ?');
  const identity = { bundleIdentifier: BUNDLE_ID, teamIdentifier: TEAM_ID };
  let challengesThisMinute = 0;
  let challengeMinute = 0;
  let inFlight = 0;

  const transaction = (work) => {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = work();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  };

  function prune(now) {
    db.prepare('DELETE FROM challenges WHERE expires <= ?').run(now);
    db.prepare('DELETE FROM sessions WHERE expires <= ?').run(now);
    db.prepare('DELETE FROM installs WHERE last_seen <= ?').run(now - 90 * DAY);
    db.prepare('DELETE FROM usage WHERE day < ?').run(Math.floor(now / DAY) - 1);
  }

  function issueChallenge(body, now) {
    const install = requiredText(body?.keyId, 128);
    if (!/^[A-Za-z0-9+/]{43}=$/.test(install)) {
      throw new RequestError(400, 'Invalid App Attest key identifier');
    }
    const minute = Math.floor(now / 60_000);
    if (minute !== challengeMinute) {
      challengeMinute = minute;
      challengesThisMinute = 0;
      prune(now);
    }
    if (++challengesThisMinute > 120) throw new RequestError(429, 'Please try again later');

    const challenge = randomToken();
    db.prepare('INSERT INTO challenges VALUES (?, ?, ?)').run(
      challenge,
      install,
      now + CHALLENGE_TTL
    );
    return { challenge, mode: getInstall.get(install) ? 'assertion' : 'attestation' };
  }

  function issueSession(body, now) {
    const keyId = requiredText(body?.keyId, 128);
    const challenge = requiredText(body?.challenge, 128);
    const proofBase64 = requiredText(body?.proof, 24_000);
    const consumed = db
      .prepare(
        'DELETE FROM challenges WHERE token = ? AND install = ? AND expires > ? RETURNING token'
      )
      .get(challenge, keyId, now);
    if (!consumed) throw new RequestError(401, 'App verification challenge expired');

    const existing = getInstall.get(keyId);
    const proof = Buffer.from(proofBase64, 'base64');
    let verified;
    try {
      verified = existing
        ? assert({
            ...identity,
            assertion: proof,
            payload: challenge,
            publicKey: existing.public_key,
            signCount: existing.count,
          })
        : attest({
            ...identity,
            attestation: proof,
            challenge,
            keyId,
            allowDevelopmentEnvironment: sandbox,
            authenticatorExtensions: {
              allowedValidationCategories: sandbox ? [2, 3, 4, 5] : [2, 4],
              required: false,
            },
          });
    } catch {
      throw new RequestError(401, 'App verification failed');
    }

    const token = randomToken();
    transaction(() => {
      if (existing) {
        db.prepare('UPDATE installs SET count = ?, last_seen = ? WHERE id = ?').run(
          verified.signCount,
          now,
          keyId
        );
      } else {
        db.prepare('INSERT INTO installs VALUES (?, ?, 0, ?)').run(keyId, verified.publicKey, now);
      }
      db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(
        tokenHash(token),
        keyId,
        now + SESSION_TTL
      );
    });
    return { token, expiresInSeconds: SESSION_TTL / 1000 };
  }

  function getSession(req, now) {
    const token = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.headers.authorization ?? '')?.[1];
    const session =
      token &&
      db
        .prepare('SELECT install FROM sessions WHERE token_hash = ? AND expires > ?')
        .get(tokenHash(token), now);
    if (!session) throw new RequestError(401, 'App verification is required');
    return session.install;
  }

  function reserveUsage(install, units, now) {
    const day = Math.floor(now / DAY);
    const getUsage = db.prepare('SELECT units FROM usage WHERE day = ? AND owner = ?');
    const increment = db.prepare(`
      INSERT INTO usage VALUES (?, ?, ?) ON CONFLICT (day, owner) DO UPDATE SET units = units + excluded.units
    `);
    transaction(() => {
      for (const [owner, cap] of [
        [install, limits.device],
        ['all', limits.total],
      ]) {
        if ((getUsage.get(day, owner)?.units ?? 0) + units > cap) {
          throw new RequestError(
            429,
            'Drill’s AI usage limit has been reached. Try again tomorrow.'
          );
        }
        increment.run(day, owner, units);
      }
    });
  }

  async function forward(req, res, endpoint, now) {
    const install = getSession(req, now);
    const upstreamRequest = buildUpstreamRequest(endpoint, await readJson(req));
    if (inFlight >= MAX_IN_FLIGHT) throw new RequestError(429, 'Drill is busy. Please try again.');
    reserveUsage(
      install,
      endpoint === '/audio/speech'
        ? 1
        : upstreamRequest.model === 'google/gemini-3.6-flash'
          ? 5
          : 2,
      now
    );
    inFlight++;
    const disconnected = new AbortController();
    const close = () => {
      if (!res.writableEnded) disconnected.abort();
    };
    res.on('close', close);
    try {
      const upstream = await fetchUpstream(OPENROUTER_URL + endpoint, {
        method: 'POST',
        headers: { authorization: 'Bearer ' + apiKey, 'content-type': 'application/json' },
        body: JSON.stringify(upstreamRequest),
        signal: AbortSignal.any([disconnected.signal, AbortSignal.timeout(MODEL_TIMEOUT)]),
      });
      const contentType = upstream.headers.get('content-type');
      const expectedType = endpoint === '/audio/speech' ? 'audio/pcm' : 'application/json';
      if (!upstream.ok || !upstream.body || contentType?.split(';')[0] !== expectedType) {
        await upstream.body?.cancel();
        throw new RequestError(
          502,
          'The AI provider could not complete this request. Please try again.'
        );
      }
      res.writeHead(200, { 'content-type': contentType, 'cache-control': 'no-store' });
      await pipeline(upstream.body, res);
    } finally {
      inFlight--;
      res.off('close', close);
    }
  }

  const server = createServer({ requestTimeout: 15_000 }, async (req, res) => {
    try {
      if (req.method === 'GET' && req.url === '/health') {
        sendJson(res, 200, { status: 'ok' });
        return;
      }
      if (req.method !== 'POST') throw new RequestError(404, 'Route not found');
      const now = Date.now();
      if (req.url === '/v1/attest/challenge') {
        sendJson(res, 200, issueChallenge(await readJson(req), now));
      } else if (req.url === '/v1/attest/verify') {
        sendJson(res, 200, issueSession(await readJson(req), now));
      } else if (req.url === '/v1/chat/completions' || req.url === '/v1/audio/speech') {
        await forward(req, res, req.url.slice(3), now);
      } else {
        throw new RequestError(404, 'Route not found');
      }
    } catch (error) {
      if (res.destroyed || res.writableEnded) return;
      if (res.headersSent) {
        res.destroy();
        return;
      }
      if (error instanceof RequestError) {
        sendJson(res, error.status, { error: error.message });
      } else {
        sendJson(res, 503, { error: 'Drill’s AI service is temporarily unavailable' });
      }
    }
  });
  prune(Date.now());
  const pruneTimer = setInterval(() => prune(Date.now()), 60 * 60_000);
  pruneTimer.unref();
  server.on('close', () => {
    clearInterval(pruneTimer);
    db.close();
  });
  return server;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '/').href) {
  const server = createDrillServer({
    apiKey: process.env.OPENROUTER_API_KEY,
    databasePath: process.env.DRILL_DATABASE_PATH ?? '/data/drill.sqlite',
    limits: getLimits(process.env),
    sandbox: process.env.DRILL_APP_ATTEST_SANDBOX === '1',
  });
  server.listen(Number(process.env.PORT ?? 8080), '0.0.0.0');
}
