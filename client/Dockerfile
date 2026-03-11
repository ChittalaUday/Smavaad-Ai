# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Add build arguments for Vite environment variables
ARG VITE_SERVER_URL
ARG VITE_SOCKET_URI
ARG VITE_SIGNALLING_SERVER_URL
ARG VITE_AI_SERVICE_URL

# Set them as environment variables during build
ENV VITE_SERVER_URL=$VITE_SERVER_URL
ENV VITE_SOCKET_URI=$VITE_SOCKET_URI
ENV VITE_SIGNALLING_SERVER_URL=$VITE_SIGNALLING_SERVER_URL
ENV VITE_AI_SERVICE_URL=$VITE_AI_SERVICE_URL

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build


# Production stage
FROM nginx:stable-alpine AS production

WORKDIR /usr/share/nginx/html

# Copy built files from build stage
COPY --from=build /app/dist .
# Copy custom nginx config
COPY nginxDefault.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]











