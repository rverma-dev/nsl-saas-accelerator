#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Aspects } from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { CodeCommitRepositoryStack } from '../lib/repository-stack';
import { clusterPropsBuilder } from '@nsa/constructs/lib/aws-eks/eks-stack-param';
import { EksCluster } from '@nsa/constructs';

const app = new cdk.App();
const env = { region: 'ap-south-1', account: 'demo' };

Aspects.of(app).add(new AwsSolutionsChecks());

// Build a Gitops Management Repo
new CodeCommitRepositoryStack(app, 'CodeCommitRepositoryStack', { env: env });

// Build an eks cluster
const appInputs = clusterPropsBuilder()
  .withStackName(app.node.tryGetContext('STACK_NAME')!)
  .withVpcID(app.node.tryGetContext('VPC_ID')!)
  .withGitopsRepoBranch(app.node.tryGetContext('GITOPS_REPO_BRANCH')!)
  .withPlatformTeamRole(app.node.tryGetContext('PLATFORM_TEAM_ROLE')!)
  .withGitopsRepoUrl(
  app.node.tryGetContext('GITOPS_REPO_URL') ? app.node.tryGetContext('GITOPS_REPO_URL') : cdk.Fn.importValue('CodeCommitRepoUrlExport'),
  )
  .withGitopsRepoSecret(
  app.node.tryGetContext('GITOPS_REPO_SECRET')
      ? app.node.tryGetContext('GITOPS_REPO_SECRET')
      : cdk.Fn.importValue('CodeCommitSecretNameExport'),
  )
  .build();
new EksCluster(app, appInputs);
// const r53arc = new Route53ARCStack(app, 'Route53ARCStack', { env: env });

// new EKSStack(app, 'HYD-EKSStack', {
//     env: {region: 'ap-south-2', account: process.env.CDK_DEFAULT_ACCOUNT}
// });

// r53arc.addEKSCell('ap-south-1');
// r53arc.addEKSCell('ap-south-2');
