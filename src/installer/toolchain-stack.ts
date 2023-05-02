import { Construct } from 'constructs';
import { AddTenantFunction } from './ddb-stream/add-tenant-function';
import {
  ASSET_PARAMETER,
  CDK_VERSION,
  DEPLOYMENT_TABLE_NAME,
  GITHUB_DOMAIN,
  REPOSITORY_NAME,
  REPOSITORY_OWNER,
} from './lib/configuration';
import { SaasPipeline } from '../constructs';
import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { AttributeType, BillingMode, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { CodeBuildStep } from 'aws-cdk-lib/pipelines';
import { NagSuppressions } from 'cdk-nag';

export class ToolchainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
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
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const image = new DockerImageAsset(this, 'nsl-installer-image', { directory: '.' });
    const buildImage = codebuild.LinuxArmBuildImage.fromEcrRepository(image.repository, image.imageTag);
    const INSTALL_COMMANDS = ['yarn install --immutable --immutable-cache'];
    // image asset is taking to long to be provisioned by codebuild
    const pipeline = new SaasPipeline(this, 'install-pipeline', {
      pipelineName: 'toolchain',
      cliVersion: CDK_VERSION,
      primarySynthDirectory: 'cdk.out',
      repositoryName: this.node.tryGetContext('repositoryName') || `${REPOSITORY_OWNER}/${REPOSITORY_NAME}`,
      crossAccountKeys: true,
      selfMutation: true,
      synth: {},
      dockerEnabledForSynth: true,
      synthShellStepPartialProps: {
        installCommands: INSTALL_COMMANDS,
        commands: ['yarn synth:silent -y'],
      },
      synthCodeBuildDefaults: {
        buildEnvironment: {
          buildImage: buildImage,
        },
      },
      selfMutationCodeBuildDefaults: {
        buildEnvironment: {
          privileged: true,
        },
      },
    });
    const updateDeploymentsRole = new iam.Role(this, 'update-deployments-role', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      inlinePolicies: {
        'deployment-policy': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'codepipeline:StartPipelineExecution',
                'codepipeline:GetPipelineExecution',
                'codepipeline:GetPipelineState',
              ],
              resources: [
                'arn:aws:codepipeline:' + this.region + ':' + this.account + ':*-silo-pipeline',
                'arn:aws:codepipeline:' + this.region + ':' + this.account + ':*-pool-pipeline',
                'arn:aws:codepipeline:' + this.region + ':' + this.account + ':*-demo-pipeline',
              ],
              effect: iam.Effect.ALLOW,
            }),
            new iam.PolicyStatement({
              actions: ['cloudformation:ListStacks'],
              effect: iam.Effect.ALLOW,
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              actions: ['dynamodb:Query', 'dynamodb:Scan'],
              effect: iam.Effect.ALLOW,
              resources: [deploymentTable.tableArn, deploymentTable.tableArn + '/index/*'],
            }),
            new iam.PolicyStatement({
              actions: ['ec2:DescribeRegions'],
              effect: iam.Effect.ALLOW,
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    pipeline.addWave([], 'UpdateDeployments', {
      post: [
        new CodeBuildStep('update-deployments', {
          installCommands: INSTALL_COMMANDS,
          commands: [
            'yarn ts-node src/installer/get-deployments.ts',
            'yarn ts-node src/installer/update-deployments.ts',
          ],
          buildEnvironment: {
            computeType: codebuild.ComputeType.SMALL,
            buildImage: buildImage,
          },
          role: updateDeploymentsRole,
        }),
      ],
    });

    // CodeBuild Project for Provisioning Build Job
    const project = new codebuild.Project(this, 'provisioning-project', {
      projectName: 'provisioning-project',
      source: codebuild.Source.gitHub({
        owner: REPOSITORY_OWNER,
        repo: REPOSITORY_NAME,
        branchOrRef: 'refs/heads/main',
        cloneDepth: 1,
      }),
      environment: {
        computeType: codebuild.ComputeType.SMALL,
        buildImage: buildImage,
        privileged: false,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: INSTALL_COMMANDS,
          },
          build: {
            commands: ['yarn ts-node src/installer/provision-deployment.ts'],
          },
        },
      }),
    });

    // Allow provision project to use CDK bootstrap roles. These are required when provision project runs CDK deploy
    project.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: [
          `arn:aws:iam::${this.account}:role/cdk-${cdk.DefaultStackSynthesizer.DEFAULT_QUALIFIER}-deploy-role-${this.account}-${this.region}`,
          `arn:aws:iam::${this.account}:role/cdk-${cdk.DefaultStackSynthesizer.DEFAULT_QUALIFIER}-file-publishing-role-${this.account}-${this.region}`,
          `arn:aws:iam::${this.account}:role/cdk-${cdk.DefaultStackSynthesizer.DEFAULT_QUALIFIER}-image-publishing-role-${this.account}-${this.region}`,
        ],
        effect: iam.Effect.ALLOW,
      }),
    );

    const parameter = new StringParameter(this, 'AssetTag', {
      parameterName: ASSET_PARAMETER,
      stringValue: image.imageTag,
    });
    parameter.grantRead(updateDeploymentsRole);
    parameter.grantRead(project);
    parameter.grantWrite(updateDeploymentsRole);

    // Allow provision project to get AWS regions.
    // This is required for deployment information validation.
    project.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ec2:DescribeRegions'],
        effect: iam.Effect.ALLOW,
        resources: ['*'],
      }),
    );

    // Lambda Function for DynamoDB Streams
    const streamTenant = new AddTenantFunction(this, 'add-tenant-function', {
      environment: {
        PROJECT_NAME: 'provisioning-project',
      },
    });

    streamTenant.role?.attachInlinePolicy(
      new iam.Policy(this, 'start-pipeline-policy', {
        document: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
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

    const ghProvider = new iam.OpenIdConnectProvider(this, 'github-oidc-provider', {
      url: `https://${GITHUB_DOMAIN}`,
      clientIds: ['sts.amazonaws.com'],
    });

    const conditions: iam.Conditions = {
      StringLike: {
        [`${GITHUB_DOMAIN}:sub`]: `repo:${REPOSITORY_OWNER}/${REPOSITORY_NAME}:*`,
      },
    };

    const githubActionPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
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

    new iam.Role(this, 'gitHub-ecrpush-role', {
      assumedBy: new iam.WebIdentityPrincipal(ghProvider.openIdConnectProviderArn, conditions),
      roleName: 'gitHubSaasDeployRole',
      description: 'This role is used via GitHub Actions to deploy with AWS CDK or Terraform on the target AWS account',
      maxSessionDuration: cdk.Duration.hours(1),
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
