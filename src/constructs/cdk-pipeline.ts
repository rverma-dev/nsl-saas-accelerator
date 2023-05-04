import { Aspects, CfnOutput, Fn, RemovalPolicy, Stage } from 'aws-cdk-lib';
import { BuildSpec, Cache, ComputeType, LinuxArmBuildImage } from 'aws-cdk-lib/aws-codebuild';
import { Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { IKey, Key } from 'aws-cdk-lib/aws-kms';
import { BlockPublicAccess, Bucket, BucketEncryption, IBucket, ObjectOwnership } from 'aws-cdk-lib/aws-s3';
import * as pipelines from 'aws-cdk-lib/pipelines';
import { NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';

const CONNECTION =
  'arn:aws:codestar-connections:ap-south-1:415505189627:connection/03ad38fd-c299-4b2b-9058-c1a9ae5a2cc6'; // Created using the AWS console

export interface SaasPipelineProps extends pipelines.CodePipelineProps {
  commands?: string[];
  installCommands?: string[];
  /**
   * Name of the Source github repository.
   */
  readonly repositoryName: string;

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
   * If we want to reuse existing artifact bucket
   * However for cross account access its better to create bucket per tenant
   */
  readonly isToolchain?: boolean;
}

export class SaasPipeline extends Construct {
  readonly codePipeline: pipelines.CodePipeline;
  readonly cacheBucket: IBucket;

  public constructor(scope: Construct, id: string, props: SaasPipelineProps) {
    super(scope, id);

    this.node.setContext('@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy', true);
    const commonBucketProps = {
      enforceSSL: true,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL
    };

    let logBucket: IBucket, cacheBucket: IBucket, bucketKey: IKey;

    // 1. Create Artifact Bucket
    // we intend to define all this for just toolchain account
    if (props.isToolchain) {
      logBucket = new Bucket(this, 'AccessLogsBucket', {
        ...commonBucketProps,
        versioned: false,
        encryption: BucketEncryption.S3_MANAGED
      });
      bucketKey = new Key(this, 'ArtifactKey', {
        enableKeyRotation: true,
        removalPolicy: RemovalPolicy.DESTROY,
        alias: `pipeline/${props.pipelineName}`
      });
      cacheBucket = new Bucket(this, 'CdkCacheBucket', {
        ...commonBucketProps,
        versioned: false,
        encryption: BucketEncryption.S3_MANAGED
      });
      new CfnOutput(this, 'LogBucketOutput', { value: logBucket.bucketName, exportName: 'toolchainLogBucket' });
      new CfnOutput(this, 'CdkCacheBucketOutput', { value: cacheBucket.bucketName, exportName: 'cdkCacheBucket' });
      new CfnOutput(this, 'ToolchainBucketKey', { value: bucketKey.keyArn, exportName: 'toolchainBucketKey' });
    } else {
      cacheBucket = Bucket.fromBucketName(this, 'CdkCacheBucket', Fn.importValue('cdkCacheBucket'));
      logBucket = Bucket.fromBucketName(this, 'LogBucketOutput', Fn.importValue('toolchainLogBucket'));
      bucketKey = Key.fromKeyArn(this, 'ArtifactKey', Fn.importValue('toolchainBucketKey'));
    }

    const artifactBucket = new Bucket(this, 'ArtifactsBucket', {
      ...commonBucketProps,
      encryption: BucketEncryption.KMS,
      encryptionKey: bucketKey,
      serverAccessLogsPrefix: 'access-logs',
      serverAccessLogsBucket: logBucket
    });

    // 2. Create Pipeline Input
    const githubInput = pipelines.CodePipelineSource.connection(
      props.repositoryName,
      props.defaultBranchName || 'main',
      {
        triggerOnPush: false,
        connectionArn: CONNECTION
      }
    );

    // 3. Create Synth step, mutation will auto generate
    const synthCodeBuildStep = new pipelines.CodeBuildStep('Synth', {
      input: githubInput,
      installCommands:
        props.installCommands && props.installCommands.length > 0
          ? props.installCommands!
          : [
              'corepack enable',
              'corepack prepare yarn@3.5.1 --activate',
              'yarn set version 3.5.1',
              'yarn install --immutable'
            ],
      commands: props.commands && props.commands.length > 0 ? props.commands : ['yarn run synth'],
      partialBuildSpec: BuildSpec.fromObject({
        cache: {
          paths: ['.yarn/cache/**/*', 'node_modules/**/*']
        }
      }),
      cache: Cache.bucket(cacheBucket)
    });

    // 4. low-level AWS CDK
    const codePipeline = new Pipeline(this, 'CodePipeline', {
      pipelineName: props.pipelineName,
      crossAccountKeys: props.crossAccountKeys,
      enableKeyRotation: props.crossAccountKeys,
      restartExecutionOnUpdate: false,
      artifactBucket
    });

    const codePipelineProps: pipelines.CodePipelineProps = {
      codePipeline,
      ...props,
      crossAccountKeys: undefined,
      synth: synthCodeBuildStep,
      pipelineName: undefined,
      codeBuildDefaults: {
        buildEnvironment: {
          computeType: ComputeType.SMALL,
          buildImage: LinuxArmBuildImage.fromCodeBuildImageId('aws/codebuild/amazonlinux2-aarch64-standard:3.0'),
          privileged: false
        }
      }
    };

    bucketKey.grantEncryptDecrypt(codePipeline.role);
    NagSuppressions.addResourceSuppressions(
      this,
      [
        {
          id: 'AwsSolutions-S1',
          reason: 'Cache bucket should not have s3 bucket logging'
        },
        {
          id: 'AwsSolutions-IAM5',
          reason: 'Mostly generated by pipeline code '
        },
        {
          id: 'AwsSolutions-CB4',
          reason: 'Codebuild is faster without Encryption'
        }
      ],
      true
    );
    // 5. a higher-level pipelines.CodePipeline construct is instantiated using the previously created Pipeline
    this.codePipeline = new pipelines.CodePipeline(this, props.pipelineName || id, codePipelineProps);
    this.cacheBucket = cacheBucket;
  }

  /**
   * @inheritDoc
   */
  addStage(stage: Stage, options?: pipelines.AddStageOpts): pipelines.StageDeployment {
    // Add any root Aspects to the stage level as currently this doesn't happen automatically
    Aspects.of(stage.node.root).all.forEach(aspect => Aspects.of(stage).add(aspect));
    return this.codePipeline.addStage(stage, options);
  }

  /**
   * @inheritDoc
   */
  addWave(waveName: string, options?: pipelines.WaveOptions): pipelines.Wave {
    return this.codePipeline.addWave(waveName, options);
  }

  /**
   * @inheritDoc
   */
  buildPipeline() {
    this.codePipeline.buildPipeline();
  }
  // 'AwsSolutions-IAM5 'Wildcards are needed for dynamically created resources.'
  // 'AwsSolutions-CB4','Encryption of Codebuild is not required.'
}
