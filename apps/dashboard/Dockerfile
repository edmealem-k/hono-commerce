FROM node:24-slim AS builder
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app

COPY . .
RUN --mount=type=cache,target=/root/.bun/install/cache bun install

ARG NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}
ENV NODE_ENV=production
RUN cd apps/dashboard && bun run build
# standalone output excludes public/; ensure it exists so the runner copy never fails
RUN mkdir -p apps/dashboard/public

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/dashboard/.next/standalone ./
COPY --from=builder /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=builder /app/apps/dashboard/public ./apps/dashboard/public

ENV HOSTNAME=0.0.0.0
ENV PORT=3002
EXPOSE 3002

CMD ["node", "apps/dashboard/server.js"]
