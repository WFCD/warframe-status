# Build stage
FROM node:krypton-alpine AS build

WORKDIR /app

# Copy package files and build tooling config
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY biome.json ./

# Install dependencies without lifecycle scripts (prepare runs codegen and needs scripts/)
RUN npm ci --ignore-scripts

# Copy source and codegen scripts needed for build
COPY src/ ./src/
COPY scripts/ ./scripts/

# Build NestJS application
RUN npm run build

# Production stage
FROM node:krypton-alpine AS production

LABEL org.opencontainers.image.source="https://github.com/WFCD/warframe-status"
LABEL org.opencontainers.image.description="Warframe Community Developers REST API for worldstate and other utility data."

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

# ESM build output needs tsx to resolve extensionless relative imports
ENTRYPOINT ["node", "--import", "tsx", "dist/main.js"]
