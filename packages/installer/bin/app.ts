#!/usr/bin/env ts-node

/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { ToolchainStack } from '../lib/toolchain-stack';
import { WorkloadPipelineProps, WorkloadPipelineStack } from '../lib/workload-pipeline-stack';
import { TOOLCHAIN_ENV } from '../lib/configuration';
import { getPipelineName } from '../lib/types';

const app = new App();

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
