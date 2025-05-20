# Contributing to AI Video Pipeline

Thank you for your interest in contributing! Please follow these guidelines to help us maintain a high-quality, production-grade codebase.

## Getting Started
- Fork the repo and clone your fork.
- Create a new branch for your feature or fix: `git checkout -b feat/your-feature` or `fix/your-bug`.
- Install dependencies: `pnpm install` (from the monorepo root).

## Code Style
- Use TypeScript everywhere.
- Run `pnpm lint` and `pnpm format` before committing.
- All code, build, and test artifacts are ignored via `.gitignore`.
- Use Playwright for browser automation (not Puppeteer).

## Pre-commit Hooks
- Pre-commit hooks (Husky + lint-staged) will auto-run lint and format on staged files.
- Do not skip hooks unless absolutely necessary.

## Commit Messages
- Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):
  - `feat: add new feature`
  - `fix: fix a bug`
  - `chore: tooling or dependency update`
  - `docs: documentation only changes`

## Pull Requests
- Open PRs against `main`.
- Link related issues in the PR description.
- Include a clear summary of your changes and why they're needed.
- Add/modify tests for any new/changed functionality.
- Ensure CI passes before requesting review.

## Code Review
- At least one approval is required to merge.
- Address all review comments.
- Squash and merge preferred.

## Environments
- Use `.env`, `.env.staging`, `.env.production` for config.
- Never commit secrets.

## Issues
- Use the issue templates for bug reports and feature requests.

## Questions?
Open an issue or discussion in the repo.