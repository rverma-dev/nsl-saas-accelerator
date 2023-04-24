import { DemoPipeline } from '@nsa/demo/lib/pipeline-stack';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DeploymentRecord, getPipelineName } from './lib/types';
export interface WorkloadPipelineProps extends StackProps, DeploymentRecord {}

export class WorkloadPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: WorkloadPipelineProps) {
    super(scope, id, props);

    // const ecrRepo = aws_ecr.Repository.fromRepositoryName(this, 'get-installer-repo', 'nsa-installer');
    // const sourceInput = pipelines.CodePipelineSource.gitHub(`${REPOSITORY_OWNER}/${REPOSITORY_NAME}`, 'main', {
    //   trigger: GitHubTrigger.NONE,
    //   authentication: SecretValue.secretsManager(REPOSITORY_SECRET, {
    //     jsonField: 'github_token',
    //   }),
    // });
    const pipelineName = getPipelineName(props);
    new DemoPipeline(this, pipelineName, {
      tenantID: props.tenantId!,
      deploymentId: props.id,
      deploymentType: props.type!,
      deploymentTier: props.tier!,
      env: { account: props.account, region: props.region }, // defines where the resources will be provisioned
    });
    // new pipelines.CodeBuildStep('synth', {
    //   input: sourceInput,
    //   buildEnvironment: {
    //     buildImage: aws_codebuild.LinuxArmBuildImage.fromEcrRepository(ecrRepo),
    //     computeType: ComputeType.SMALL,
    //   },
    //   commands: [
    //     'cd /app',
    //     `yarn cdk synth --toolkit-stack-name nsl-CDKToolkit -q --verbose \
    //     -c tenant_id=${props.tenantId} -c deployment_type=${props.type} -c deployment_id=${props.id} \
    //     -c component_account=${props.account} -c deployment_tier=${props.tier} -c component_region=${props.region} `,
    //   ],
    //   primaryOutputDirectory: '/app/cdk.out',
    // });
    //
    //
    // const pipeline = new pipelines.CodePipeline(this, pipelineName, {
    //   pipelineName: pipelineName,
    //   selfMutation: true,
    //   synth: synthStep,
    //   crossAccountKeys: true,
    //   cliVersion: CDK_VERSION,
    // });
    // pipeline.addStage(
    //   new DemoSite(this, props.id, {
    //     tenantID: props.tenantId!,
    //     deploymentId: props.id,
    //     deploymentType: props.type!,
    //     deploymentTier: props.tier!,
    //     env: { account: props.account, region: props.region }, // defines where the resources will be provisioned
    //   }),
    // );
  }
}
