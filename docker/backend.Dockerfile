FROM node:20-alpine

WORKDIR /app

# Copy AI Engine and Backend package files
COPY ai-engine/package*.json ./ai-engine/
COPY backend/package*.json ./backend/

WORKDIR /app/ai-engine
RUN npm ci

WORKDIR /app/backend
RUN npm ci

COPY ai-engine/ /app/ai-engine/
COPY backend/ /app/backend/

EXPOSE 5000

ENV NODE_ENV=production

CMD ["npm", "start"]
