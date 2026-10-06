# Ambiente de desenvolvimento da API (NestJS + Bun como package manager)
# Uso: docker compose up api  (contexto de build: apps/api)

FROM node:24-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends procps openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=oven/bun:1.4 /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app

ENV NODE_ENV=development \
    PORT=3333

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3333

# Migrations + client Prisma no start (o bind mount do compose esconde o que
# fosse gerado no build), depois hot reload via Nest CLI
CMD ["sh", "-c", "bun x prisma migrate deploy && bun x prisma generate && bun run start:dev"]
