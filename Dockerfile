ARG NODE_IMAGE=node:22.23.3-alpine3.24@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.30.6-alpine3.24@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03

FROM --platform=$BUILDPLATFORM ${NODE_IMAGE} AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts --no-audit --no-fund

COPY index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts ./
COPY public ./public
COPY src ./src
RUN npm run build


FROM ${NGINX_IMAGE} AS runtime

LABEL org.opencontainers.image.title="devops-task-ui" \
      org.opencontainers.image.description="OpsDesk web UI" \
      org.opencontainers.image.source="https://github.com/ahsenbulut/devops-task-ui"

# Alpine security fixes not yet in the pinned base image (CVE-2026-111497, CVE-2026-92392).
# Remove once the base image digest is updated to a release that contains them.
USER root
RUN apk add --no-cache --upgrade 'brotli-libs>=1.2.1-r0' 'curl>=8.23.0-r0' 'libcurl>=8.23.0-r0'

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

USER 101:101
EXPOSE 8080
