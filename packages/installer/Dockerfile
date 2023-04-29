FROM node:18 as base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV HUSKY=0

# Dependencies
RUN npm install -g pnpm esbuild
COPY pnpm-lock.yaml ./
RUN pnpm fetch

COPY . ./
RUN pnpm install -r --offline     
RUN pnpm build

FROM node:18-slim
WORKDIR /app
COPY --from=base /app ./
RUN npm install -g esbuild
CMD ["/bin/bash"]