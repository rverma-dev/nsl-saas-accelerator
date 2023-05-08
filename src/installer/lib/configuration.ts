import { DefaultStackSynthesizer } from 'aws-cdk-lib';

export const DEPLOYMENT_TABLE_NAME = 'saas-pipelines'; // DynamoDB table name that will be created for deployment management
export const REPOSITORY_OWNER = 'rverma-nsl'; // CodeCommit repository name that holds the code
export const REPOSITORY_NAME = 'nsl-saas-accelerator'; // CodeCommit repository name that holds the code
export const GITHUB_DOMAIN = 'token.actions.githubusercontent.com';

export const CDK_VERSION = '2.78.0'; // Used to set CodePipeline CLI version

// For production use, specifying exact account and region here is recommended
export const TOOLCHAIN_ENV = {
  region: 'ap-south-1',
  account: process.env.CDK_DEFAULT_ACCOUNT
};

export const ASSET_ECR = `${TOOLCHAIN_ENV.account}.dkr.ecr.${TOOLCHAIN_ENV.region}.amazonaws.com/cdk-${DefaultStackSynthesizer.DEFAULT_QUALIFIER}-container-assets-${TOOLCHAIN_ENV.account}-${TOOLCHAIN_ENV.region}`;
export const YARN = './.yarn/releases/yarn-3.5.1.cjs';
