/* global Buffer, fetch, Response */

import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';

import { createDrillServer } from './server.mjs';

const install = Buffer.alloc(32, 1).toString('base64');
const otherInstall = Buffer.alloc(32, 2).toString('base64');
const proof = Buffer.from('test proof').toString('base64');
const chat = {
  model: 'google/gemini-3.6-flash',
  messages: [{ role: 'user', content: 'Test request' }],
};
const speech = {
  model: 'google/gemini-3.8-flash-lite-tts',
  voice: 'Kore',
  response_format: 'pcm',
  input: 'Guten Morgen',
  instructions: 'Speak in German',
};

async function fixture(t, overrides = {}) {
  const calls = [];
  const server = createDrillServer({
    apiKey: 'test-upstream-key',
    databasePath: ':memory:',
    attest: ({ allowDevelopmentEnvironment }) => {
      assert.equal(allowDevelopmentEnvironment, false);
      return { publicKey: 'test-public-key' };
    },
    assert: ({ signCount, publicKey }) => {
      assert.equal(publicKey, 'test-public-key');
      return { signCount: signCount + 1 };
    },
    fetchUpstream: async (url, request) => {
      calls.push(JSON.parse(request.body));
      assert.equal(request.headers.authorization, 'Bearer test-upstream-key');
      return url.endsWith('/audio/speech')
        ? new Response(Uint8Array.of(1, 2, 3, 4), {
            headers: { 'content-type': 'audio/pcm;rate=24000;channels=1' },
          })
        : Response.json({ choices: [{ message: { content: 'test result' } }] });
    },
    ...overrides,
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  const url = 'http://127.0.0.1:' + server.address().port;
  const post = (path, body, token) =>
    fetch(url + path, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: 'Bearer ' + token } : {}),
      },
      body: JSON.stringify(body),
    });
  const challenge = async (keyId = install) =>
    (await post('/v1/attest/challenge', { keyId })).json();
  const verify = (value, keyId = install) =>
    post('/v1/attest/verify', { keyId, challenge: value, proof });
  const token = async (keyId = install) => {
    const { challenge: value } = await challenge(keyId);
    const verified = await verify(value, keyId);
    assert.equal(verified.status, 200);
    return (await verified.json()).token;
  };
  return { calls, post, challenge, verify, token };
}

test('attestation challenges are bound to the key and can only be used once', async (t) => {
  const api = await fixture(t);
  assert.equal((await api.post('/v1/chat/completions', chat)).status, 401);
  const first = await api.challenge();
  assert.equal(first.mode, 'attestation');
  assert.equal((await api.verify(first.challenge, otherInstall)).status, 401);
  assert.equal((await api.verify(first.challenge)).status, 200);
  assert.equal((await api.verify(first.challenge)).status, 401);
  const next = await api.challenge();
  assert.equal(next.mode, 'assertion');
  assert.equal((await api.verify(next.challenge)).status, 200);
  assert.equal(api.calls.length, 0);
});

test('real verifier rejects an invalid Apple proof', async (t) => {
  const api = await fixture(t, { attest: undefined });
  const { challenge } = await api.challenge();
  assert.equal((await api.verify(challenge)).status, 401);
  assert.equal(api.calls.length, 0);
});

test('forwarding validates inputs, overrides provider options and preserves PCM headers', async (t) => {
  const api = await fixture(t);
  const token = await api.token();
  assert.equal(
    (await api.post('/v1/chat/completions', { ...chat, model: 'other/model' }, token)).status,
    400
  );
  assert.equal(
    (await api.post('/v1/audio/speech', { ...speech, input: 'x'.repeat(501) }, token)).status,
    400
  );
  const response = await api.post(
    '/v1/chat/completions',
    {
      ...chat,
      tools: ['arbitrary'],
      provider: { zdr: false },
    },
    token
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).choices[0].message.content, 'test result');
  assert.deepEqual(api.calls[0].provider, { zdr: true, data_collection: 'deny' });
  assert.equal(api.calls[0].tools, undefined);
  const audio = await api.post('/v1/audio/speech', speech, token);
  assert.equal(audio.status, 200);
  assert.equal(audio.headers.get('content-type'), 'audio/pcm;rate=24000;channels=1');
  assert.deepEqual([...new Uint8Array(await audio.arrayBuffer())], [1, 2, 3, 4]);
});

test('per-device and global budgets are enforced before contacting OpenRouter', async (t) => {
  const api = await fixture(t, { limits: { device: 2, total: 3 } });
  const first = await api.token();
  const second = await api.token(otherInstall);
  for (let i = 0; i < 2; i++) {
    const result = await api.post('/v1/audio/speech', speech, first);
    assert.equal(result.status, 200);
    await result.arrayBuffer();
  }
  assert.equal((await api.post('/v1/audio/speech', speech, first)).status, 429);
  const result = await api.post('/v1/audio/speech', speech, second);
  assert.equal(result.status, 200);
  await result.arrayBuffer();
  assert.equal((await api.post('/v1/audio/speech', speech, second)).status, 429);
  assert.equal(api.calls.length, 3);
});
