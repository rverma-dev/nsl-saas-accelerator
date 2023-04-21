/**
 *  Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface CreateGitopsSecretProps {
  /**
   * Gitops IAM username
   */
  username: string;
  /**
   * Secret name
   */
  secretName: string;
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
    const providerLambda = new cdk.aws_lambda.Function(this, 'Function', {
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      code: cdk.aws_lambda.Code.fromAsset(path.join(__dirname, '../../lib/aws-codecommit/lambda-codecommit-secret')),
      handler: 'index.handler',
      timeout: cdk.Duration.minutes(15),
      description: 'Create Gitops Secret',
      role: assetsAccessRole,
    });

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
