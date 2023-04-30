import { ApplicationStage } from './application-stage';
import { DeploymentRecord } from '../common';
import { SaasPipeline } from '../constructs';
import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface WorkloadPipelineProps extends DeploymentRecord {
  readonly toolchainKms?: string;
  readonly toolchainLogBucket?: string;
  readonly toolchainAssetBucket?: string;
  readonly repositoryName: string;
}

export class PipelineStack extends Stack {
  readonly pipeline: SaasPipeline;

  constructor(scope: Construct, id: string, props: WorkloadPipelineProps) {
    super(scope, id, { env: { account: props.account, region: props.region } });
    this.pipeline = new SaasPipeline(this, `${props.tenantId}-${props.id}-silo`, {
      primarySynthDirectory: 'cdk.out',
      repositoryName: props.repositoryName,
      crossAccountKeys: true,
      synth: {},
      dockerEnabledForSynth: true,
      existingKMSKeyAlias: props.toolchainKms,
      existingArtifactBucket: props.toolchainAssetBucket,
      existingAccessLogBucket: props.toolchainLogBucket,
    });
    const devStage = new ApplicationStage(this, 'Dev', { env: { account: props.account, region: props.region } });
    this.pipeline.addWave([devStage], 'application');
    this.pipeline.buildPipeline(); // Needed for CDK Nag
  }
}
