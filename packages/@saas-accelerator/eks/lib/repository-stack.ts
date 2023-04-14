import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import { CreateGitopsSecretResource } from '@saas-accelerator/constructs';

import { NagSuppressions } from 'cdk-nag';

export class CodeCommitRepositoryStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const secretName = 'blueprints/gitops-secret';

    const fluxUser = new iam.User(this, 'User', { userName: 'gitops' });

    const repo = new codecommit.Repository(this, 'Repository', {
      repositoryName: 'gitops',
      description: 'GitOps (FluxCD) main repository',
    });

    const gitClientPermissions = new iam.Policy(this, 'GitClientPermissions', {
      statements: [
        new iam.PolicyStatement({
          actions: ['codecommit:GitPull', 'codecommit:GitPush'],
          resources: [repo.repositoryArn],
          effect: iam.Effect.ALLOW,
        }),
      ],
    });

    fluxUser.attachInlinePolicy(gitClientPermissions);

    // Get the secret from Secrets Manager
    new CreateGitopsSecretResource(this, 'codeCommitSecret', {
      username: fluxUser.userName,
      secretName: secretName,
    });

    new CfnOutput(this, 'secretName', {
      value: secretName,
      description: 'The ARN of the secret storing the CodeCommit HTTPS Git credentials',
      exportName: 'CodeCommitSecretNameExport',
    });

    new CfnOutput(this, 'CodeCommitRepoUrl', {
      value: repo.repositoryCloneUrlHttp,
      description: 'SSH URL of the repository created',
      exportName: 'CodeCommitRepoUrlExport',
    });

    NagSuppressions.addStackSuppressions(
      this,
      [
        { id: 'AwsSolutions-L1', reason: 'Internal EKS Construct' },
        { id: 'AwsSolutions-IAM4', reason: 'Managed IAM Policies' },
        { id: 'AwsSolutions-IAM5', reason: 'Wildcard policies for AWS Load Balancer Controller' },
        { id: 'AwsSolutions-EKS1', reason: 'Public access for demo purposes' },
        { id: 'AwsSolutions-AS3', reason: 'Notifications disabled' },
        { id: 'AwsSolutions-VPC7', reason: 'Sample code for demo purposes, flow logs disabled' },
      ],
      true,
    );
  }
}
