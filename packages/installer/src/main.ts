import { PDKNag } from '@aws-prototyping-sdk/pdk-nag';
import { TOOLCHAIN_ENV } from './lib/configuration';
import { ToolchainStack } from './lib/toolchain-stack';
import { getPipelineName } from './lib/types';
import { WorkloadPipelineProps, WorkloadPipelineStack } from './lib/workload-pipeline-stack';

const app = PDKNag.app();

/*
 * This is the main CDK application for the sample solution.
 *
 * This CDK application has two modes of operation, and will synthesize a different
 * stack depending on the mode.
 *
 * Mode A: Synthesize the toolchain stack. This is the default mode.
 *         This is used during the initial deployment of the solution, and by
 *         the CI/CD Pipeline for synthesizing the stack during updates.
 *         No additional arguments are used.
 *
 * Mode B: In this mode, the application synthesizes a silo or pool workload pipeline
 *         stack. To operate in this mode, AWS CDK CLI is called with the following
 *         context variables (-c in the CLI)
 *
 *         tenant_id    : the tenant id
 *         deployment_type  : the type of deployment stack to create (silo|pool)
 *         component_account: the AWS Account where the component resources for
 *                          : this deployment are deployed to
 *         component_region : the AWS Region, as above
 *         deployment_size  : the size of deployment
 */

const tenantID = <string>app.node.tryGetContext('tenant_id');
const deploymentId = <string>app.node.tryGetContext('deployment_id');
const deploymentType = <string>app.node.tryGetContext('deployment_type');
const deploymentTier = <string>app.node.tryGetContext('deployment_tier');
const componentAccount = <string>app.node.tryGetContext('component_account');
const componentRegion = <string>app.node.tryGetContext('component_region');

if (!deploymentType) {
  // Mode A: synthesize the main toolchain stack
  new ToolchainStack(app, 'toolchain', {
    env: TOOLCHAIN_ENV,
  });
} else {
  // Mode B: synthetize the workload pipeline stack
  const workloadProps: WorkloadPipelineProps = {
    id: deploymentId,
    tenantId: tenantID,
    type: deploymentType,
    tier: deploymentTier,
    region: componentRegion,
    account: componentAccount,
  };
  const stackName = getPipelineName(workloadProps);
  console.log(`Synthesizing stack for ${stackName}in ${componentAccount}/${componentRegion}`);
  new WorkloadPipelineStack(app, stackName, { ...workloadProps, env: TOOLCHAIN_ENV });
}