import { nx_monorepo } from 'aws-prototyping-sdk';
import { PDKPipelineTsProject } from 'aws-prototyping-sdk/pipeline';
import { awscdk } from 'projen';
import { ArrowParens, TrailingComma } from 'projen/lib/javascript';
import { NodePackageManager } from 'projen/lib/javascript/node-package';

const awsSdkVersion = '^3.316.0';
const awsPDKVersion = '^0.17.0';

const root = new nx_monorepo.NxMonorepoProject({
  defaultReleaseBranch: 'main',
  devDeps: [`aws-prototyping-sdk@${awsPDKVersion}`],
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
  typescriptVersion: '^5.0.4',
  jestOptions: {
    jestVersion: '^29.1.0',
  },
});

new awscdk.AwsCdkTypeScriptApp({
  parent: root,
  outdir: 'packages/constructs',
  deps: [
    '@nslhb/eks-blueprints@1.6.2',
    `@aws-sdk/client-iam@${awsSdkVersion}`,
    `@aws-sdk/client-secrets-manager@${awsSdkVersion}`,
    'cdk-nag',
    'sync-request',
    'js-yaml@4.1.0',
    '@types/js-yaml@4.0.5',
  ],
  devDeps: ['@types/aws-lambda', 'aws-lambda'],
  defaultReleaseBranch: 'main',
  name: '@nsa/construct',
  packageManager: NodePackageManager.PNPM,
  cdkVersion: '2.76.0',
  constructsVersion: '10.2.3',
  minNodeVersion: root.minNodeVersion,
  jestOptions: {
    jestVersion: root.jest?.jestVersion,
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
  outdir: 'packages/demo',
  deps: [`@aws-prototyping-sdk/pdk-nag@${awsPDKVersion}`, `@aws-prototyping-sdk/static-website@${awsPDKVersion}`],
  defaultReleaseBranch: 'main',
  name: '@nsa/demo',
  packageManager: NodePackageManager.PNPM,
  cdkVersion: '2.76.0',
  minNodeVersion: root.minNodeVersion,
  jestOptions: {
    jestVersion: root.jest?.jestVersion,
  },
});

new PDKPipelineTsProject({
  parent: root,
  outdir: 'packages/silo',
  deps: [
    `@aws-prototyping-sdk/pdk-nag@${awsPDKVersion}`,
    `@aws-sdk/client-iam@${awsSdkVersion}`,
    `@aws-sdk/client-secrets-manager@${awsSdkVersion}`,
    '@jest/globals',
    '@types/aws-lambda',
  ],
  devDeps: ['aws-lambda'],
  defaultReleaseBranch: 'main',
  name: '@nsa/silo',
  packageManager: NodePackageManager.PNPM,
  cdkVersion: '2.76.0',
  minNodeVersion: root.minNodeVersion,
  jestOptions: {
    jestVersion: root.jest?.jestVersion,
  },
  prettier: false,
});

new PDKPipelineTsProject({
  parent: root,
  outdir: 'packages/pool',
  deps: [
    `@aws-prototyping-sdk/pdk-nag@${awsPDKVersion}`,
    `@aws-sdk/client-iam@${awsSdkVersion}`,
    `@aws-sdk/client-secrets-manager@${awsSdkVersion}`,
    '@jest/globals',
    '@types/aws-lambda',
  ],
  devDeps: ['aws-lambda'],
  defaultReleaseBranch: 'main',
  name: '@nsa/pool',
  packageManager: NodePackageManager.PNPM,
  cdkVersion: '2.76.0',
  minNodeVersion: root.minNodeVersion,
  jestOptions: {
    jestVersion: root.jest?.jestVersion,
  },
  prettier: false,
});

new awscdk.AwsCdkTypeScriptApp({
  parent: root,
  outdir: 'packages/installer',
  deps: [
    `@aws-prototyping-sdk/pdk-nag@${awsPDKVersion}`,
    `@aws-sdk/client-cloudformation@${awsSdkVersion}`,
    `@aws-sdk/client-codepipeline@${awsSdkVersion}`,
    `@aws-sdk/client-codebuild@${awsSdkVersion}`,
    `@aws-sdk/client-dynamodb@${awsSdkVersion}`,
    `@aws-sdk/client-ec2@${awsSdkVersion}`,
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
  cdkVersion: '2.76.0',
  minNodeVersion: root.minNodeVersion,
  jestOptions: {
    jestVersion: root.jest?.jestVersion,
  },
});

root.synth();
