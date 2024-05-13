FROM node:lts-alpine

WORKDIR /app
COPY package*.json /app/

RUN npm install

COPY ./ /app/

ENV HOSTNAME=127.0.0.1
ENV PORT=3001

EXPOSE 3001

ENTRYPOINT npm run start