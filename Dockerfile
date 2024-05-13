FROM node:lts-alpine

WORKDIR /app
COPY package*.json /app/

RUN npm install

COPY ./ /app/

ENV HOSTNAME=0.0.0.0
ENV PORT=3001

EXPOSE 3001

ENTRYPOINT npm run start