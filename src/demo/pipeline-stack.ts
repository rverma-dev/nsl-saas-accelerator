import { Construct } from 'constructs';
import { ApplicationStage } from './application-stage';
import { DeploymentRecord } from '../common';
import { SaasPipeline } from '../constructs';
import { CDK_VERSION } from '../installer/lib/configuration';
import { Stack } from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';

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
    const buildImage = codebuild.LinuxArmBuildImage.fromCodeBuildImageId(props.toolchainImage);
    const INSTALL_COMMANDS = ['yarn install --immutable --immutable-cache'];
    const SYNTH_PARAMS = ` -c deployment_type=${props.type} -c deployment_id=${props.id} -c component_account=${props.account} -c component_region=${props.region}`;

    this.pipeline = new SaasPipeline(this, `${props.tenantId}-${props.id}-demo`, {
      pipelineName: props.id,
      cliVersion: CDK_VERSION,
      primarySynthDirectory: 'cdk.out',
      repositoryName: props.repositoryName,
      crossAccountKeys: true,
      synth: {},
      selfMutation: true,
      codeBuildDefaults: {
        cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER),
      },
      synthShellStepPartialProps: {
        installCommands: INSTALL_COMMANDS,
        commands: ['yarn cdk synth' + SYNTH_PARAMS + ' -y'],
      },
      synthCodeBuildDefaults: {
        buildEnvironment: {
          computeType: codebuild.ComputeType.SMALL,
          buildImage: buildImage,
        },
      },
      existingKMSKeyAlias: props.toolchainKms,
      existingArtifactBucket: props.toolchainAssetBucket,
      dockerEnabledForSynth: true,
    });
    const devStage = new ApplicationStage(this, 'Dev', { env: { account: props.account, region: props.region } });
    this.pipeline.addStage(devStage);
    this.pipeline.buildPipeline(); // Needed for CDK Nag
  }
}
