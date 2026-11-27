# Build context is the REPOSITORY ROOT (the frontend imports the engine workspace package):
#   docker build -f frontend/Dockerfile .
# Base image tags were looked up on 2026-11-25. Pulling them was not possible from the build sandbox, see docs/pipeline/08-docker.md.
FROM node:24.20.0-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/engine/package.json packages/engine/
COPY frontend/package.json frontend/
RUN npm ci
COPY packages/engine packages/engine
COPY frontend frontend
# SITE_URL is the one public build argument. This app has no secrets and makes no network requests.
ARG SITE_URL=http://localhost:8080
ENV SITE_URL=$SITE_URL
RUN npm run build -w frontend

FROM nginx/nginx-unprivileged:1.31.7-alpine3.24
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://localhost:8080/health || exit 1
