import path from 'path';
import { Construct } from 'constructs';
import { StaticWebsite } from '@aws-prototyping-sdk/static-website';
import { Stack, StackProps } from 'aws-cdk-lib';

export class ApplicationStack extends Stack {
  constructor(scope: Construct, id: string, deploymentType: string, deploymentId: string, props?: StackProps) {
    super(scope, id, props);

    new StaticWebsite(this, `${deploymentType}-${deploymentId}-StaticWebsite`, {
      websiteContentPath: path.join(__dirname, '../static'),
      runtimeOptions: {
        jsonPayload: {
          region: Stack.of(this).region,
        },
      },
    });
  }
}
