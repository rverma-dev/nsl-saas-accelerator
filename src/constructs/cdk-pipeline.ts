import { Aspects, RemovalPolicy, SecretValue, Stage } from 'aws-cdk-lib';
import { Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { GitHubTrigger } from 'aws-cdk-lib/aws-codepipeline-actions';
import { Key } from 'aws-cdk-lib/aws-kms';
import { BlockPublicAccess, Bucket, BucketEncryption, ObjectOwnership } from 'aws-cdk-lib/aws-s3';
import * as pipelines from 'aws-cdk-lib/pipelines';
import { NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';

const DEFAULT_BRANCH_NAME = 'main';
const REPOSITORY_SECRET = 'saas-provisoner';

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
export interface CDKPipelineProps extends pipelines.CodePipelineProps {
  /**
   * Name of the CodeCommit repository to create.
   */
  readonly repositoryName: string;

  /**
   * Output directory for cdk synthesized artifacts i.e: packages/infra/cdk.out.
   */
  readonly primarySynthDirectory: string;

  /**
   * PDKPipeline by default assumes a NX Monorepo structure for it's codebase and
   * uses sane defaults for the install and run commands. To override these defaults
   * and/or provide additional inputs, specify env settings, etc you can provide
   * a partial ShellStepProps.
   */
  readonly synthShellStepPartialProps?: pipelines.ShellStepProps;

  /**
   * Branch to trigger the pipeline execution.
   *
   * @default mainline
   */
  readonly defaultBranchName?: string;

  /**
   * Alias to use for existing KMS Key when crossAccount.
   *
   * @default mainline
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
  readonly existingAccessLogBucket?: string;

  /**
   * If we want to reuse existing artifact bucket
   * However for cross account access its better to create bucket per tenant
   */
  readonly existingArtifactBucket?: string;

  /**
   * Determine if pipeline is for toolchain or workload
   */
  readonly isToolChain?: string;
}
export class SaasPipeline extends Construct {
  readonly codePipeline: pipelines.CodePipeline;

  public constructor(scope: Construct, id: string, props: CDKPipelineProps) {
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

    const accessLogsBucket = props.existingAccessLogBucket
      ? Bucket.fromBucketName(this, `${props.pipelineName}AccessLogsBucket`, props.existingAccessLogBucket)
      : new Bucket(this, `${props.pipelineName}AccessLogsBucket`, {
          ...commonBucketProps,
          versioned: false,
          encryption: BucketEncryption.S3_MANAGED,
        });

    const artifactBucket = props.existingArtifactBucket
      ? Bucket.fromBucketName(this, `${props.pipelineName}ArtifactsBucket`, props.existingArtifactBucket)
      : new Bucket(this, `${props.pipelineName}ArtifactsBucket`, {
          ...commonBucketProps,
          encryption: props.crossAccountKeys ? BucketEncryption.KMS : BucketEncryption.S3_MANAGED,
          encryptionKey:
            props.crossAccountKeys && props.existingKMSKeyAlias
              ? Key.fromLookup(this, `${props.pipelineName}ArtifactKey`, { aliasName: props.existingKMSKeyAlias })
              : props.crossAccountKeys
              ? new Key(this, `${props.pipelineName}ArtifactKey`, {
                  enableKeyRotation: true,
                  removalPolicy: RemovalPolicy.DESTROY,
                  alias: `pipeline/${props.pipelineName}`,
                })
              : undefined,
          serverAccessLogsPrefix: 'access-logs',
          serverAccessLogsBucket: accessLogsBucket,
        });

    const githubInput = pipelines.CodePipelineSource.gitHub(
      props.repositoryName,
      props.defaultBranchName || DEFAULT_BRANCH_NAME,
      {
        trigger: GitHubTrigger.NONE,
        authentication: SecretValue.secretsManager(REPOSITORY_SECRET, {
          jsonField: 'github_token',
        }),
      },
    );

    const codePipeline = new Pipeline(this, `CodePipeline`, {
      pipelineName: props.pipelineName,
      enableKeyRotation: props.crossAccountKeys,
      restartExecutionOnUpdate: true,
      crossAccountKeys: props.crossAccountKeys,
      artifactBucket,
    });

    // ignore input and primaryOutputDirectory
    const { input, primaryOutputDirectory, commands, installCommands, ...synthShellStepPartialProps } =
      props.synthShellStepPartialProps || {};

    const synthShellStep = new pipelines.ShellStep(`${props.pipelineName}Synth`, {
      input: githubInput,
      installCommands: installCommands && installCommands.length > 0 ? installCommands : ['yarn install --immutable'],
      commands: commands && commands.length > 0 ? commands : ['yarn synth:silent -y'],
      primaryOutputDirectory: props.primarySynthDirectory,
      ...(synthShellStepPartialProps || {}),
    });

    synthShellStep.addOutputDirectory('.');

    const codePipelineProps: pipelines.CodePipelineProps = {
      codePipeline,
      ...props,
      crossAccountKeys: undefined,
      synth: synthShellStep,
      pipelineName: undefined,
    };

    this.codePipeline = new pipelines.CodePipeline(this, id, codePipelineProps);
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
