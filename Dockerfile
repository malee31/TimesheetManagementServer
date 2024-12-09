FROM node:20-alpine

# Create a project directory
WORKDIR /app

# Install all dependencies
COPY package.json package-lock.json ./
RUN npm install

# Add remaining project files
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
