# Worker Service

## Setup
1. Copy `.env.example` to `.env` at the monorepo root and fill in credentials.
2. Install dependencies:
   ```sh
   pnpm install
   ```
3. Run locally:
   ```sh
   pnpm --filter worker dev
   ```

## Docker
- See root `docker-compose.yml` for container usage.

## Structure
- `src/`: worker logic, queue consumers, browser automation