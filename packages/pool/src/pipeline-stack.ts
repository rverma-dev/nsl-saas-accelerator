import { DeploymentRecord } from '@nsa/common';
import { SaasPipeline } from '@nsa/construct';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApplicationStage } from './application-stage';

interface WorkloadPipelineProps extends DeploymentRecord, StackProps {}

export class PipelineStack extends Stack {
  readonly pipeline: SaasPipeline;

  constructor(scope: Construct, id: string, props: WorkloadPipelineProps) {
    super(scope, id, props);
    this.pipeline = new SaasPipeline(this, 'ApplicationPipeline', {
      primarySynthDirectory: 'packages/pool/cdk.out',
      repositoryName: this.node.tryGetContext('repositoryName') || 'nsl-saas-accelerator',
      publishAssetsInParallel: false,
      crossAccountKeys: true,
      synth: {},
      dockerEnabledForSelfMutation: true,
    });
    const devStage = new ApplicationStage(scope, 'Dev', {
      env: {
        account: props.account,
        region: props.region,
      },
    });

    this.pipeline.addWave('application')
      .addStage(devStage);
    this.pipeline.buildPipeline(); // Needed for CDK Nag
  }
}
