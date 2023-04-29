import { awscdk } from 'projen';
import { TrailingComma, ArrowParens } from 'projen/lib/javascript';

const AWS_SDK_VERSION = '^3.316.0';
const CDK_VERSION = '2.76.0';

const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: CDK_VERSION,
  cdkVersionPinning: true,
  defaultReleaseBranch: 'main',
  name: 'nsa',
  description: 'Nsl SAAS Accelerator on AWS',
  packageName: '@nsa/installer',
  projenrcTs: true,
  prettier: true,
  prettierOptions: {
    settings: {
      singleQuote: true,
      tabWidth: 2,
      printWidth: 120,
      trailingComma: TrailingComma.ALL,
      arrowParens: ArrowParens.AVOID,
    },
  },
  stale: true,
  autoApproveUpgrades: true,
  autoApproveOptions: {
    allowedUsernames: ['rverma-nsl'],
  },
  autoMerge: true,
  buildWorkflow: true,
  dependabot: true,
  github: true,
  minNodeVersion: '18.0.0',
  typescriptVersion: '~5.0.4',
  deps: [
    '@aws-quickstart/eks-blueprints',
    `@aws-sdk/client-iam@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-secrets-manager@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-cloudformation@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-codepipeline@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-codebuild@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-dynamodb@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-ec2@${AWS_SDK_VERSION}`,
    `@aws-prototyping-sdk/pdk-nag`,
    `@aws-prototyping-sdk/cdk-graph`,
    '@aws-prototyping-sdk/static-website',
    '@types/js-yaml',
    'cdk-nag',
    'js-yaml@4.1.0',
    'sync-request@6.1.0',
    'source-map-support',
    'vm2@3.9.17',
  ],
  devDeps: ['@types/aws-lambda', 'aws-lambda'],
  lambdaAutoDiscover: true,
  lambdaOptions: {
    runtime: awscdk.LambdaRuntime.NODEJS_18_X,
    bundlingOptions: {
      externals: ['aws-sdk'],
      sourcemap: true,
    },
  },
});
project.synth();
