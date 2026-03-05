FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY tsconfig.json nest-cli.json ./
COPY src ./src

ENV NODE_ENV=production

RUN npm run build

EXPOSE 3001

CMD ["node", "dist/main.js"]
