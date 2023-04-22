import { nx_monorepo } from 'aws-prototyping-sdk';
import { awscdk } from 'projen';
import { ArrowParens, TrailingComma } from 'projen/lib/javascript';
import { NodePackageManager } from 'projen/lib/javascript/node-package';

const awsSdkVersion = '^3.316.0';

const root = new nx_monorepo.NxMonorepoProject({
  defaultReleaseBranch: 'main',
  devDeps: ['aws-prototyping-sdk'],
  name: 'nsa',
  projenrcTs: true,
  description: 'Nsl SAAS Accelerator on AWS',
  packageName: '@nsa/aws',
  packageManager: NodePackageManager.PNPM,
  workspaceConfig: {
    additionalPackages: ['packages/eks-blueprints'],
  },
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
    allowedUsernames: ['rverma-nsl']
  },
  autoMerge: true,
  buildWorkflow: true,
  dependabot: true,
  github: true,
});

new awscdk.AwsCdkTypeScriptApp({
  parent: root,
  outdir: 'packages/constructs',
  deps: [
    '@aws-quickstart/eks-blueprints',
    `@aws-sdk/client-iam@${awsSdkVersion}`,
    `@aws-sdk/client-secrets-manager@${awsSdkVersion}`,
    'cdk-nag',
    'sync-request',
  ],
  devDeps: ['aws-prototyping-sdk', '@types/aws-lambda', 'aws-lambda', 'jest@^29.1.0'],
  defaultReleaseBranch: 'main',
  name: '@nsa/construct',
  packageManager: NodePackageManager.PNPM,
  cdkVersion: '2.76.0',
  constructsVersion: '10.2.1',
});

new awscdk.AwsCdkTypeScriptApp({
  parent: root,
  outdir: 'packages/demo',
  deps: ['@aws-prototyping-sdk/pdk-nag@0.17.0', '@aws-prototyping-sdk/static-website@0.17.0'],
  defaultReleaseBranch: 'main',
  name: '@nsa/demo',
  packageManager: NodePackageManager.PNPM,
  cdkVersion: '2.76.0',
});

new awscdk.AwsCdkTypeScriptApp({
  parent: root,
  outdir: 'packages/silo',
  deps: [
    '@aws-prototyping-sdk/pdk-nag@0.17.0',
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
});

new awscdk.AwsCdkTypeScriptApp({
  parent: root,
  outdir: 'packages/pool',
  deps: [
    '@aws-prototyping-sdk/pdk-nag@0.17.0',
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
});

new awscdk.AwsCdkTypeScriptApp({
  parent: root,
  outdir: 'packages/installer',
  deps: [
    '@aws-prototyping-sdk/pdk-nag@0.17.0',
    `@aws-sdk/client-cloudformation@${awsSdkVersion}`,
    `@aws-sdk/client-codepipeline@${awsSdkVersion}`,
    `@aws-sdk/client-codebuild@${awsSdkVersion}`,
    `@aws-sdk/client-dynamodb@${awsSdkVersion}`,
    `@aws-sdk/client-ec2@${awsSdkVersion}`,
    '@types/aws-lambda',
    '@nsa/demo',
    'source-map-support',
    'vm2',
  ],
  devDeps: ['aws-lambda'],
  defaultReleaseBranch: 'main',
  name: '@nsa/installer',
  packageManager: NodePackageManager.PNPM,
  cdkVersion: '2.76.0',
});

root.synth();
