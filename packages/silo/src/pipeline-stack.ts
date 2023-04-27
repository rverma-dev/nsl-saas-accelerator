import { DeploymentRecord } from '@nsa/common';
import { SaasPipeline } from '@nsa/construct';
import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApplicationStage } from './application-stage';

interface WorkloadPipelineProps extends DeploymentRecord {
  readonly toolchainKms?: string;
  readonly toolchainLogBucket?: string;
  readonly toolchainAssetBucket?: string;
}

export class PipelineStack extends Stack {
  readonly pipeline: SaasPipeline;

  constructor(scope: Construct, id: string, props: WorkloadPipelineProps) {
    super(scope, id, { env: { account: props.account, region: props.region } });
    this.pipeline = new SaasPipeline(this, `${props.tenantId}-${props.id}-pool`, {
      primarySynthDirectory: 'packages/pool/cdk.out',
      repositoryName: this.node.tryGetContext('repositoryName') || 'rverma-nsl/nsl-saas-accelerator',
      publishAssetsInParallel: false,
      crossAccountKeys: true,
      synth: {},
      dockerEnabledForSynth: true,
      existingKMSKeyAlias: props.toolchainKms,
      existingArtifactBucket: props.toolchainAssetBucket,
      existingAccessLogBucket: props.toolchainLogBucket,
    });
    const devStage = new ApplicationStage(this, 'Dev', { env: { account: props.account, region: props.region } });
    this.pipeline.addWave('application').addStage(devStage);
    this.pipeline.buildPipeline(); // Needed for CDK Nag
  }
}
