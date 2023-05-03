import { YARN } from './configuration';
import { AddTenantFunction } from '../ddb-stream/add-tenant-function';
import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class ProvisioningProject extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: {
      owner: string;
      repo: string;
      branchOrRef?: string;
      deploymentTable: Table;
      cacheBucket: IBucket;
    }
  ) {
    super(scope, id);

    // Lambda Function for DynamoDB Streams
    const streamTenant = new AddTenantFunction(this, 'add-tenant-function', {
      environment: {
        PROJECT_NAME: 'provisioning-project'
      }
    });

    streamTenant.addEventSource(
      new DynamoEventSource(props.deploymentTable, {
        startingPosition: StartingPosition.LATEST
      })
    );

    const project = new codebuild.Project(this, 'provisioning-project', {
      projectName: 'provisioning-project',
      source: codebuild.Source.gitHub({
        owner: props.owner,
        repo: props.repo,
        branchOrRef: props.branchOrRef || 'main',
        cloneDepth: 1
      }),
      environment: {
        computeType: codebuild.ComputeType.SMALL,
        privileged: false
      },
      cache: codebuild.Cache.bucket(props.cacheBucket),
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [`${YARN} install --immutable`]
          },
          build: {
            commands: [`${YARN} ts-node bin/provision-deployment.ts`]
          }
        },
        cache: {
          paths: ['.yarn/cache/**/*', 'node_modules/**/*']
        }
      })
    });
    project.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: [
          `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/cdk-${cdk.DefaultStackSynthesizer.DEFAULT_QUALIFIER}-deploy-role-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}}`,
          `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/cdk-${cdk.DefaultStackSynthesizer.DEFAULT_QUALIFIER}-file-publishing-role-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}}`,
          `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/cdk-${cdk.DefaultStackSynthesizer.DEFAULT_QUALIFIER}-image-publishing-role-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}}`
        ],
        effect: iam.Effect.ALLOW
      })
    );

    // Allow provision project to get AWS regions.
    project.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ec2:DescribeRegions'],
        effect: iam.Effect.ALLOW,
        resources: ['*']
      })
    );

    // Allow lambda to start codebuild
    streamTenant.role?.attachInlinePolicy(
      new iam.Policy(this, 'start-pipeline-policy', {
        document: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              resources: [project.projectArn],
              actions: ['codebuild:StartBuild']
            })
          ]
        })
      })
    );
  }
}
