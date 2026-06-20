FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
# npm ci installs exactly what the committed lockfile pins (reproducible builds).
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-slim

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/tsconfig.json ./

# tsx runs server.ts (TypeScript) directly in production.
RUN npm install -g tsx

# Cloud Run will set the PORT environment variable
ENV NODE_ENV=production

# Drop root privileges (defense in depth).
USER node

# Local/runtime health parity (Cloud Run uses its own probes).
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["tsx", "server.ts"]
