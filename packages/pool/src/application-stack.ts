import { aws_dynamodb, Stack, StackProps } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { FindEksCusterFunction } from './lib/find-eks-custer-function';

export class ApplicationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const providerLambda = new FindEksCusterFunction(this, 'get-eks');
    const provider = new cdk.custom_resources.Provider(this, 'Custom::GitopsSecrets', {
      onEventHandler: providerLambda,
    });

    const eks = new cdk.CustomResource(this, 'Resource', {
      resourceType: '',
      serviceToken: provider.serviceToken,
      properties: {
        Seed: 'nsl-silo',
      },
    });

    const dynamo = new aws_dynamodb.Table(this, 'dynamo', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
    eks.node.addDependency(dynamo);
  }
}

// export class DBStack extends Stack {
//   constructor(scope: Construct, id: string, props?: StackProps) {
//     super(scope, id, props);
//     new DatabaseInstance(this, 'MyDatabase', {
//       engine: DatabaseInstanceEngine.mysql({
//         version: MysqlEngineVersion.VER_8_0_32,
//       }),
//       instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.SMALL),
//       allocatedStorage: 10,
//       storageType: StorageType.GP2,
//       deletionProtection: false,
//       vpcSubnets: [],
//     });
//   }
// }
