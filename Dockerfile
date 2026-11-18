# --- build the React client ---
FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client ./
RUN npm run build

# --- run the API (+ serve the built client) ---
FROM node:22-alpine
WORKDIR /app/server
ENV NODE_ENV=production CLIENT_DIST=/app/client-dist PORT=5000
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/src ./src
COPY --from=client-build /app/client/dist /app/client-dist
EXPOSE 5000
USER node
CMD ["node", "src/server.js"]
