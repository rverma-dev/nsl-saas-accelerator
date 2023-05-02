import { Construct } from 'constructs';
import { ApplicationStack } from './application-stack';
import { Stage, StageProps } from 'aws-cdk-lib';

export class ApplicationStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    new ApplicationStack(this, 'gitops-eks', { env: props?.env });
  }
}
