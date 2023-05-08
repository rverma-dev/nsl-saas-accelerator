import { EksCluster } from '../constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export class ApplicationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    new EksCluster(scope, {
      account: props!.env!.account!,
      region: props!.env!.region!,
      platformTeamRole:
        scope.node.tryGetContext('PLATFORM_TEAM_ROLE') ?? StringParameter.valueFromLookup(this, '/devops/admin-role'),
      vpcID: scope.node.tryGetContext('VPC_ID')
    });
  }
}
