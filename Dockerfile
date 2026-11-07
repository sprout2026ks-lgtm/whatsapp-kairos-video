FROM node:20-alpine

WORKDIR /app

# Copy root and backend package files
COPY package.json ./
COPY backend/package*.json ./backend/

# Install backend dependencies
RUN npm install --prefix backend --omit=dev

# Copy application files
COPY . .

# Expose server port
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

# Start server
CMD ["node", "backend/server.js"]
