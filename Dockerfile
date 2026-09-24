# Stage 1: Build static assets
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production Server (Static SPA + Leaderboard API)
FROM node:22-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY server.mjs ./server.mjs

VOLUME ["/app/data"]
EXPOSE 80
CMD ["node", "server.mjs"]
