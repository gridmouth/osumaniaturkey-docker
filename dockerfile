FROM node:21-alpine3.19

WORKDIR /app

COPY yarn.lock package.json ./

RUN yarn install

RUN yarn build

COPY . .

EXPOSE 3000

CMD ["yarn", "production"]