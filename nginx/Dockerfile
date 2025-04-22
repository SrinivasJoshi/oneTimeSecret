# Use nginx alpine as the base image
FROM nginx:stable-alpine

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy pre-built frontend files
# Assuming you've already built the frontend locally and have the dist folder
COPY ./frontend/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]