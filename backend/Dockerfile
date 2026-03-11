# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

COPY package*.json ./
RUN npm ci --only=production

COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
# Copy seeds or other necessary files if they are not in dist
# Based on the structure, seeds might be in src/seeds but compiled to dist/seeds
# Let's check if we need to copy anything else

EXPOSE 5000

# Start the application using PM2
CMD ["pm2-runtime", "dist/server.js", "--name", "samvaad-backend"]
