import { nx_monorepo } from 'aws-prototyping-sdk';
import { awscdk } from 'projen';
import { ArrowParens, TrailingComma } from 'projen/lib/javascript';
import { NodePackageManager } from 'projen/lib/javascript/node-package';
import { TypeScriptProject } from 'projen/lib/typescript';

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
});

const nslConstructs = new TypeScriptProject({
  parent: root,
  outdir: 'packages/constructs',
  deps: [
    'aws-cdk-lib',
    'aws-lambda',
    'cdk-nag',
    'constructs',
    '@aws-quickstart/eks-blueprints',
    '@aws-sdk/client-iam',
    '@aws-sdk/client-secrets-manager',
    'js-yaml',
    'sync-request',
    '@jest/globals',
  ],
  devDeps: ['@types/aws-lambda', '@types/js-yaml'],
  defaultReleaseBranch: 'main',
  name: '@nsa/construct',
  packageManager: NodePackageManager.PNPM,
});
root.addImplicitDependency(nslConstructs, '@aws-quickstart/eks-blueprints');

const demo = new awscdk.AwsCdkTypeScriptApp({
  parent: root,
  outdir: 'packages/demo',
  deps: ['@aws-prototyping-sdk/pdk-nag@0.17.0', '@aws-prototyping-sdk/static-website@0.17.0'],
  defaultReleaseBranch: 'main',
  name: '@nsa/demo',
  packageManager: NodePackageManager.PNPM,
  cdkVersion: '2.76.0',
});
root.addImplicitDependency(demo, nslConstructs);

const silo = new TypeScriptProject({
  parent: root,
  outdir: 'packages/silo',
  deps: [
    'aws-cdk-lib',
    'constructs',
    'cdk-nag',
    '@aws-sdk/client-iam',
    '@aws-sdk/client-secrets-manager',
    'aws-lambda',
    '@jest/globals',
  ],
  defaultReleaseBranch: 'main',
  name: '@nsa/silo',
  packageManager: NodePackageManager.PNPM,
});
root.addImplicitDependency(silo, nslConstructs);

const pool = new TypeScriptProject({
  parent: root,
  outdir: 'packages/pool',
  deps: ['aws-cdk-lib', 'constructs', 'cdk-nag'],
  defaultReleaseBranch: 'main',
  name: '@nsa/pool',
  packageManager: NodePackageManager.PNPM,
});
root.addImplicitDependency(pool, nslConstructs);

root.synth();
