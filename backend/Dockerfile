# Build stage / Runtime for Node.js backend
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy dependency specifications first to leverage Docker layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy application source code (excluding files in .dockerignore)
COPY . .

# Expose backend service port
EXPOSE 5000

# Start backend server
CMD ["node", "server.js"]
