import { DeploymentRecord } from '@nsa/common';
import { SaasPipeline } from '@nsa/construct';
import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApplicationStage } from './application-stage';

interface WorkloadPipelineProps extends DeploymentRecord {}

export class PipelineStack extends Stack {
  readonly pipeline: SaasPipeline;

  constructor(scope: Construct, id: string, props: WorkloadPipelineProps) {
    super(scope, id, { env: { account: props.account, region: props.region } });
    this.pipeline = new SaasPipeline(this, `${props.tenantId}-${props.id}-demo`, {
      primarySynthDirectory: 'packages/demo/cdk.out',
      repositoryName: this.node.tryGetContext('repositoryName') || 'nsl-saas-accelerator',
      publishAssetsInParallel: false,
      crossAccountKeys: true,
      existingKMSKeyAlias: 'nsa/provisioner',
      synth: {},
      dockerEnabledForSynth: true,
      dockerEnabledForSelfMutation: true,
    });
    const devStage = new ApplicationStage(this, 'Dev', { env: { account: props.account, region: props.region } });
    this.pipeline.addStage(devStage);
    this.pipeline.buildPipeline(); // Needed for CDK Nag
  }
}
