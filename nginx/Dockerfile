# Stage 1: Build the frontend (reuse the frontend Dockerfile logic)
FROM node:20-alpine AS frontend_builder
WORKDIR /app

# Paths are now relative to the root project directory (the build context)
COPY ./frontend/package*.json ./
RUN npm install
COPY ./frontend/. . 

ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN echo "VITE_API_URL is set to: $VITE_API_URL" # Optional: Debug build args
RUN npm run build

# Stage 2: Setup Nginx
FROM nginx:stable-alpine

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration (this path is relative to the nginx Dockerfile location IF context is .)
# But since the Dockerfile is IN the nginx dir, this path is correct relative to root context
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy static frontend build artifacts from the builder stage
COPY --from=frontend_builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]