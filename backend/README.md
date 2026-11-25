# Drill AI backend

The iOS app uses Apple App Attest to open short-lived sessions without requiring
a Drill account. The service validates the app identity, accepts only Drill's
text and speech request formats, and caps per-installation and total daily
usage. Prompts and audio are forwarded for inference and are not stored by this
service. OpenRouter routing requires zero data retention and excludes providers
that permit data collection.

## Run locally

Use Node 24 or newer. Install the pinned dependencies with `npm ci` and run
`npm test`. To start the service, set a server-only `OPENROUTER_API_KEY` and
a writable path such as `DRILL_DATABASE_PATH=/tmp/drill-local.sqlite`, then run
`npm start`.

Local tests and a separately deployed staging service can set
`DRILL_APP_ATTEST_SANDBOX=1` to accept development attestations. Leave this
unset in production. App Attest requires a physical iPhone or iPad.

## Deploy

Deploy this directory as one service using the Dockerfile. Mount persistent
storage at `/data` and configure `GET /health` as the health check. Set
`OPENROUTER_API_KEY` as a secret, preferably with a dedicated provider spending
limit. The service listens on the host's `PORT` and defaults to port 8080.

`DRILL_DAILY_DEVICE_UNITS` defaults to 150 and `DRILL_DAILY_TOTAL_UNITS` defaults
to 1000. A pronunciation clip uses one unit, a Flash Lite text request uses two,
and a skill-analysis request uses five. The database retains installation keys
and counters for up to 90 days of inactivity and usage counts for the current
and previous UTC day. It stores hashed session tokens with a 30-minute expiry.

For a hosted test build, set `EXPO_PUBLIC_DRILL_AI_URL` to the service’s public
HTTPS origin. Set `DRILL_APP_ATTEST_PRODUCTION=1` when testing against a backend
that requires production App Attest. Verify registration, writing feedback,
and speech from a signed physical-device build. The current App Store build
uses direct OpenRouter requests.
