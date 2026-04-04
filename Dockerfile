# Build stage
FROM node:krypton-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY scripts/ ./scripts/

# Build NestJS application
RUN npm run build

# Production stage
FROM node:krypton-alpine AS production

LABEL org.opencontainers.image.source="https://github.com/WFCD/warframe-status"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev --ignore-scripts

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Copy any necessary runtime files (cache directory structure, etc.)
RUN mkdir -p caches

ENV HOSTNAME=0.0.0.0
ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

# Use node directly to run the built application
ENTRYPOINT ["node", "dist/main.js"]
