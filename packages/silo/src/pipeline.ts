import { EksCluster } from '@nsa/construct';
import { aws_dynamodb, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { PDKNag } from 'aws-prototyping-sdk/pdk-nag';
import { Construct } from 'constructs';

export class Silo extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const eks = new EksCluster(this, {
      platformTeamRole: scope.node.tryGetContext('PLATFORM_TEAM_ROLE')!,
      vpcID: scope.node.tryGetContext('VPC_ID'),
      gitopsRepoBranch: scope.node.tryGetContext('GITOPS_REPO_BRANCH'),
      gitopsRepoUrl: Fn.importValue('CodeCommitRepoUrlExport'),
      gitopsRepoSecret: Fn.importValue('CodeCommitSecretNameExport'),
    });
    const dynamo = new aws_dynamodb.Table(this, 'dynamo', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
    eks.node.addDependency(dynamo);
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = PDKNag.app();

new Silo(app, 'silo-dev', { env: devEnv });

app.synth();
