FROM node:18-alpine3.14
WORKDIR /home
COPY . .
RUN npm i
