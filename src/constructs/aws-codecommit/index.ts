import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecretGenFunction } from './secret-gen-function';

export interface CreateGitopsSecretProps {
  /**
   * Gitops IAM username
   */
  readonly username: string;
  /**
   * Secret name
   */
  readonly secretName: string;
}

/**
 * Class to configure CloudWatch Destination on logs receiving account
 */
export class CreateGitopsSecretResource extends Construct {
  readonly id: string;

  constructor(scope: Construct, id: string, props: CreateGitopsSecretProps) {
    super(scope, id);

    const RESOURCE_TYPE = 'Custom::CodeCommitCredentials';
    const accessRoleResourceName = 'CreateGitopsSecretLambda';
    const assetsAccessRole = new cdk.aws_iam.Role(this, accessRoleResourceName, {
      roleName: `AWSLambdaBasicExecutionRole-${this.node.id}`,
      assumedBy: new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'AWS Accelerator assets access role in workload accounts to bootstrap gitops credentials',
    });
    assetsAccessRole.addManagedPolicy(
      cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
    );
    assetsAccessRole.addToPolicy(
      new cdk.aws_iam.PolicyStatement({
        resources: [`arn:${cdk.Aws.PARTITION}:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:*`],
        actions: ['logs:CreateLogGroup'],
      }),
    );
    assetsAccessRole.addToPolicy(
      new cdk.aws_iam.PolicyStatement({
        resources: [
          `arn:${cdk.Aws.PARTITION}:secretsmanager:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:secret:${props.secretName}`,
        ],
        actions: ['secretsmanager:*'],
      }),
    );
    assetsAccessRole.addToPolicy(
      new cdk.aws_iam.PolicyStatement({
        resources: ['*'],
        actions: ['kms:Decrypt', 'kms:DescribeKey'],
      }),
    );
    assetsAccessRole.addToPolicy(
      new cdk.aws_iam.PolicyStatement({
        resources: [`arn:${cdk.Aws.PARTITION}:iam::${cdk.Aws.ACCOUNT_ID}:user/${props.username}`],
        actions: [
          'iam:CreateServiceSpecificCredential',
          'iam:DeleteServiceSpecificCredential',
          'iam:ListServiceSpecificCredentials',
        ],
      }),
    );
    //
    // Function definition for the custom resource
    //
    const providerLambda = new SecretGenFunction(this, this.node.id);

    // Custom resource lambda log group
    new cdk.aws_logs.LogGroup(this, `${providerLambda.node.id}LogGroup`, {
      logGroupName: `/aws/lambda/${providerLambda.functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const provider = new cdk.custom_resources.Provider(this, 'Custom::GitopsSecrets', {
      onEventHandler: providerLambda,
    });

    const resource = new cdk.CustomResource(this, 'Resource', {
      resourceType: RESOURCE_TYPE,
      serviceToken: provider.serviceToken,
      properties: {
        username: props.username,
        secretName: props.secretName,
      },
    });

    this.id = resource.ref;
  }
}
