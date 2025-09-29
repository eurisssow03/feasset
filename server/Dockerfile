FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 8080

# Create startup script
RUN echo '#!/bin/sh\nnpx prisma migrate deploy\nnpm start' > start.sh && chmod +x start.sh

# Start the application
CMD ["./start.sh"]
