import { aws_dynamodb, Stack, StackProps } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class ApplicationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // const providerLambda = new FindEksCusterFunction(this, 'get-eks');
    // const provider = new cdk.custom_resources.Provider(this, 'Custom::GitopsSecrets', {
    //   onEventHandler: providerLambda,
    // });

    const eks = cdk.aws_eks.Cluster.fromClusterAttributes(this, 'pool-cluster', {
      clusterName: 'nsl-silo'
    });

    const dynamo = new aws_dynamodb.Table(this, 'dynamo', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST
    });
    eks.node.addDependency(dynamo);
  }
}
