import { Construct } from 'constructs';
import { REPOSITORY_NAME, REPOSITORY_OWNER } from './configuration';
import { DeploymentRecord } from '../../common';
import { SaasPipeline } from '../../constructs';
import { Stack } from 'aws-cdk-lib';

interface WorkloadPipelineProps extends DeploymentRecord {
  readonly toolchainKms?: string;
  readonly toolchainLogBucket?: string;
  readonly toolchainAssetBucket?: string;
}

export class WorkloadPipelineStack extends Stack {
  readonly pipeline: SaasPipeline;

  constructor(scope: Construct, id: string, props: WorkloadPipelineProps) {
    super(scope, id, { env: { account: props.account, region: props.region } });
    this.pipeline = new SaasPipeline(this, `${props.tenantId}-${props.id}-demo`, {
      primarySynthDirectory: 'cdk.out',
      repositoryName: this.node.tryGetContext('repositoryName') || `${REPOSITORY_OWNER}/${REPOSITORY_NAME}`,
      publishAssetsInParallel: true,
      crossAccountKeys: true,
      synth: {},
      dockerEnabledForSynth: true,
      existingKMSKeyAlias: props.toolchainKms,
      existingArtifactBucket: props.toolchainAssetBucket,
      existingAccessLogBucket: props.toolchainLogBucket,
    });
    // const devStage = new ApplicationStage(this, 'Dev', { env: { account: props.account, region: props.region } });
    // this.pipeline.addStage(devStage);
    this.pipeline.buildPipeline(); // Needed for CDK Nag
  }
}
