# Nebula Agent

Nebula Agent is a local-first Node.js + TypeScript worker that discovers potential teams/users via GitHub, analyzes candidates using Groq, and stores the structured results in a shared Supabase database. This worker is independent from the main Next.js Nebula application. Let it run locally without exposing cloud credentials to a frontend.

## Architecture
- **Supabase**: Persistent jobs queue, agent runs metadata, and generated leads are stored securely.
- **Queue/Resume Mechanism**: Jobs have progressive state tracking, allowing process restarts without losing state.
- **Groq AI Integration**: Abstracts model invocation to determine lead relevance based strictly on configured templates.
- **GitHub Researcher**: Applies deterministic logic (active repo rules) before spending AI resources to analyze suitability.

## Installation

```bash
cd nebula_agent
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and fill the variables.
- `GROQ_API_KEY`: Server-side Groq API Key.
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`: Service credentials linking to the Nebula DB.
- `GITHUB_TOKEN`: Real token for GraphQL or REST polling.

## Supabase Setup

Deploy the included migration files (in `migrations/`) to your Supabase project using the Supabase CLI or SQL editor.

## Running the Worker

To launch the worker in development mode (with hot restart capabilities based on polling interval):
```bash
npm run agent
```

## Stopping the Worker
Kill the terminal process (`Ctrl+C`). Any in-flight jobs will be reset or retried when the agent restarts based on timeout semantics within the queue state.

## Restart/Resume Behavior
On restart, the agent recovers stale locked jobs (resetting them to pending) and grabs jobs logically overdue based on \`available_at\`.

## Rate Limits
- Safety limits apply dynamically: local config (\`AGENT_MAX_AI_REQUESTS_PER_DAY\`) acts as a hard stop.
- Parses 429 Retry-After correctly to reschedule jobs instead of dropping them, with exponential backoff on routine HTTP errors up to 5 attempts.

## Security
- Runs locally. NO web server. NO open ports. No telemetry exposed.
- Service role tokens MUST not leave the server variables.
