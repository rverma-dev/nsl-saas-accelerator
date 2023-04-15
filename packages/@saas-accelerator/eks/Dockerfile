FROM node:18 as base
WORKDIR /app

# Dependencies
COPY ./package.json ./
COPY ./yarn.lock ./
COPY ./lerna.json ./
COPY ./tsconfig.json ./
RUN yarn install --frozen-lockfile

# Package @saas-accelerator/constructs
COPY packages/@saas-accelerator/constructs/lib/aws-codecommit/codecommit-secret/package.json /app/packages/@saas-accelerator/constructs/lib/aws-codecommit/codecommit-secret/package.json
RUN yarn workspace @saas-accelerator/lambda-codecommit-secret install --frozen-lockfile

COPY packages/@saas-accelerator/constructs/package.json /app/packages/@saas-accelerator/constructs/package.json
RUN yarn workspace @saas-accelerator/constructs install --frozen-lockfile

COPY packages/@saas-accelerator/constructs ./app/packages/@saas-accelerator/constructs
RUN ls packages/@saas-accelerator/constructs/lib && echo 'sasksdsd'
RUN yarn workspace @saas-accelerator/constructs build

# Package @saas-accelerator/eks
COPY packages/@saas-accelerator/eks/package.json packages/@saas-accelerator/eks/package.json
RUN yarn workspace @saas-accelerator/eks install --frozen-lockfile

COPY packages/@saas-accelerator/eks ./app/packages/@saas-accelerator/eks
RUN yarn workspace @saas-accelerator/eks build

FROM node:18-slim
WORKDIR /app
COPY --from=base /app/node_modules .
COPY --from=base  packages/@saas-accelerator/eks .
COPY --from=base /app/tsconfigjson .

CMD ["/bin/bash"]


