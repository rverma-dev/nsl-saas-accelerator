FROM node:18 as base
WORKDIR /app

# Dependencies
COPY ./package.json ./
COPY ./yarn.lock ./
COPY ./lerna.json ./
COPY ./tsconfig.json ./
RUN yarn install --frozen-lockfile

# Package @saas-accelerator/installer
FROM base as saas-accelerator_installer-build
WORKDIR /app/packages/@saas-accelerator/installer
COPY  packages/@saas-accelerator/installer/package.json package.json
WORKDIR /app/
RUN yarn workspace @saas-accelerator/installer install --includeDependencies
WORKDIR /app/packages/@saas-accelerator/installer
COPY  packages/@saas-accelerator/installer ./
RUN yarn build
CMD ["/bin/bash"]
