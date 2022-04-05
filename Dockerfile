FROM node:16-alpine3.14
WORKDIR /home
COPY . .
RUN npm i \
@gathertown/gather-game-client \
@gathertown/gather-game-common \
@slack/bolt \
dotenv \
isomorphic-ws 

