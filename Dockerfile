FROM node:18 as deps
WORKDIR /app
ENV HUSKY=0
ENV NEXT_TELEMETRY_DISABLED 1

COPY .yarn ./.yarn
COPY .pnp.cjs .yarnrc.yml package.json yarn.lock* ./
RUN yarn install

FROM node:18-slim AS runner
COPY --from=deps /root/.yarn /root/.yarn
CMD ["/bin/bash"]