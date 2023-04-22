import path from 'path';
import { StaticWebsite } from '@aws-prototyping-sdk/static-website';
import { Stack, Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface DemoSiteStageProps extends StageProps {
  tenantID: string;
  deploymentId: string;
  deploymentType: string;
  deploymentTier: string;
}

export class DemoSiteStage extends Stage {
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