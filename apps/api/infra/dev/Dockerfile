# Ambiente de desenvolvimento da API (NestJS + Bun como package manager)
# Uso: docker compose up api  (contexto de build: apps/api)

FROM node:24-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends procps \
    && rm -rf /var/lib/apt/lists/*

COPY --from=oven/bun:1.4 /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app

ENV NODE_ENV=development \
    PORT=3333

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile


COPY . .

EXPOSE 3333

# Hot reload via Nest CLI
CMD ["bun", "run", "start:dev"]
