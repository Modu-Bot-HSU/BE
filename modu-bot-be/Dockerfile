# Node.js 22 버전으로 변경
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# pnpm v11 이상을 안정적으로 지원하기 위해 corepack 설정
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM node:22-alpine

WORKDIR /usr/src/app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["pnpm", "run", "start:prod"]