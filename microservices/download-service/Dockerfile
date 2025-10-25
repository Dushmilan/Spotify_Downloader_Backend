# Use Node.js 18 Alpine image
FROM node:18-alpine

# Install Python and other dependencies
RUN apk add --no-cache python3 py3-pip ffmpeg

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3003

# Start the application
CMD ["npm", "start"]