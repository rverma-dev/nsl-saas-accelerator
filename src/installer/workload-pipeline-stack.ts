import { DeploymentRecord, getPipelineName } from '../common';
import * as demo from '../demo/pipeline-stack';
import * as pool from '../pool/pipeline-stack';
import * as silo from '../silo/pipeline-stack';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { REPOSITORY_NAME, REPOSITORY_OWNER } from './lib/configuration';

export interface WorkloadPipelineProps extends StackProps, DeploymentRecord {}

export class WorkloadPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: WorkloadPipelineProps) {
    super(scope, id, props);

    const pipelineName = getPipelineName(props);
    const repo = `${REPOSITORY_OWNER}/${REPOSITORY_NAME}`
    switch (props.type) {
      case 'demo':
        new demo.PipelineStack(this, pipelineName, {
          tenantId: props.tenantId!,
          id: props.id,
          type: props.type!,
          tier: props.tier!,
          account: props.account,
          region: props.region,
          repositoryName: repo,
        });
        break;
      case 'silo':
        new silo.PipelineStack(this, pipelineName, {
          tenantId: props.tenantId!,
          id: props.id,
          type: props.type!,
          tier: props.tier!,
          account: props.account,
          region: props.region,
          repositoryName: repo,
        });
        break;
      case 'pool':
        new pool.PipelineStack(this, pipelineName, {
          tenantId: props.tenantId!,
          id: props.id,
          type: props.type!,
          tier: props.tier!,
          account: props.account,
          region: props.region,
          repositoryName: repo,
        });
        break;
      default:
        throw new Error('Provisioning not supported');
    }
  }
}

