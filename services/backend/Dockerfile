FROM node:26-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY src ./src

ENV PORT=8787
ENV DATA_DIR=/app/data

EXPOSE 8787

CMD ["node", "src/index.ts"]
