import { Construct } from 'constructs';
import { DeploymentRecord } from '../common';
import { SaasPipeline } from '../constructs';
import { CDK_VERSION, ASSET_ECR, ASSET_PARAMETER } from '../installer/lib/configuration';
import { Stack } from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { DockerCredential } from 'aws-cdk-lib/pipelines';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { ApplicationStage } from './application-stage';

interface WorkloadPipelineProps extends DeploymentRecord {
  readonly toolchainKms?: string;
  readonly toolchainAssetBucket?: string;
  readonly repositoryName: string;
}

export class PipelineStack extends Stack {
  readonly pipeline: SaasPipeline;

  constructor(scope: Construct, id: string, props: WorkloadPipelineProps) {
    super(scope, id, { env: { account: props.account, region: props.region } });

    const INSTALL_COMMANDS = ['yarn install --immutable --immutable-cache'];
    const SYNTH_PARAMS = ` -c deployment_type=${props.type} -c deployment_id=${props.id} -c component_account=${props.account} -c component_region=${props.region}`;
    
    // TODO: Fix these references, should be in installer only
    const imageTag = StringParameter.valueFromLookup(this, ASSET_PARAMETER);
    const ecrRepo = Repository.fromRepositoryName(this, 'CDKDockerAsset', ASSET_ECR);
    const buildImage = codebuild.LinuxArmBuildImage.fromCodeBuildImageId(`${ASSET_ECR}:${imageTag}`);

    this.pipeline = new SaasPipeline(this, 'install-pipeline', {
      pipelineName: id,
      cliVersion: CDK_VERSION,
      primarySynthDirectory: 'cdk.out',
      repositoryName: props.repositoryName,
      crossAccountKeys: true,
      synth: {},
      selfMutation: false,
      dockerCredentials: [DockerCredential.ecr([ecrRepo])],
      codeBuildDefaults: {
        cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER),
      },
      synthShellStepPartialProps: {
        installCommands: INSTALL_COMMANDS,
        commands: ['yarn cdk synth -q --verbose -y' + SYNTH_PARAMS],
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
    const devStage = new ApplicationStage(this, 'S3Site', { env: { account: props.account, region: props.region } });
    this.pipeline.addStage(devStage);
    this.pipeline.buildPipeline(); // Needed for CDK Nag
  }
}
