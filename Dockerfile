FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

ARG VITE_SSO_URL=https://auth.karanparmar.in
ENV VITE_SSO_URL=${VITE_SSO_URL}

RUN npm run build

FROM node:22-alpine

LABEL org.opencontainers.image.source=https://github.com/Karan-parmar-007/family-os-frontend
LABEL org.opencontainers.image.description="Family OS frontend for familyos.karanparmar.in"

WORKDIR /app

RUN apk add --no-cache wget

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=80 \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=80

COPY --from=builder /app/dist ./dist

EXPOSE 80

CMD ["node", "dist/server/index.mjs"]
