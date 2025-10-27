FROM node:jod-alpine AS build

COPY package*.json ./
RUN npm install

FROM node:jod-alpine AS production

LABEL org.opencontainers.image.source = "https://github.com/WFCD/warframe-status"
WORKDIR /app

COPY ./ /app/
COPY --from=build node_modules/ node_modules/

ENV HOSTNAME=0.0.0.0
ENV PORT=3001

EXPOSE 3001
ENTRYPOINT ["npm", "start"]
