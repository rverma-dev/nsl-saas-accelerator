import { Construct } from 'constructs';
import { Aspects, CfnOutput, RemovalPolicy, Stage } from 'aws-cdk-lib';
import { Cache, ComputeType, LinuxArmBuildImage, LocalCacheMode } from 'aws-cdk-lib/aws-codebuild';
import { Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { Key } from 'aws-cdk-lib/aws-kms';
import { BlockPublicAccess, Bucket, BucketEncryption, ObjectOwnership } from 'aws-cdk-lib/aws-s3';
import * as pipelines from 'aws-cdk-lib/pipelines';
import { NagSuppressions } from 'cdk-nag';

const DEFAULT_BRANCH_NAME = 'main';
const CONNECTION =
  'arn:aws:codestar-connections:ap-south-1:415505189627:connection/03ad38fd-c299-4b2b-9058-c1a9ae5a2cc6'; // Created using the AWS console

/**
 * Properties to configure the CDKPipeline.
 *
 * Note: Due to limitations with JSII and generic support it should be noted that
 * the synth, synthShellStepPartialProps.input and
 * synthShellStepPartialProps.primaryOutputDirectory properties will be ignored
 * if passed in to this construct.
 *
 * synthShellStepPartialProps.commands is marked as a required field, however
 * if you pass in [] the default commands of this construct will be retained.
 */
export interface SaasPipelineProps extends pipelines.CodePipelineProps {
  /**
   * Name of the CodeCommit repository to create.
   */
  readonly repositoryName: string;

  /**
   * Pipeline initally created by default assumes a NX Monorepo structure for it's codebase and
   * uses sane defaults for the install and run commands. To override these defaults
   * and/or provide additional inputs, specify env settings, etc you can provide
   * a partial ShellStepProps.
   */
  readonly synthShellStepPartialProps?: pipelines.ShellStepProps;

  /**
   * Output directory for cdk synthesized artifacts i.e: packages/infra/cdk.out,
   * defined mostly for monorepos
   * @default cdk.out
   */
  readonly primarySynthDirectory?: string;

  /**
   * Branch to trigger the pipeline execution.
   *
   * @default main
   */
  readonly defaultBranchName?: string;

  /**
   * Alias to use for existing KMS Key when crossAccount.
   *
   */
  readonly existingKMSKeyAlias?: string;

  /**
   * Possible values for a resource's Removal Policy
   * The removal policy controls what happens to the resource if it stops being managed by CloudFormation.
   */
  readonly codeCommitRemovalPolicy?: RemovalPolicy;

  /**
   * If we want to reuse existing artifact bucket
   * However for cross account access its better to create bucket per tenant
   */
  readonly existingArtifactBucket?: string;
}

export class SaasPipeline extends Construct {
  readonly codePipeline: pipelines.CodePipeline;

  public constructor(scope: Construct, id: string, props: SaasPipelineProps) {
    super(scope, id);

    this.node.setContext('@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy', true);
    const commonBucketProps = {
      enforceSSL: true,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    };

    const artifactBucket = props.existingArtifactBucket
      ? Bucket.fromBucketName(this, 'ArtifactsBucket', props.existingArtifactBucket)
      : new Bucket(this, 'ArtifactsBucket', {
          ...commonBucketProps,
          encryption: props.crossAccountKeys ? BucketEncryption.KMS : BucketEncryption.S3_MANAGED,
          encryptionKey:
            props.crossAccountKeys && props.existingKMSKeyAlias
              ? Key.fromLookup(this, 'ArtifactKey', { aliasName: props.existingKMSKeyAlias })
              : props.crossAccountKeys
              ? new Key(this, 'ArtifactKey', {
                  enableKeyRotation: true,
                  removalPolicy: RemovalPolicy.DESTROY,
                  alias: `pipeline/${props.pipelineName}`,
                })
              : undefined,
          serverAccessLogsPrefix: 'access-logs',
          serverAccessLogsBucket: new Bucket(this, 'AccessLogsBucket', {
            ...commonBucketProps,
            versioned: false,
            encryption: BucketEncryption.S3_MANAGED,
          }),
        });

    if (!props.existingArtifactBucket) {
      new CfnOutput(this, 'ArtifactsBucketOutput', { value: artifactBucket.bucketName, exportName: 'toolchainBucket' });
    }

    const githubInput = pipelines.CodePipelineSource.connection(
      props.repositoryName,
      props.defaultBranchName || DEFAULT_BRANCH_NAME,
      {
        triggerOnPush: false,
        connectionArn: CONNECTION,
      },
    );

    // ignore input and primaryOutputDirectory
    const { input, primaryOutputDirectory, commands, installCommands, ...synthShellStepPartialProps } =
      props.synthShellStepPartialProps || {};

    const synthShellStep = new pipelines.ShellStep('Synth', {
      input: githubInput,
      installCommands:
        installCommands && installCommands.length > 0
          ? installCommands
          : [
              'n 18',
              'corepack enable',
              'corepack prepare yarn@stable --activate',
              'yarn set version stable',
              'yarn install --immutable',
            ],
      commands: commands && commands.length > 0 ? commands : ['yarn synth:silent -y'],
      primaryOutputDirectory: props.primarySynthDirectory || 'cdk.out',
      ...(synthShellStepPartialProps || {}),
    });
    // We are creating a new artificat bucket for toolchain stack only
    if (!props.existingArtifactBucket) {
      synthShellStep.addOutputDirectory('.');
    }

    const codePipeline = new Pipeline(this, `CodePipeline`, {
      pipelineName: props.pipelineName,
      crossAccountKeys: props.crossAccountKeys,
      enableKeyRotation: props.crossAccountKeys,
      restartExecutionOnUpdate: true,
      artifactBucket,
    });

    const codePipelineProps: pipelines.CodePipelineProps = {
      codePipeline,
      ...props,
      crossAccountKeys: undefined,
      synth: synthShellStep,
      pipelineName: undefined,
      codeBuildDefaults: {
        cache: Cache.local(LocalCacheMode.DOCKER_LAYER),
        buildEnvironment: {
          computeType: ComputeType.SMALL,
          buildImage: LinuxArmBuildImage.fromCodeBuildImageId('aws/codebuild/amazonlinux2-aarch64-standard:3.0'),
        },
      },
    };

    this.codePipeline = new pipelines.CodePipeline(this, props.pipelineName || id, codePipelineProps);
  }

  /**
   * @inheritDoc
   */
  addStage(stage: Stage, options?: pipelines.AddStageOpts): pipelines.StageDeployment {
    // Add any root Aspects to the stage level as currently this doesn't happen automatically
    Aspects.of(stage.node.root).all.forEach(aspect => Aspects.of(stage).add(aspect));
    return this.codePipeline.addStage(stage, options);
  }

  addWave(stages: Stage[], waveName: string, options?: pipelines.WaveOptions): pipelines.Wave {
    const wave = this.codePipeline.addWave(waveName, options);
    stages.forEach(stage => {
      Aspects.of(stage.node.root).all.forEach(aspect => Aspects.of(stage).add(aspect));
      wave.addStage(stage);
    });
    return wave;
  }

  buildPipeline() {
    this.codePipeline.buildPipeline();
    this.suppressCDKViolations();
  }

  suppressCDKViolations() {
    this.suppressRules(
      ['AwsSolutions-IAM5', 'AwsPrototyping-IAMNoWildcardPermissions'],
      'Wildcards are needed for dynamically created resources.',
    );

    this.suppressRules(
      ['AwsSolutions-CB4', 'AwsPrototyping-CodeBuildProjectKMSEncryptedArtifacts'],
      'Encryption of Codebuild is not required.',
    );

    this.suppressRules(
      ['AwsSolutions-S1', 'AwsPrototyping-S3BucketLoggingEnabled'],
      'Access Log buckets should not have s3 bucket logging',
    );
  }

  private suppressRules(rules: string[], reason: string) {
    NagSuppressions.addResourceSuppressions(
      this,
      rules.map(r => ({
        id: r,
        reason,
      })),
      true,
    );
  }
}
