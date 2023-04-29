import { Construct } from 'constructs';
import { EksCluster } from '../constructs';
import { Stack, StackProps } from 'aws-cdk-lib';

export class ApplicationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    new EksCluster(this, {
      platformTeamRole: scope.node.tryGetContext('PLATFORM_TEAM_ROLE')!,
      vpcID: scope.node.tryGetContext('VPC_ID'),
    });
  }
}
