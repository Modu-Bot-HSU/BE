FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# pnpm 버전을 9.15.4 고정
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM node:20-alpine
WORKDIR /usr/src/app

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /usr/src/app/dist ./dist
EXPOSE 3000
CMD ["pnpm", "run", "start:prod"]