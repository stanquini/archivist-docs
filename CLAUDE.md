# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Monorepo in an early stage:

- `apps/api` — NestJS 12 API (the only app with code so far). All commands below run from here.
- `apps/web` — placeholder, empty.
- `docs/decisions` — intended for architecture decision records (currently empty).
- `docker-compose.yml` (root) — `db` (pgvector/pgvector:pg16) and `api` services.

Bun is the package manager (`bun.lock`); the runtime is Node 24 (see `apps/api/infra/dev/Dockerfile`).

## Commands (in `apps/api`)

```bash
bun install
bun run start:dev          # Nest watch mode
bun run build              # nest build -> dist/
bun run lint               # oxlint --type-aware src/ test/
bun run format             # prettier (single quotes, trailing commas)
bun run test               # vitest, unit specs: **/*.spec.ts
bun run test:e2e           # vitest, e2e specs: **/*.e2e-spec.ts (vitest.config.e2e.ts)
bun run test:cov

# single test file / single test name
bunx vitest run src/app.controller.spec.ts
bunx vitest run -t "<test name pattern>"
bunx vitest run --config ./vitest.config.e2e.ts test/app.e2e-spec.ts
```

Docker (from repo root): `docker compose up` starts Postgres and the API with hot reload. Postgres is exposed on host port **51214** (user/pass/db all `archivist`); the API on **3333**. Inside compose the API reaches the DB at `db:5432`; from the host use `localhost:51214`. `node_modules` lives in an anonymous volume, so after changing dependencies rebuild with `docker compose up -d --build -V api` (`-V` renews that volume).

## Prisma (v7, in progress on `feat/setup-prisma`)

- Config lives in `prisma.config.ts` (auto-detected by the CLI): `bunx prisma generate`, `bunx prisma migrate dev`.
- `DATABASE_URL` is read from `.env` via `dotenv/config` in that config file; the datasource block in `prisma/schema.prisma` intentionally has no `url` (Prisma 7 style).
- Generator is `prisma-client` with output `src/generated/prisma` (gitignored; also excluded from oxlint and prettier). It must live under `src/` because `tsconfig.build.json` has `rootDir: ./src`. Import the client from there, not from `@prisma/client`. Run `bunx prisma generate` after schema changes. The dev container runs `prisma migrate deploy && prisma generate` in its CMD on every start, not at image build, because the `./apps/api:/app` bind mount would hide build-time output.
- Prisma 7 requires a driver adapter: `src/prisma/prisma.service.ts` extends the generated `PrismaClient` with `PrismaPg` (reads `DATABASE_URL` via `ConfigService`). `PrismaModule` is `@Global`, so inject `PrismaService` anywhere without importing the module.
- Migrations go in `prisma/migrations`.
- Prisma agent skills are vendored under `apps/api/.agents/skills/` (symlinked from `.claude/skills/` and `.windsurf/skills/`, tracked by `skills-lock.json`) — use them for Prisma CLI/client/v7 questions.

## Architecture notes

- **ESM project** (`"type": "module"`, `module: nodenext`): relative imports must include the `.js` extension (e.g. `import { AppModule } from './app.module.js'`). `main.ts` uses top-level `await`.
- `src/app.module.ts` creates `ObserveModule`/`ObserveInstrument` via `createObserveModule()` from `@nestjs/observe`; `main.ts` passes `ObserveInstrument` to `NestFactory.create`. `ConfigModule` is global.
- **Required env vars**: `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` are read with `getOrThrow`, so the app (and the e2e test, which boots the full `AppModule`) fails to start without them. See `.env.example`. `PORT` defaults to 3000 in code but 3333 in `.env`/Docker.
- Vitest runs with `globals: true` (`describe`/`it`/`expect` without imports; `vitest/globals` is in tsconfig `types`).
- Lint rules of note (`.oxlintrc.json`): `no-floating-promises` is an error; `no-explicit-any` is off.
