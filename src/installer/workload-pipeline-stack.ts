import { CDK_VERSION, REPOSITORY_NAME, REPOSITORY_OWNER } from './lib/configuration';
import { DeploymentRecord } from '../common';
import { SaasPipeline } from '../constructs';
import * as demo from '../demo/pipeline-stack';
import * as pool from '../pool/pipeline-stack';
import * as silo from '../silo/pipeline-stack';

import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface WorkloadPipelineProps extends DeploymentRecord, StackProps {}

export class WorkloadPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: WorkloadPipelineProps) {
    super(scope, id, { env: { account: props.account, region: props.region } });
    const repositoryName = `${REPOSITORY_OWNER}/${REPOSITORY_NAME}`;

    // const INSTALL_COMMANDS = ['yarn install --immutable --immutable-cache'];
    const SYNTH_PARAMS = ` -c tenant_id=${props.tenantId} -c deployment_tier=${props.tier} -c deployment_type=${props.type} -c deployment_id=${props.id} -c component_account=${props.account} -c component_region=${props.region}`;

    const pipeline = new SaasPipeline(this, 'workload', {
      pipelineName: id,
      cliVersion: CDK_VERSION,
      primarySynthDirectory: 'cdk.out',
      repositoryName: repositoryName,
      crossAccountKeys: true,
      synth: {},
      selfMutation: false,
      commands: [`yarn cdk synth -q --verbose -y ${SYNTH_PARAMS}`],
      isToolchain: false
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
