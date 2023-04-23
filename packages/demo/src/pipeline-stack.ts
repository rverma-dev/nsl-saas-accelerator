import { Stack, StackProps } from 'aws-cdk-lib';
import { PDKPipeline } from 'aws-prototyping-sdk/pipeline';
import { Construct } from 'constructs';
import { ApplicationStage } from './application-stage';

interface PipelineProps extends StackProps {
  tenantID: string;
  deploymentId: string;
  deploymentType: string;
  deploymentTier: string;
}
export class DemoPipeline extends Stack {
  readonly pipeline: PDKPipeline;

  constructor(scope: Construct, id: string, props: PipelineProps) {
    super(scope, id, { env: props.env });
    // const installerImage = new Repository(this, 'demo-installer', { repositoryName: 'demo-installer' });
    this.pipeline = new PDKPipeline(this, 'ApplicationPipeline', {
      primarySynthDirectory: 'packages/infra/cdk.out',
      repositoryName: this.node.tryGetContext('repositoryName') || 'nsl-saas-accelerator',
      publishAssetsInParallel: false,
      crossAccountKeys: true,
      synth: {},
      dockerEnabledForSynth: true,
      dockerEnabledForSelfMutation: true,
    });
    const devStage = new ApplicationStage(this, 'Dev', { env: props.env });
    this.pipeline.addStage(devStage);
  }
}
