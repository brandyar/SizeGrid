# Stage 1: Build static React SPA
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package descriptors first to benefit from Docker layer caching
COPY package.json ./
RUN npm install

# Copy application source files
COPY . .

# Run build to produce static folder "dist"
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:1.25-alpine
RUN apk add --no-cache ca-certificates
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
