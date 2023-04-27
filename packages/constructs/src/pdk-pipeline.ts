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
 * Properties to configure the PDKPipeline.
 *
 * Note: Due to limitations with JSII and generic support it should be noted that
 * the synth, synthShellStepPartialProps.input and
 * synthShellStepPartialProps.primaryOutputDirectory properties will be ignored
 * if passed in to this construct.
 *
 * synthShellStepPartialProps.commands is marked as a required field, however
 * if you pass in [] the default commands of this construct will be retained.
 */
export interface PDKPipelineProps extends pipelines.CodePipelineProps {
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

/**
 * An extension to CodePipeline which configures sane defaults for a NX Monorepo
 * codebase. In addition to this, it also creates a CodeCommit repository with
 * automated PR builds and approvals.
 */
export class SaasPipeline extends Construct {
  readonly codePipeline: pipelines.CodePipeline;

  public constructor(scope: Construct, id: string, props: PDKPipelineProps) {
    super(scope, id);

    this.node.setContext('@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy', true);

    const accessLogsBucket = props.existingAccessLogBucket ?
      Bucket.fromBucketName(this, 'ExAccessLogsBucket', props.existingAccessLogBucket) :
      new Bucket(this, 'AccessLogsBucket', {
        versioned: false,
        enforceSSL: true,
        autoDeleteObjects: true,
        removalPolicy: RemovalPolicy.DESTROY,
        encryption: BucketEncryption.S3_MANAGED,
        objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
        publicReadAccess: false,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      });

    const artifactBucket = props.existingArtifactBucket ?
      Bucket.fromBucketName(this, 'ExArtifactsBucket', props.existingArtifactBucket) :
      new Bucket(this, 'ArtifactsBucket', {
        enforceSSL: true,
        autoDeleteObjects: true,
        removalPolicy: RemovalPolicy.DESTROY,
        encryption: props.crossAccountKeys ? BucketEncryption.KMS : BucketEncryption.S3_MANAGED,
        encryptionKey: props.crossAccountKeys && props.existingKMSKeyAlias ?
          Key.fromLookup(this, 'ArtifactKey', { aliasName: props.existingKMSKeyAlias }) :
          props.crossAccountKeys ?
            new Key(this, 'ArtifactKey', {
              enableKeyRotation: true,
              removalPolicy: RemovalPolicy.DESTROY,
            }) : undefined,
        objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
        publicReadAccess: false,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
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

    const codePipeline = new Pipeline(this, 'CodePipeline', {
      enableKeyRotation: props.crossAccountKeys,
      restartExecutionOnUpdate: true,
      crossAccountKeys: props.crossAccountKeys,
      artifactBucket,
    });

    // ignore input and primaryOutputDirectory
    const { input, primaryOutputDirectory, commands, ...synthShellStepPartialProps } =
    props.synthShellStepPartialProps || {};

    const synthShellStep = new pipelines.ShellStep('Synth', {
      input: githubInput,
      installCommands: ['npm install -g aws-cdk pnpm', 'pnpm install --frozen-lockfile'],
      commands: commands && commands.length > 0 ? commands : ['npx nx run-many --target=build --all'],
      primaryOutputDirectory: props.primarySynthDirectory,
      ...(synthShellStepPartialProps || {}),
    });

    synthShellStep.addOutputDirectory('.');

    const codePipelineProps: pipelines.CodePipelineProps = {
      codePipeline,
      ...props,
      crossAccountKeys: undefined,
      synth: synthShellStep,
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

  addWave(wave: string, options?: pipelines.WaveOptions): pipelines.Wave {
    return this.codePipeline.addWave(wave, options);
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
