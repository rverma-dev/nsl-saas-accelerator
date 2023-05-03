import { ProvisioningProject } from './lib/cb-provisioner';
import { CDK_VERSION, DEPLOYMENT_TABLE_NAME, REPOSITORY_NAME, REPOSITORY_OWNER } from './lib/configuration';
import { GitHubEcrPushAction } from './lib/ghcr';
import { SaasPipeline } from '../constructs';
import * as cdk from 'aws-cdk-lib';
import { ComputeType } from 'aws-cdk-lib/aws-codebuild';
import { AttributeType, BillingMode, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { CodeBuildStep } from 'aws-cdk-lib/pipelines';
import { NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';

export class ToolchainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);
    const INSTALL_COMMANDS = ['yarn install --immutable --immutable-cache'];
    const BUILD_COMMANDS = ['yarn synth:silent -y'];

    const deploymentTable = new DeploymentTable(this, 'deployment-table', { tableName: DEPLOYMENT_TABLE_NAME });
    const pipeline = new SaasPipeline(this, 'install-pipeline', {
      pipelineName: 'toolchain',
      cliVersion: CDK_VERSION,
      primarySynthDirectory: 'cdk.out',
      repositoryName: this.node.tryGetContext('repositoryName') || `${REPOSITORY_OWNER}/${REPOSITORY_NAME}`,
      synth: {},
      commands: BUILD_COMMANDS,
      isToolchain: true
    });

    const updateDeploymentsRole = new UpdateDeploymentsRole(this, 'update-deployments-role', { deploymentTable });

    pipeline.addWave('UpdateDeployments', {
      post: [
        new CodeBuildStep('update-deployments', {
          installCommands: INSTALL_COMMANDS,
          commands: [
            'yarn ts-node src/installer/get-deployments.ts',
            'yarn ts-node src/installer/update-deployments.ts'
          ],
          buildEnvironment: {
            computeType: ComputeType.SMALL
            // buildImage: buildImage,
          },
          role: updateDeploymentsRole
        })
      ]
    });

    new ProvisioningProject(this, 'provisioning-project', {
      owner: REPOSITORY_OWNER,
      repo: REPOSITORY_NAME,
      deploymentTable,
      installCommands: INSTALL_COMMANDS,
      buildCommands: BUILD_COMMANDS
    });

    new GitHubEcrPushAction(this, 'gitHub-ecrpush-role', { owner: REPOSITORY_OWNER, repo: REPOSITORY_NAME });

    //      // const parameter = new StringParameter(this, 'AssetTag', {
    //     //   parameterName: ASSET_PARAMETER,
    //     //   stringValue: image.imageTag,
    //     // });
    //     // parameter.grantRead(updateDeploymentsRole);
    //     // parameter.grantRead(project);
    //     // parameter.grantWrite(updateDeploymentsRole);

    NagSuppressions.addStackSuppressions(
      this,
      [
        { id: 'AwsSolutions-IAM4', reason: 'Managed IAM Policies' },
        { id: 'AwsSolutions-IAM5', reason: 'Wildcard policies for AWS Load Balancer Controller' },
        { id: 'AwsSolutions-CB4', reason: 'Public access for demo purposes' }
      ],
      true
    );
  }
}

class DeploymentTable extends Table {
  constructor(scope: Construct, id: string, props: { tableName: string }) {
    super(scope, id, {
      ...props,
      partitionKey: {
        name: 'tenantID',
        type: AttributeType.STRING
      },
      sortKey: {
        name: 'id',
        type: AttributeType.STRING
      },
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
  }
}

class UpdateDeploymentsRole extends iam.Role {
  constructor(scope: Construct, id: string, props: { deploymentTable: Table }) {
    super(scope, id, {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      inlinePolicies: {
        'deployment-policy': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'codepipeline:StartPipelineExecution',
                'codepipeline:GetPipelineExecution',
                'codepipeline:GetPipelineState'
              ],
              resources: [
                `arn:aws:codepipeline:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:*-silo-pipeline`,
                `arn:aws:codepipeline:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:*-pool-pipeline`,
                `arn:aws:codepipeline:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:*-demo-pipeline`
              ],
              effect: iam.Effect.ALLOW
            }),
            new iam.PolicyStatement({
              actions: ['cloudformation:ListStacks'],
              effect: iam.Effect.ALLOW,
              resources: ['*']
            }),
            new iam.PolicyStatement({
              actions: ['dynamodb:Query', 'dynamodb:Scan'],
              effect: iam.Effect.ALLOW,
              resources: [props.deploymentTable.tableArn, props.deploymentTable.tableArn + '/index/*']
            }),
            new iam.PolicyStatement({
              actions: ['ec2:DescribeRegions'],
              effect: iam.Effect.ALLOW,
              resources: ['*']
            })
          ]
        })
      }
    });
  }
}
