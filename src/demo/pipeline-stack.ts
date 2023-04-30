import { ApplicationStage } from './application-stage';
import { DeploymentRecord } from '../common';
import { SaasPipeline } from '../constructs';
import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface WorkloadPipelineProps extends DeploymentRecord {
  readonly toolchainKms?: string;
  readonly toolchainAssetBucket?: string;
  readonly repositoryName: string;
  readonly toolchainImage: string;
}

export class PipelineStack extends Stack {
  readonly pipeline: SaasPipeline;
  // const buildImage = LinuxArmBuildImage.fromCodeBuildImageId('aws/codebuild/amazonlinux2-aarch64-standard:3.0');

  constructor(scope: Construct, id: string, props: WorkloadPipelineProps) {
    super(scope, id, { env: { account: props.account, region: props.region } });
    this.pipeline = new SaasPipeline(this, `${props.tenantId}-${props.id}-demo`, {
      pipelineName: props.id,
      primarySynthDirectory: 'cdk.out',
      repositoryName: props.repositoryName,
      crossAccountKeys: true,
      synth: {},
      existingKMSKeyAlias: props.toolchainKms,
      existingArtifactBucket: props.toolchainAssetBucket,
    });
    const devStage = new ApplicationStage(this, 'Dev', { env: { account: props.account, region: props.region } });
    this.pipeline.addStage(devStage);
    this.pipeline.buildPipeline(); // Needed for CDK Nag
  }
}
