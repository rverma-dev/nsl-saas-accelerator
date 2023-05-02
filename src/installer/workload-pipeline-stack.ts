import { Construct } from 'constructs';
import { ASSET_ECR, ASSET_PARAMETER, CDK_VERSION, REPOSITORY_NAME, REPOSITORY_OWNER } from './lib/configuration';
import { DeploymentRecord } from '../common';
import { SaasPipeline } from '../constructs';
import * as demo from '../demo/pipeline-stack';
import * as pool from '../pool/pipeline-stack';
import * as silo from '../silo/pipeline-stack';
import { Fn, Stack, StackProps } from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { DockerCredential } from 'aws-cdk-lib/pipelines';
// import { DockerCredential } from 'aws-cdk-lib/pipelines';

export interface WorkloadPipelineProps extends DeploymentRecord, StackProps {}

export class WorkloadPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: WorkloadPipelineProps) {
    super(scope, id, { env: { account: props.account, region: props.region } });
    const toolChainProps = {
      toolchainKms: 'pipeline/toolchain',
      toolchainAssetBucket: Fn.importValue('toolchainBucket').toString() || 'toolchain-bucket',
      repositoryName: `${REPOSITORY_OWNER}/${REPOSITORY_NAME}`,
      imageTag: this.node.tryGetContext(ASSET_PARAMETER) ?? StringParameter.valueFromLookup(this, ASSET_PARAMETER),
      ecrRepo: Repository.fromRepositoryName(this, 'CDKDockerAsset', ASSET_ECR),
    };

    const INSTALL_COMMANDS = ['yarn install --immutable --immutable-cache'];
    const SYNTH_PARAMS = ` -c deployment_type=${props.type} -c deployment_id=${props.id} -c component_account=${props.account} -c component_region=${props.region}`;
    const buildImage = codebuild.LinuxArmBuildImage.fromCodeBuildImageId(`${ASSET_ECR}:${toolChainProps.imageTag}`);

    const pipeline = new SaasPipeline(this, 'workload', {
      pipelineName: id,
      cliVersion: CDK_VERSION,
      primarySynthDirectory: 'cdk.out',
      repositoryName: toolChainProps.repositoryName,
      crossAccountKeys: true,
      synth: {},
      selfMutation: false,
      dockerEnabledForSynth: true,
      dockerCredentials: [DockerCredential.ecr([toolChainProps.ecrRepo])],
      synthShellStepPartialProps: {
        installCommands: INSTALL_COMMANDS,
        commands: ['yarn cdk synth -q --verbose -y' + SYNTH_PARAMS],
      },
      synthCodeBuildDefaults: {
        buildEnvironment: {
          buildImage: buildImage,
        },
      },
      existingKMSKeyAlias: toolChainProps.toolchainKms,
      existingArtifactBucket: toolChainProps.toolchainAssetBucket,
    });

    switch (props.type) {
      case 'demo':
        demo.PipelineStack(pipeline, props);
        break;
      case 'silo':
        silo.PipelineStack(pipeline, props);
        break;
      case 'pool':
        pool.PipelineStack(pipeline, props);
        break;
      default:
        throw new Error('Provisioning not supported');
    }
    pipeline.buildPipeline(); // Needed for CDK Nag
  }
}
