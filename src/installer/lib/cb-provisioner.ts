import { YARN } from './configuration';
import { AddTenantFunction } from '../ddb-stream/add-tenant-function';
import { Aws, DefaultStackSynthesizer } from 'aws-cdk-lib';
import { Project, Source, ComputeType, LinuxArmBuildImage, Cache, BuildSpec } from 'aws-cdk-lib/aws-codebuild';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement, Effect, Policy, PolicyDocument } from 'aws-cdk-lib/aws-iam';
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

    const project = new Project(this, 'provisioning-project', {
      projectName: 'provisioning-project',
      source: Source.gitHub({
        owner: props.owner,
        repo: props.repo,
        branchOrRef: props.branchOrRef || 'main',
        cloneDepth: 1
      }),
      environment: {
        computeType: ComputeType.SMALL,
        buildImage: LinuxArmBuildImage.fromCodeBuildImageId('aws/codebuild/amazonlinux2-aarch64-standard:3.0'),
        privileged: false
      },
      cache: Cache.bucket(props.cacheBucket),
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [`${YARN} install --immutable`]
          },
          build: {
            commands: [`${YARN} ts-node src/installer/provision-deployment.ts`]
          }
        },
        cache: {
          paths: ['.yarn/cache/**/*', 'node_modules/**/*']
        }
      })
    });
    project.addToRolePolicy(
      new PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: [
          `arn:aws:iam::${Aws.ACCOUNT_ID}:role/cdk-${DefaultStackSynthesizer.DEFAULT_QUALIFIER}-deploy-role-${Aws.ACCOUNT_ID}-${Aws.REGION}`,
          `arn:aws:iam::${Aws.ACCOUNT_ID}:role/cdk-${DefaultStackSynthesizer.DEFAULT_QUALIFIER}-file-publishing-role-${Aws.ACCOUNT_ID}-${Aws.REGION}`,
          `arn:aws:iam::${Aws.ACCOUNT_ID}:role/cdk-${DefaultStackSynthesizer.DEFAULT_QUALIFIER}-image-publishing-role-${Aws.ACCOUNT_ID}-${Aws.REGION}`
        ],
        effect: Effect.ALLOW
      })
    );

    // Allow provision project to get AWS regions.
    project.addToRolePolicy(
      new PolicyStatement({
        actions: ['ec2:DescribeRegions'],
        effect: Effect.ALLOW,
        resources: ['*']
      })
    );

    // Allow lambda to start codebuild
    streamTenant.role?.attachInlinePolicy(
      new Policy(this, 'start-pipeline-policy', {
        document: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              resources: [project.projectArn],
              actions: ['codebuild:StartBuild']
            })
          ]
        })
      })
    );
  }
}
