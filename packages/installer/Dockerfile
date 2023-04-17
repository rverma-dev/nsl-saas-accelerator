FROM node:18 as base
WORKDIR /app

# Dependencies
COPY ./package.json ./
COPY ./yarn.lock ./
COPY ./lerna.json ./
COPY ./tsconfig.json ./
RUN yarn install --frozen-lockfile

WORKDIR /app/packages/installer
COPY  packages/installer/package.json package.json
RUN yarn install

WORKDIR /app/packages/installer
COPY  packages/installer ./
RUN yarn build

FROM node:18-slim
COPY --from=base /app/packages/installer /app
COPY --from=base /app/tsconfig.json /app/tsconfig.json
WORKDIR /app
CMD ["/bin/bash"]