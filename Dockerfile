# Use Node.js LTS version as base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json, then install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy only the required application files
COPY user-auth.js firebase-service-account.json .env ./

# Expose the port the service runs on
EXPOSE 4500

# Start the authentication service
CMD ["node", "src/app.js"]