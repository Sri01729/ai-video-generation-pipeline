# Backend Service

## Setup
1. Copy `.env.example` to `.env` at the monorepo root and fill in credentials.
2. Install dependencies:
   ```sh
   pnpm install
   ```
3. Run locally:
   ```sh
   pnpm --filter backend dev
   ```

## Docker
- See root `docker-compose.yml` for container usage.

## Structure
- `src/config`: config files
- `src/services`: business logic
- `src/routes`: API routes
- `src/queues`: job queue processors
- `src/utils`: helpers, logger