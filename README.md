# Standard HealthCare

Standard HealthCare is a React and Express application for structured symptom intake, risk-aware triage support, document-assisted context, and clinician-facing case review.

The app is designed to run in two modes:

- **Offline mode:** deterministic clinical logic, symptom flow, risk profiling, document handling, and local UI workflows run without an API key.
- **Online mode:** when `ANTHROPIC_API_KEY` is configured, the Express server enables the Claude-backed assessment bridge through `POST /api/claude`.

## Architecture

- `src/clinical/` contains the deterministic clinical engine: SPRT scoring, red flags, symptom matching, question selection, and risk profile calculations.
- `src/online/` contains the online assessment adapter, prompt construction, LLM response handling, and extracted symptom flow.
- `src/features/` separates major application workflows such as online assessment, document analysis, clinical result rendering, symptom chat, and offline assessment.
- `src/components/` and `src/ui/` contain reusable interface surfaces.
- `server.mjs` serves the production build and provides the optional Claude API bridge.

## Local Setup

```bash
npm install
npm run build
npm start
```

By default the app starts at:

```text
http://127.0.0.1:4173
```

Online mode is optional. To enable it locally, create `.env` and add:

```text
ANTHROPIC_API_KEY=sk-ant-...
```

## Render Deployment

Deploy this repository as a Render **Web Service**, not a Static Site.

Recommended settings:

```text
Language: Node
Build Command: npm ci --include=dev && npm run build
Start Command: npm start
Instance Type: Free
```

Environment variables:

```text
HOST=0.0.0.0
NODE_ENV=production
ONLINE_TEST_ONLY=0
CLAUDE_MODEL=claude-sonnet-4-6
CLAUDE_TIMEOUT_MS=120000
TEST_LOG_CONTENT=0
```

Do not set `PORT`; Render provides it automatically.

If `ANTHROPIC_API_KEY` is not configured, the server still starts and the offline application remains usable. Online API calls return `503 API_NOT_CONFIGURED` until the key is added.

## License

This project is proprietary. See [LICENSE](./LICENSE).

## Medical Notice

Standard HealthCare is clinical decision-support software. It is not a substitute for professional medical judgment, emergency care, diagnosis, or treatment by qualified clinicians.
