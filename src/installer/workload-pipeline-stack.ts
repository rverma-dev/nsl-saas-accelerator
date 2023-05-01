import { Construct } from 'constructs';
import { REPOSITORY_NAME, REPOSITORY_OWNER } from './lib/configuration';
import { DeploymentRecord } from '../common';
import * as demo from '../demo/pipeline-stack';
import * as pool from '../pool/pipeline-stack';
import * as silo from '../silo/pipeline-stack';
import { Fn, Stack } from 'aws-cdk-lib';

export interface WorkloadPipelineProps extends DeploymentRecord {}

export class WorkloadPipelineStack {
  readonly testStack: Stack;
  constructor(scope: Construct, id: string, props: WorkloadPipelineProps) {
    const toolChainProps = {
      toolchainKms: 'pipeline/toolchain',
      toolchainAssetBucket: Fn.importValue('toolchainBucket').toString() || 'toolchain-bucket',
      toolchainImage: `e807bfbcf34bd2dc28f71e57ff634fd03e701f7c274496cc631af6fdb3807cd8`,
      repositoryName: `${REPOSITORY_OWNER}/${REPOSITORY_NAME}`,
    };
    switch (props.type) {
      case 'demo':
        this.testStack = new demo.PipelineStack(scope, id, {
          tenantId: props.tenantId!,
          id: props.id,
          type: props.type!,
          tier: props.tier!,
          account: props.account,
          region: props.region,
          ...toolChainProps,
        });
        break;
      case 'silo':
        this.testStack = new silo.PipelineStack(scope, id, {
          tenantId: props.tenantId!,
          id: props.id,
          type: props.type!,
          tier: props.tier!,
          account: props.account,
          region: props.region,
          ...toolChainProps,
        });
        break;
      case 'pool':
        this.testStack = new pool.PipelineStack(scope, id, {
          tenantId: props.tenantId!,
          id: props.id,
          type: props.type!,
          tier: props.tier!,
          account: props.account,
          region: props.region,
          ...toolChainProps,
        });
        break;
      default:
        throw new Error('Provisioning not supported');
    }
  }
}
