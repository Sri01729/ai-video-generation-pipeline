# AI Video Generation Pipeline Monorepo

## Overview
Welcome to the AI Video Generation Pipeline! This project is a full-stack, microservices-based AI video generation pipeline, built and maintained by Sai Srinivas Alahari.

Features:
- Next.js frontend (shadcn/ui, TailwindCSS)
- Node.js/Express backend
- Playwright-powered worker for browser automation (VoCloner, voice.ai)
- Supabase (Postgres) for data
- AWS Cognito (auth) & S3 (media storage)
- Bull/Redis for job queue
- OpenAI, AssemblyAI, VoCloner, Voice.ai integrations
- Docker, Turborepo, pnpm workspaces, GitHub Actions CI/CD

See [PROJECT_SETUP.md](./PROJECT_SETUP.md) for a deep dive into each technology, rationale, and best practices.

---

## Project Structure
```
ai-video-generation-pipeline/
├── apps/
│   ├── frontend/   # Next.js app (UI, auth, dashboard)
│   ├── backend/    # Node.js/Express API
│   └── worker/     # Playwright automation & job processor
├── packages/
│   └── shared/     # Shared types/utilities
├── .github/        # CI/CD workflows
├── .gitignore      # Comprehensive ignore rules
├── .env.example    # Environment variable template
├── docker-compose.yml
├── pnpm-workspace.yaml
├── turbo.json      # Turborepo pipeline config
├── PROJECT_SETUP.md
├── CHANGELOG.md    # Release notes (see below)
└── LICENSE         # License info
```

---

## Prerequisites
- Node.js >= 18
- pnpm (recommended)
- Docker (for local dev/deployment)
- Git

---

## Setup
1. **Clone the repo:**
   ```sh
   git clone https://github.com/Sri01729/ai-video-pipeline.git
   cd ai-video-pipeline
   ```
2. **Install dependencies:**
   ```sh
   pnpm install
   ```
3. **Copy and configure environment variables:**
   ```sh
   cp .env.example .env
   # Edit .env with your real credentials
   ```

---

## Development
- **Start all apps:**
  ```sh
  pnpm dev
  ```
- **Start a specific app:**
  ```sh
  pnpm --filter backend dev
  pnpm --filter frontend dev
  pnpm --filter worker dev
  ```
- **Run with Docker Compose:**
  ```sh
  docker-compose up --build
  ```

---

## Deployment
- See Dockerfiles and `docker-compose.yml` for containerization.
- GitHub Actions CI/CD is set up in `.github/workflows/ci.yml`.

---

## Contributing
- Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.
- All code, build, and test artifacts are ignored via `.gitignore`.
- Use Playwright for all new browser automation scripts (Puppeteer is not used).

---

## Maintainer
- **Sai Srinivas Alahari** ([GitHub](https://github.com/Sri01729))

---

## User Workflow
See the "Example User Workflow" section in [PROJECT_SETUP.md](./PROJECT_SETUP.md) for a step-by-step of what happens from user auth to final video output.

---

## TODO
- Add more E2E tests for edge cases
- Improve error handling and monitoring
- Add more API docs (OpenAPI/Swagger)
- Polish UI/UX for dashboard
- [Add your own ideas here!]

---

## CHANGELOG
See [CHANGELOG.md](./CHANGELOG.md) for release notes and version history.

---

## License
See [LICENSE](./LICENSE) for license details. All rights reserved.
