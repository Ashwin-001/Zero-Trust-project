# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Expose Vite's default port
EXPOSE 5173

# Start Vite with the --host flag to allow external access
CMD ["npm", "run", "dev", "--", "--host"]
