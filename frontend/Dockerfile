# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package*.json ./

# Install all dependencies required for Vite build
RUN npm ci

# Copy frontend source code
COPY . .

# Build production assets (Vite outputs to /app/dist)
RUN npm run build

# Stage 2: Serve production assets with Nginx
FROM nginx:alpine

# Copy custom Nginx configuration with client-side routing fallback and API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose frontend server port
EXPOSE 5173

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
