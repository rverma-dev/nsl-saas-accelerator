#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Aspects } from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import EksCluster from '@saas-accelerator/constructs/lib/eks/eks-stack';
import { CodeCommitRepositoryStack } from '../lib/repository-stack';
import { environmentInputs, stackName } from '../lib/constants';

const app = new cdk.App();
const env = { region: 'ap-south-1', account: '755502957828' };

Aspects.of(app).add(new AwsSolutionsChecks());

// Build a Gitops Management Repo
new CodeCommitRepositoryStack(app, 'CodeCommitRepositoryStack', { env: env });

// Build an eks cluster
const appInputs = { env, ...environmentInputs, stackName: stackName };
new EksCluster(app, appInputs);

// const r53arc = new Route53ARCStack(app, 'Route53ARCStack', { env: env });

// new EKSStack(app, 'HYD-EKSStack', {
//     env: {region: 'ap-south-2', account: process.env.CDK_DEFAULT_ACCOUNT}
// });

// r53arc.addEKSCell('ap-south-1');
// r53arc.addEKSCell('ap-south-2');
