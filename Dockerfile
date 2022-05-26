FROM node:14.18.3-stretch

WORKDIR /app
COPY package.json tsconfig.json tsconfig.build.json .sequelizerc nest-cli.json ./

RUN npm install

CMD npm run start:dev
