import { Construct } from 'constructs';
import { AddTenantFunction } from './ddb-stream/add-tenant-function';
import {
  CDK_VERSION,
  DEPLOYMENT_TABLE_NAME,
  GITHUB_DOMAIN,
  REPOSITORY_NAME,
  REPOSITORY_OWNER,
} from './lib/configuration';
import { SaasPipeline } from '../constructs';
import { DefaultStackSynthesizer, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
  BuildSpec,
  Cache,
  ComputeType,
  LinuxArmBuildImage,
  LocalCacheMode,
  Project,
  Source,
} from 'aws-cdk-lib/aws-codebuild';
import { AttributeType, BillingMode, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb';
import * as ecr_assets from 'aws-cdk-lib/aws-ecr-assets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Effect, Policy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { CodeBuildStep } from 'aws-cdk-lib/pipelines';
import { NagSuppressions } from 'cdk-nag';

export class ToolchainStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    const deploymentTable = new Table(this, 'deployment-table', {
      tableName: DEPLOYMENT_TABLE_NAME,
      partitionKey: {
        name: 'tenantID',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const image = new ecr_assets.DockerImageAsset(this, 'nsl-installer-image', {
      directory: '.',
    });

    // const buildImage = LinuxArmBuildImage.fromCodeBuildImageId('aws/codebuild/amazonlinux2-aarch64-standard:3.0');
    const buildImage = LinuxArmBuildImage.fromEcrRepository(image.repository, image.imageTag);

    const pipeline = new SaasPipeline(this, 'toolchain', {
      cliVersion: CDK_VERSION,
      primarySynthDirectory: 'packages/installer/cdk.out',
      repositoryName: this.node.tryGetContext('repositoryName') || `${REPOSITORY_OWNER}/${REPOSITORY_NAME}`,
      crossAccountKeys: true,
      synth: {},
      dockerEnabledForSynth: true,
      dockerEnabledForSelfMutation: true,
      synthShellStepPartialProps: {
        commands: ['cd /app', 'yarn synth:silent'],
      },
      synthCodeBuildDefaults: {
        cache: Cache.local(LocalCacheMode.DOCKER_LAYER),
        buildEnvironment: {
          computeType: ComputeType.SMALL,
          buildImage: buildImage,
          privileged: true,
        },
      },
      pipelineName: id,
      selfMutationCodeBuildDefaults: {
        buildEnvironment: {
          computeType: ComputeType.SMALL,
          buildImage: buildImage,
        },
      },
    });

    const updateDeploymentsRole = new Role(this, 'update-deployments-role', {
      assumedBy: new ServicePrincipal('codebuild.amazonaws.com'),
      inlinePolicies: {
        'deployment-policy': new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: [
                'codepipeline:StartPipelineExecution',
                'codepipeline:GetPipelineExecution',
                'codepipeline:GetPipelineState',
              ],
              resources: [
                'arn:aws:codepipeline:' + this.region + ':' + this.account + ':*-silo-pipeline',
                'arn:aws:codepipeline:' + this.region + ':' + this.account + ':*-pool-pipeline',
              ],
              effect: Effect.ALLOW,
            }),
            new PolicyStatement({
              actions: ['cloudformation:ListStacks'],
              effect: Effect.ALLOW,
              resources: ['*'],
            }),
            new PolicyStatement({
              actions: ['dynamodb:Query', 'dynamodb:Scan'],
              effect: Effect.ALLOW,
              resources: [deploymentTable.tableArn, deploymentTable.tableArn + '/index/*'],
            }),
            new PolicyStatement({
              actions: ['ec2:DescribeRegions'],
              effect: Effect.ALLOW,
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    pipeline.addWave('UpdateDeployments', {
      post: [
        new CodeBuildStep('update-deployments', {
          commands: ['cd /app', 'yarn ts-node bin/get-deployments.ts', 'yarn ts-node bin/update-deployments.ts'],
          buildEnvironment: {
            computeType: ComputeType.SMALL,
            buildImage: buildImage,
          },
          role: updateDeploymentsRole,
        }),
      ],
    });

    // CodeBuild Project for Provisioning Build Job
    const project = new Project(this, 'provisioning-project', {
      projectName: 'provisioning-project',
      source: Source.gitHub({
        owner: REPOSITORY_OWNER,
        repo: REPOSITORY_NAME,
        branchOrRef: 'refs/heads/main',
      }),
      environment: {
        computeType: ComputeType.SMALL,
        buildImage: buildImage,
      },
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: ['cd /app', 'yarn ts-node bin/provision-deployment.ts'],
          },
        },
      }),
    });

    // Allow provision project to use CDK bootstrap roles. These are required when provision project runs CDK deploy
    project.addToRolePolicy(
      new PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: [
          `arn:aws:iam::${this.account}:role/cdk-${DefaultStackSynthesizer.DEFAULT_QUALIFIER}-deploy-role-${this.account}-${this.region}`,
          `arn:aws:iam::${this.account}:role/cdk-${DefaultStackSynthesizer.DEFAULT_QUALIFIER}-file-publishing-role-${this.account}-${this.region}`,
          `arn:aws:iam::${this.account}:role/cdk-${DefaultStackSynthesizer.DEFAULT_QUALIFIER}-image-publishing-role-${this.account}-${this.region}`,
        ],
        effect: Effect.ALLOW,
      }),
    );

    // Allow provision project to get AWS regions.
    // This is required for deployment information validation.
    project.addToRolePolicy(
      new PolicyStatement({
        actions: ['ec2:DescribeRegions'],
        effect: Effect.ALLOW,
        resources: ['*'],
      }),
    );

    // Lambda Function for DynamoDB Streams
    const streamTenant = new AddTenantFunction(this, 'add-tenant', {
      environment: {
        PROJECT_NAME: 'provisioning-project',
      },
    });

    streamTenant.role?.attachInlinePolicy(
      new Policy(this, 'start-pipeline-policy', {
        document: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              resources: [project.projectArn],
              actions: ['codebuild:StartBuild'],
            }),
          ],
        }),
      }),
    );

    streamTenant.addEventSource(
      new DynamoEventSource(deploymentTable, {
        startingPosition: StartingPosition.LATEST,
      }),
    );

    const ghProvider = new iam.OpenIdConnectProvider(this, 'githubProvider', {
      url: `https://${GITHUB_DOMAIN}`,
      clientIds: ['sts.amazonaws.com'],
    });

    const conditions: iam.Conditions = {
      StringLike: {
        [`${GITHUB_DOMAIN}:sub`]: `repo:${REPOSITORY_OWNER}/${REPOSITORY_NAME}:*`,
      },
    };

    const githubActionPolicy = new PolicyDocument({
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          resources: ['*'],
          actions: [
            'ecr:BatchGetImage',
            'ecr:BatchCheckLayerAvailability',
            'ecr:CompleteLayerUpload',
            'ecr:GetDownloadUrlForLayer',
            'ecr:InitiateLayerUpload',
            'ecr:PutImage',
            'ecr:UploadLayerPart',
            'ecr:GetAuthorizationToken',
          ],
        }),
      ],
    });

    new iam.Role(this, 'gitHubSaasDeployRole', {
      assumedBy: new iam.WebIdentityPrincipal(ghProvider.openIdConnectProviderArn, conditions),
      roleName: 'gitHubSaasDeployRole',
      description: 'This role is used via GitHub Actions to deploy with AWS CDK or Terraform on the target AWS account',
      maxSessionDuration: Duration.hours(1),
      inlinePolicies: {
        githubAction: githubActionPolicy,
      },
    });
    new iam.WebIdentityPrincipal(ghProvider.openIdConnectProviderArn, conditions);

    NagSuppressions.addStackSuppressions(
      this,
      [
        { id: 'AwsSolutions-S1', reason: 'Internal codebuild bucket' },
        { id: 'AwsSolutions-L1', reason: 'Internal codebuild bucket' },
        { id: 'AwsSolutions-IAM4', reason: 'Managed IAM Policies' },
        { id: 'AwsSolutions-IAM5', reason: 'Wildcard policies for AWS Load Balancer Controller' },
        { id: 'AwsSolutions-CB4', reason: 'Public access for demo purposes' },
      ],
      true,
    );
  }
}
