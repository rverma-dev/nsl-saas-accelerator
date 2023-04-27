import { EksCluster } from '@nsa/construct';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class ApplicationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    new EksCluster(this, {
      platformTeamRole: scope.node.tryGetContext('PLATFORM_TEAM_ROLE')!,
      vpcID: scope.node.tryGetContext('VPC_ID'),
    });
  }
}