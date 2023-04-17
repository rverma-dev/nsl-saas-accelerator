FROM node:18 as base
WORKDIR /app

# Dependencies
COPY ./package.json ./
COPY ./yarn.lock ./
COPY ./lerna.json ./
COPY ./tsconfig.json ./
RUN yarn install --frozen-lockfile

# Package @saas-accelerator/constructs
WORKDIR /app/packages/constructs/lib/aws-codecommit/codecommit-secret
COPY ./packages/constructs/lib/aws-codecommit/codecommit-secret/package.json package.json
RUN yarn install

WORKDIR /app/packages/constructs/
COPY ./packages/constructs/package.json package.json
RUN yarn install

COPY ./packages/constructs/lib/aws-codecommit lib/aws-codecommit
COPY ./packages/constructs/lib/aws-eks lib/aws-eks
COPY ./packages/constructs ./

RUN yarn --cwd /app/packages/constructs/lib/aws-codecommit/codecommit-secret build
RUN yarn build

# Package @saas-accelerator/eks
WORKDIR /app/packages/eks
COPY ./packages/eks/package.json package.json
RUN yarn install

COPY ./packages/eks/ ./

RUN yarn build

FROM node:18-slim
COPY --from=base /app /app
WORKDIR /app/packages/eks
CMD ["/bin/bash"]
