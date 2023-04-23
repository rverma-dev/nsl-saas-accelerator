import { nx_monorepo } from 'aws-prototyping-sdk';
import { PDKPipelineTsProject } from 'aws-prototyping-sdk/pipeline';
import { awscdk } from 'projen';
import { ArrowParens, TrailingComma } from 'projen/lib/javascript';
import { NodePackageManager } from 'projen/lib/javascript/node-package';

const AWS_SDK_VERSION = '^3.316.0';
const AWS_PDK_VERSION = '0.17.0';
const CDK_VERSION = '2.76.0';
const CONSTRUCT_VERSION = '10.2.2';
const JEST_VERION = '^29.1.0';

const root = new nx_monorepo.NxMonorepoProject({
  defaultReleaseBranch: 'main',
  devDeps: [`aws-prototyping-sdk@${AWS_PDK_VERSION}`, 'lerna@^6.6.1', '@nrwl/devkit@^15.9.2'],
  name: 'nsa',
  projenrcTs: true,
  description: 'Nsl SAAS Accelerator on AWS',
  packageName: '@nsa/aws',
  packageManager: NodePackageManager.PNPM,
  prettierOptions: {
    settings: {
      singleQuote: true,
      tabWidth: 2,
      printWidth: 120,
      trailingComma: TrailingComma.ALL,
      arrowParens: ArrowParens.AVOID,
    },
  },
  gitignore: ['.idea', '.vscode'],
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
  vscode: true,
});

new awscdk.AwsCdkConstructLibrary({
  parent: root,
  outdir: 'packages/constructs',
  bundledDeps: [
    '@nslhb/eks-blueprints@1.6.20',
    `@aws-sdk/client-iam@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-secrets-manager@${AWS_SDK_VERSION}`,
    '@types/js-yaml@4.0.5',
    'js-yaml@4.1.0',
    'sync-request',
  ],
  peerDeps: ['cdk-nag'],
  devDeps: ['@types/aws-lambda', 'aws-lambda', 'jsii-pacmak@1.80.0'],
  defaultReleaseBranch: 'main',
  name: '@nsa/construct',
  packageManager: NodePackageManager.PNPM,
  cdkVersion: CDK_VERSION,
  constructsVersion: CONSTRUCT_VERSION,
  minNodeVersion: root.minNodeVersion,
  jestOptions: {
    jestVersion: JEST_VERION,
  },
  lambdaOptions: {
    runtime: awscdk.LambdaRuntime.NODEJS_18_X,
    bundlingOptions: {
      externals: ['aws-sdk'],
      sourcemap: true,
    },
  },
  author: 'Rohit',
  authorAddress: 'rohit.verma@nslhub.com',
  repositoryUrl: 'https://github.com/rverma-nsl/nsl-saas-accelerator.git',
  jsiiVersion: '5.0.6',
});

new PDKPipelineTsProject({
  parent: root,
  outdir: 'packages/demo',
  deps: [`@aws-prototyping-sdk/pdk-nag@${AWS_PDK_VERSION}`, `@aws-prototyping-sdk/static-website@${AWS_PDK_VERSION}`],
  defaultReleaseBranch: 'main',
  name: '@nsa/demo',
  packageManager: NodePackageManager.PNPM,
  cdkVersion: CDK_VERSION,
  constructsVersion: CONSTRUCT_VERSION,
  minNodeVersion: root.minNodeVersion,
  jestOptions: {
    jestVersion: JEST_VERION,
  },
  prettier: false,
});

new PDKPipelineTsProject({
  parent: root,
  outdir: 'packages/silo',
  deps: [
    `@aws-prototyping-sdk/pdk-nag@${AWS_PDK_VERSION}`,
    `@aws-sdk/client-iam@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-secrets-manager@${AWS_SDK_VERSION}`,
    '@jest/globals',
    '@types/aws-lambda',
    '@nsa/construct',
  ],
  devDeps: ['aws-lambda'],
  defaultReleaseBranch: 'main',
  name: '@nsa/silo',
  packageManager: NodePackageManager.PNPM,
  cdkVersion: CDK_VERSION,
  constructsVersion: CONSTRUCT_VERSION,
  minNodeVersion: root.minNodeVersion,
  jestOptions: {
    jestVersion: JEST_VERION,
  },
  prettier: false,
  sampleCode: true,
});

new PDKPipelineTsProject({
  parent: root,
  outdir: 'packages/pool',
  deps: [
    `@aws-prototyping-sdk/pdk-nag@${AWS_PDK_VERSION}`,
    `@aws-sdk/client-iam@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-secrets-manager@${AWS_SDK_VERSION}`,
    '@jest/globals',
    '@types/aws-lambda',
    '@nsa/construct',
  ],
  devDeps: ['aws-lambda'],
  defaultReleaseBranch: 'main',
  name: '@nsa/pool',
  packageManager: NodePackageManager.PNPM,
  cdkVersion: CDK_VERSION,
  constructsVersion: CONSTRUCT_VERSION,
  minNodeVersion: root.minNodeVersion,
  jestOptions: {
    jestVersion: JEST_VERION,
  },
  prettier: false,
  sampleCode: true,
});

new awscdk.AwsCdkTypeScriptApp({
  parent: root,
  outdir: 'packages/installer',
  deps: [
    `@aws-prototyping-sdk/pdk-nag@${AWS_PDK_VERSION}`,
    `@aws-sdk/client-cloudformation@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-codepipeline@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-codebuild@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-dynamodb@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-ec2@${AWS_SDK_VERSION}`,
    '@types/aws-lambda',
    '@nsa/demo',
    '@nsa/silo',
    '@nsa/pool',
    'source-map-support',
    'vm2@3.9.17',
  ],
  devDeps: ['aws-lambda'],
  defaultReleaseBranch: 'main',
  name: '@nsa/installer',
  packageManager: NodePackageManager.PNPM,
  cdkVersion: CDK_VERSION,
  constructsVersion: CONSTRUCT_VERSION,
  minNodeVersion: root.minNodeVersion,
  jestOptions: {
    jestVersion: JEST_VERION,
  },
});

root.synth();
