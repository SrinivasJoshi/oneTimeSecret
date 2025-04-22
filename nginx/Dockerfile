FROM nginx:stable-alpine

ARG VITE_API_URL=/api
ARG NGINX_ENVIRONMENT=local

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Use shell command to select the correct config file
RUN if [ -f "/tmp/nginx.${NGINX_ENVIRONMENT}.conf" ]; then \
      echo "Using nginx.${NGINX_ENVIRONMENT}.conf"; \
    else \
      echo "Configuration for ${NGINX_ENVIRONMENT} not found, using nginx.local.conf"; \
    fi

# Copy all potential config files to a temp location
COPY ./nginx/nginx.*.conf /tmp/

# Use shell command to select the correct file
RUN if [ -f "/tmp/nginx.${NGINX_ENVIRONMENT}.conf" ]; then \
      cp /tmp/nginx.${NGINX_ENVIRONMENT}.conf /etc/nginx/conf.d/default.conf; \
    else \
      cp /tmp/nginx.local.conf /etc/nginx/conf.d/default.conf; \
    fi

# Copy pre-built frontend files
COPY ./frontend/dist /usr/share/nginx/html

# Create runtime environment file for the frontend
RUN echo "VITE_API_URL=${VITE_API_URL}" > /usr/share/nginx/html/.env

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]