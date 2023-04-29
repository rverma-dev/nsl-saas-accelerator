FROM node:18 as deps
WORKDIR /app
ENV HUSKY=0

COPY .yarn ./.yarn
COPY .pnp.cjs .yarnrc.yml package.json yarn.lock* ./
RUN yarn install --immutable

FROM node:18-slim
WORKDIR /app
COPY --from=deps /app/.yarn ./.yarn
COPY --from=deps /app/.pnp.cjs ./pnp.cjs
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm install -g esbuild
RUN yarn build

CMD ["/bin/bash"]