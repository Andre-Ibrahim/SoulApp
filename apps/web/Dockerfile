FROM node:20-alpine AS builder

WORKDIR /app

COPY apps/web/package.json apps/web/package-lock.json* ./
RUN npm install

COPY apps/web/tsconfig.json apps/web/vite.config.ts apps/web/postcss.config.js apps/web/tailwind.config.js apps/web/index.html ./
COPY apps/web/src ./src

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:1.27-alpine

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
