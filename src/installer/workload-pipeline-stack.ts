import { Construct } from 'constructs';
import { REPOSITORY_NAME, REPOSITORY_OWNER } from './lib/configuration';
import { DeploymentRecord } from '../common';
import * as demo from '../demo/pipeline-stack';
import * as pool from '../pool/pipeline-stack';
import * as silo from '../silo/pipeline-stack';
import { Fn } from 'aws-cdk-lib';

export interface WorkloadPipelineProps extends DeploymentRecord {}

export class WorkloadPipelineStack {
  constructor(scope: Construct, id: string, props: WorkloadPipelineProps) {
    const toolChainProps = {
      toolchainKms: 'pipeline/toolchain',
      toolchainAssetBucket: Fn.importValue('toolchainBucket').toString() || 'toolchain-bucket',
      toolchainImage:
        Fn.importValue('buildImage').toString() ||
        '415505189627.dkr.ecr.ap-south-1.amazonaws.com/cdk-hnb659fds-container-assets-415505189627-ap-south-1:latest',
      repositoryName: `${REPOSITORY_OWNER}/${REPOSITORY_NAME}`,
    };
    switch (props.type) {
      case 'demo':
        new demo.PipelineStack(scope, id, {
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
        new silo.PipelineStack(scope, id, {
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
        new pool.PipelineStack(scope, id, {
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
