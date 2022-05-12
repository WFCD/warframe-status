FROM node:16 as build-stage

WORKDIR /app
COPY package*.json /app/
RUN npm install
COPY ./ /app/
EXPOSE 3001

ENTRYPOINT npm run start
