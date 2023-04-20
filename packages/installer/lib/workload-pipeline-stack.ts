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

import { aws_codebuild, aws_ecr, pipelines, SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CDK_VERSION, REPOSITORY_NAME, REPOSITORY_SECRET, REPOSITORY_OWNER } from './configuration';
import { ComputeType } from 'aws-cdk-lib/aws-codebuild';
import { DeploymentRecord, getPipelineName } from './types';
import { ComponentStage } from '@nsa/demo';
import { GitHubTrigger } from 'aws-cdk-lib/aws-codepipeline-actions';

export interface WorkloadPipelineProps extends StackProps, DeploymentRecord {}

export class WorkloadPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: WorkloadPipelineProps) {
    super(scope, id, props);

    const ecrRepo = aws_ecr.Repository.fromRepositoryName(this, 'get-installer-repo', 'nsa-installer');
    const sourceInput = pipelines.CodePipelineSource.gitHub(`${REPOSITORY_OWNER}/${REPOSITORY_NAME}`, 'main', {
      trigger: GitHubTrigger.NONE,
      authentication: SecretValue.secretsManager(REPOSITORY_SECRET, {
        jsonField: 'github_token',
      }),
    });
    const synthStep = new pipelines.CodeBuildStep('synth', {
      input: sourceInput,
      buildEnvironment: {
        buildImage: aws_codebuild.LinuxArmBuildImage.fromEcrRepository(ecrRepo),
        computeType: ComputeType.SMALL,
      },
      commands: [
        `cd /app`,
        `yarn cdk synth --toolkit-stack-name nsl-CDKToolkit -q --verbose \
        -c tenant_id=${props.tenantId} -c deployment_type=${props.type} -c deployment_id=${props.id} \
        -c component_account=${props.account} -c deployment_tier=${props.tier} -c component_region=${props.region} `,
      ],
      primaryOutputDirectory: '/app/cdk.out',
    });

    const pipelineName = getPipelineName(props);
    const pipeline = new pipelines.CodePipeline(this, pipelineName, {
      pipelineName: pipelineName,
      selfMutation: true,
      synth: synthStep,
      crossAccountKeys: true,
      cliVersion: CDK_VERSION,
    });
    pipeline.addStage(
      new ComponentStage(this, props.id, {
        tenantID: props.tenantId!,
        deploymentId: props.id,
        deploymentType: props.type!,
        deploymentTier: props.tier!,
        env: { account: props.account, region: props.region }, // defines where the resources will be provisioned
      }),
    );
  }
}
