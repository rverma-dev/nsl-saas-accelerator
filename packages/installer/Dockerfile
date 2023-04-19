FROM node:18 as base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV HUSKY=0
# Dependencies
COPY .yarn ./.yarn
COPY .yarnrc.yml package.json lerna.json tsconfig.json yarn.lock* nx.json ./
COPY packages/installer/package.json packages/installer/yarn.lock* ./packages/installer/
COPY packages/installer/lib/lambda-stream/package.json packages/installer/lib/lambda-stream/yarn.lock* ./packages/installer/lib/lambda-stream/
COPY packages/demo/package.json packages/demo/yarn.lock* ./packages/demo/
RUN yarn install --network-timeout 1000000

# Build app
FROM base as build
COPY packages/installer ./packages/installer/
COPY packages/demo ./packages/demo/
RUN yarn build

FROM node:18-slim
COPY --from=build /app/packages/installer /app
COPY --from=build /app/packages/demo /demo
COPY --from=build /app/node_modules /app/node_modules
WORKDIR /app
CMD ["/bin/bash"]