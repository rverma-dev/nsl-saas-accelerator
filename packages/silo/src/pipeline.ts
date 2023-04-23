import { EksCluster } from '@nsa/construct';
import { App, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    new EksCluster(app, 'eks-cluster', {
      stackName: this.node.tryGetContext('STACK_NAME') ?? '',
      vpcID: this.node.tryGetContext('VPC_ID') ?? '',
      gitopsRepoBranch: this.node.tryGetContext('GITOPS_REPO_BRANCH')!,
      platformTeamRole: this.node.tryGetContext('PLATFORM_TEAM_ROLE')!,
      gitopsRepoUrl:
        this.node.tryGetContext('GITOPS_REPO_URL')
          ? this.node.tryGetContext('GITOPS_REPO_URL')
          : Fn.importValue('CodeCommitRepoUrlExport'),
      gitopsRepoSecret:
        this.node.tryGetContext('GITOPS_REPO_SECRET')
          ? this.node.tryGetContext('GITOPS_REPO_SECRET')
          : Fn.importValue('CodeCommitSecretNameExport'),
      env: props.env,
    });
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, '@nsa/silo-dev', { env: devEnv });
// new MyStack(app, '@nsa/silo-prod', { env: prodEnv });

app.synth();