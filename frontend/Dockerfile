# Stage 1: Build the React application
FROM node:23-alpine3.20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy remaining source code
COPY . .

# Build Argument for API URL (can be overridden in docker-compose)
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

# Build for production
RUN npm run build

# The build output is now in /app/dist

# We don't need a final stage here, as Nginx will copy from this 'builder' stage.