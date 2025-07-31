FROM node:21-alpine3.19

WORKDIR /app

COPY yarn.lock package.json ./

RUN yarn

COPY . .

RUN yarn build

EXPOSE 3000

CMD ["yarn", "production"]
