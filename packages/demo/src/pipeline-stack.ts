import { Stack, StackProps } from 'aws-cdk-lib';
import { PDKPipeline } from 'aws-prototyping-sdk/pipeline';
import { Construct } from 'constructs';

export class DemoPipeline extends Stack {
  readonly pipeline: PDKPipeline;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    // const installerImage = new Repository(this, 'demo-installer', { repositoryName: 'demo-installer' });
    this.pipeline = new PDKPipeline(this, 'ApplicationPipeline', {
      primarySynthDirectory: 'packages/infra/cdk.out',
      repositoryName: this.node.tryGetContext('repositoryName') || 'monorepo',
      publishAssetsInParallel: false,
      crossAccountKeys: true,
      synth: {},
      dockerEnabledForSynth: true,
      dockerEnabledForSelfMutation: true,
    });
  }
}
