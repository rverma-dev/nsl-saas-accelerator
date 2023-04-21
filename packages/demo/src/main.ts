import path from 'path';
import * as process from 'process';
import { PDKNagApp } from '@aws-prototyping-sdk/pdk-nag';
import { StaticWebsite } from '@aws-prototyping-sdk/static-website';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface DemoSiteStageProps extends StackProps {
  tenantID: string;
  deploymentId: string;
  deploymentType: string;
}

export class DemoSiteStage extends Stack {
  constructor(scope: Construct, id: string, props: DemoSiteStageProps) {
    super(scope, id, props);
    new StaticWebsite(this, `${props.deploymentType}-${props.deploymentId}-StaticWebsite`, {
      websiteContentPath: path.join(__dirname, './sample-website'),
      runtimeOptions: {
        jsonPayload: {
          region: Stack.of(this).region,
        },
      },
    });
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new PDKNagApp();

new DemoSiteStage(app, 'demo-stack-dev', {
  tenantID: 'demo',
  deploymentId: 'dev-001',
  deploymentType: 'silo',
  env: devEnv,
});

app.synth();