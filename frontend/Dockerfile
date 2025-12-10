# =============================================================================
# Multi-stage Dockerfile for SMELT Frontend (React + Vite + Nginx)
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build stage - Build the React app
# -----------------------------------------------------------------------------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build argument for WebSocket URL
ARG VITE_WS_URL
ENV VITE_WS_URL=${VITE_WS_URL}

# Build the app
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Runtime stage - Serve with Nginx
# -----------------------------------------------------------------------------
FROM nginx:stable-bookworm AS runtime

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
