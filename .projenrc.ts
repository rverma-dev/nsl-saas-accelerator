import { NxMonorepoProject } from '@aws-prototyping-sdk/nx-monorepo';
import { awscdk } from 'projen';
import { ArrowParens, TrailingComma } from 'projen/lib/javascript';
import { NodePackageManager } from 'projen/lib/javascript/node-package';
import { TypeScriptProject } from 'projen/lib/typescript';

const AWS_SDK_VERSION = '^3.316.0';
const CDK_VERSION = '2.76.0';
const CONSTRUCT_VERSION = '10.2.5';
const JEST_VERSION = '^29.1.0';

const root = new NxMonorepoProject({
  defaultReleaseBranch: 'main',
  devDeps: ['@aws-prototyping-sdk/nx-monorepo'],
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
  nxConfig: {
    cacheableOperations: ['compile', 'build', 'bundle', 'eslint', 'test', 'synth'],
    affectedBranch: 'main',
    nxCloudReadOnlyAccessToken: 'ZjMyMGNjMDgtMmQzNi00MDJkLTlmZWYtZjcwOTdhMmNlYTFifHJlYWQtd3JpdGU=',
  },
});

new TypeScriptProject({
  parent: root,
  outdir: 'packages/common',
  deps: [],
  defaultReleaseBranch: 'main',
  name: '@nsa/common',
  packageManager: NodePackageManager.PNPM,
  minNodeVersion: root.minNodeVersion,
  jest: false,
  prettier: false,
});

const constructs = new awscdk.AwsCdkConstructLibrary({
  parent: root,
  outdir: 'packages/constructs',
  bundledDeps: [
    '@nslhb/eks-blueprints@1.6.21',
    `@aws-sdk/client-iam@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-secrets-manager@${AWS_SDK_VERSION}`,
    '@types/js-yaml@4.0.5',
    'js-yaml@4.1.0',
    'sync-request@6.1.0',
    '@types/fs-extra@11.0.1',
    '@types/semver@7.3.13',
  ],
  peerDeps: ['cdk-nag'],
  devDeps: ['@types/aws-lambda', 'aws-lambda'],
  defaultReleaseBranch: 'main',
  name: '@nsa/construct',
  packageManager: NodePackageManager.PNPM,
  cdkVersion: CDK_VERSION,
  constructsVersion: CONSTRUCT_VERSION,
  minNodeVersion: root.minNodeVersion,
  jestOptions: {
    jestVersion: JEST_VERSION,
    jestConfig: {
      detectOpenHandles: true,
    },
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
  bin: {
    'pdk@pnpm-link-bundled-transitive-deps': './scripts/pnpm/link-bundled-transitive-deps.ts',
  },
});

const demo = new awscdk.AwsCdkTypeScriptApp({
  parent: root,
  outdir: 'packages/demo',
  deps: [
    `@aws-prototyping-sdk/pdk-nag`,
    `@aws-prototyping-sdk/static-website`,
    '@nsa/common',
    '@nsa/construct',
  ],
  defaultReleaseBranch: 'main',
  name: '@nsa/demo',
  packageManager: NodePackageManager.PNPM,
  cdkVersion: CDK_VERSION,
  constructsVersion: CONSTRUCT_VERSION,
  minNodeVersion: root.minNodeVersion,
  jestOptions: {
    jestVersion: JEST_VERSION,
  },
});
root.addImplicitDependency(demo, constructs);

new awscdk.AwsCdkTypeScriptApp({
  parent: root,
  outdir: 'packages/silo',
  deps: [
    `@aws-prototyping-sdk/pdk-nag`,
    `@aws-sdk/client-iam@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-secrets-manager@${AWS_SDK_VERSION}`,
    '@jest/globals',
    '@types/aws-lambda',
    '@nsa/common',
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
    jestVersion: JEST_VERSION,
  },
});

new awscdk.AwsCdkTypeScriptApp({
  parent: root,
  outdir: 'packages/pool',
  deps: [
    `@aws-prototyping-sdk/pdk-nag`,
    `@aws-sdk/client-iam@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-secrets-manager@${AWS_SDK_VERSION}`,
    '@jest/globals',
    '@types/aws-lambda',
    '@nsa/common',
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
    jestVersion: JEST_VERSION,
  },
  lambdaOptions: {
    runtime: awscdk.LambdaRuntime.NODEJS_18_X,
    bundlingOptions: {
      externals: ['aws-sdk'],
      sourcemap: true,
    },
  },
});

new awscdk.AwsCdkTypeScriptApp({
  parent: root,
  outdir: 'packages/installer',
  deps: [
    `@aws-sdk/client-cloudformation@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-codepipeline@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-codebuild@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-dynamodb@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-ec2@${AWS_SDK_VERSION}`,
    `@aws-prototyping-sdk/pdk-nag`,
    `@aws-prototyping-sdk/cdk-graph`,
    '@types/aws-lambda',
    '@nsa/common',
    '@nsa/construct',
    '@nsa/demo',
    '@nsa/silo',
    '@nsa/pool',
    'cdk-nag',
    'source-map-support',
    'vm2@3.9.17',
    'cdk-docker-image-deployment@^0.0.234',
  ],
  devDeps: ['aws-lambda'],
  defaultReleaseBranch: 'main',
  name: '@nsa/installer',
  packageManager: NodePackageManager.PNPM,
  cdkVersion: CDK_VERSION,
  constructsVersion: CONSTRUCT_VERSION,
  minNodeVersion: root.minNodeVersion,
  jestOptions: {
    jestVersion: JEST_VERSION,
  },
});

root.synth();
