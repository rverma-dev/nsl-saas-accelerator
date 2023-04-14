FROM node:18 as base
WORKDIR /app
COPY ./package.json ./
COPY ./package-lock.json ./
RUN yarn install --frozen-lockfile
COPY ./lerna.json ./

# Package @saas-accelerator/constructs
FROM base as saas-accelerator_constructs-build
WORKDIR /app/packages/@saas-accelerator/constructs
COPY  packages/@saas-accelerator/constructs/package-slim.json package.json
WORKDIR /app/
RUN yarn lerna bootstrap --scope=@saas-accelerator/constructs --includeDependencies
WORKDIR /app/packages/@saas-accelerator/constructs
COPY  packages/@saas-accelerator/constructs/package.json ./
RUN yarn build

# Package @saas-accelerator/installer
FROM base as saas-accelerator_installer-build
WORKDIR /app/packages/@saas-accelerator/installer
COPY  packages/@saas-accelerator/installer/package-slim.json package.json
WORKDIR /app/
RUN yarn lerna bootstrap --scope=@saas-accelerator/installer --includeDependencies
WORKDIR /app/packages/@saas-accelerator/installer
COPY  packages/@saas-accelerator/installer/package.json ./
RUN yarn build

# Package @saas-accelerator/eks
FROM base as saas-accelerator_eks-build
WORKDIR /app/packages/@saas-accelerator/eks
COPY  packages/@saas-accelerator/eks/package-slim.json package.json
WORKDIR /app/
COPY --from=saas-accelerator_constructs-build /app/packages/@saas-accelerator/constructs/package.json /app/packages/@saas-accelerator/constructs/
RUN yarn lerna bootstrap --scope=@saas-accelerator/eks --includeDependencies
COPY --from=saas-accelerator_constructs-build /app/packages/@saas-accelerator/constructs/ /app/packages/@saas-accelerator/constructs/
WORKDIR /app/packages/@saas-accelerator/eks
COPY  packages/@saas-accelerator/eks/package.json ./
RUN yarn build

# final stage
FROM base
COPY --from=saas-accelerator_constructs-build /app/packages/@saas-accelerator/constructs /app/packages/@saas-accelerator/constructs
COPY --from=saas-accelerator_installer-build /app/packages/@saas-accelerator/installer /app/packages/@saas-accelerator/installer
COPY --from=saas-accelerator_eks-build /app/packages/@saas-accelerator/eks /app/packages/@saas-accelerator/eks