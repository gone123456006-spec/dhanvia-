# Single image: Express API + built public website + admin panel.
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY backend/package.json backend/package-lock.json backend/
RUN npm --prefix backend ci

COPY . .
RUN npm run build \
  && npm --prefix backend run build \
  && npm --prefix backend prune --omit=dev

FROM node:24-alpine
ENV NODE_ENV=production \
    PORT=3001 \
    FRONTEND_DIST=/app/frontend/dist
WORKDIR /app

COPY --from=build --chown=node:node /app/backend/package.json backend/package.json
COPY --from=build --chown=node:node /app/backend/node_modules backend/node_modules
COPY --from=build --chown=node:node /app/backend/dist backend/dist
COPY --from=build --chown=node:node /app/frontend/dist frontend/dist

USER node
WORKDIR /app/backend
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health/live" > /dev/null || exit 1
CMD ["node", "--enable-source-maps", "dist/server.js"]
