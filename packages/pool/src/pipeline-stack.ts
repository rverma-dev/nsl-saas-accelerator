import { DeploymentRecord } from '@nsa/common';
import { Stack, StackProps } from 'aws-cdk-lib';
import { PDKPipeline } from 'aws-prototyping-sdk/pipeline';
import { Construct } from 'constructs';
import { ApplicationStage } from './application-stage';

interface WorkloadPipelineProps extends DeploymentRecord, StackProps {}

export class PipelineStack extends Stack {
  readonly pipeline: PDKPipeline;

  constructor(scope: Construct, id: string, props: WorkloadPipelineProps) {
    super(scope, id, props);
    this.pipeline = new PDKPipeline(this, 'ApplicationPipeline', {
      pipelineName: `${props.tenantId}-${props.id}-${props.type}`,
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

    const appWave = this.pipeline.codePipeline.addWave('application');
    appWave.addStage(devStage);
    this.pipeline.buildPipeline(); // Needed for CDK Nag
  }
}
