FROM node:18 as deps
WORKDIR /app
ENV HUSKY=0
ENV NEXT_TELEMETRY_DISABLED 1

COPY .yarn ./.yarn
COPY .pnp.cjs .yarnrc.yml package.json yarn.lock* ./
RUN yarn install --immutable
RUN npm install -g esbuild

CMD ["/bin/bash"]