import { Husky, Commitlint } from '@mountainpass/cool-bits-for-projen';
import { awscdk } from 'projen';
import { ArrowParens, NodePackageManager, TrailingComma } from 'projen/lib/javascript';

const AWS_SDK_VERSION = '^3.316.0';
const CDK_VERSION = '2.76.0';

const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: CDK_VERSION,
  cdkVersionPinning: true,
  defaultReleaseBranch: 'main',
  name: 'nsa',
  description: 'Nsl SAAS Accelerator on AWS',
  packageName: '@nsa/installer',
  projenrcTs: true,
  prettier: true,
  prettierOptions: {
    settings: {
      singleQuote: true,
      tabWidth: 2,
      printWidth: 120,
      trailingComma: TrailingComma.NONE,
      arrowParens: ArrowParens.AVOID,
      bracketSameLine: true
    }
  },
  stale: true,
  autoApproveUpgrades: true,
  autoApproveOptions: {
    allowedUsernames: ['rverma-nsl']
  },
  autoMerge: true,
  buildWorkflow: true,
  dependabot: true,
  github: true,
  minNodeVersion: '18.0.0',
  typescriptVersion: '~5.0.4',
  packageManager: NodePackageManager.YARN2,
  eslintOptions: {
    dirs: [],
    prettier: true,
    yaml: true,
    ignorePatterns: ['*.js', '*.d.ts', 'node_modules/', '*.generated.ts', 'coverage', '*.gen-function.ts']
  },
  gitignore: [
    '.idea',
    '.yarn/*',
    '!.yarn/patches',
    '!.yarn/plugins',
    '!.yarn/releases',
    '!.yarn/versions',
    '!.yarn/sdks',
    'build_output',
    'cdk.context.json'
  ],
  deps: [
    '@aws-quickstart/eks-blueprints@^1.7.1',
    `@aws-sdk/client-iam@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-secrets-manager@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-cloudformation@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-codepipeline@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-codebuild@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-dynamodb@${AWS_SDK_VERSION}`,
    `@aws-sdk/client-ec2@${AWS_SDK_VERSION}`,
    `@aws-prototyping-sdk/pdk-nag`,
    `@aws-prototyping-sdk/cdk-graph`,
    '@aws-prototyping-sdk/static-website',
    '@types/js-yaml@^4.0.5',
    'cdk-nag',
    'js-yaml@4.1.0',
    'sync-request@6.1.0',
    'source-map-support',
    'vm2@3.9.17'
  ],
  devDeps: ['@types/aws-lambda', 'aws-lambda', '@mountainpass/cool-bits-for-projen'],
  lambdaAutoDiscover: true,
  lambdaOptions: {
    runtime: awscdk.LambdaRuntime.NODEJS_18_X,
    bundlingOptions: {
      externals: ['aws-sdk'],
      sourcemap: true
    }
  },
  jestOptions: {
    jestConfig: {
      detectOpenHandles: true,
      testPathIgnorePatterns: ['/node_modules/', '/cdk.out/', '/assets/'],
      snapshotSerializers: ['./test/cdk-serializer.js']
    }
  },
  // https://github.com/aws/aws-cdk/blob/main/packages/%40aws-cdk/cx-api/FEATURE_FLAGS.mds
  context: {
    '@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver': true,
    '@aws-cdk/aws-ec2:uniqueImdsv2TemplateName': true,
    '@aws-cdk/aws-ecs:arnFormatIncludesClusterName': true,
    '@aws-cdk/aws-iam:minimizePolicies': true,
    '@aws-cdk/core:validateSnapshotRemovalPolicy': true,
    '@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName': true,
    '@aws-cdk/aws-s3:createDefaultLoggingPolicy': true,
    '@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption': true,
    '@aws-cdk/aws-apigateway:disableCloudWatchRole': true,
    '@aws-cdk/core:enablePartitionLiterals': true,
    '@aws-cdk/core:target-partitions': ['aws', 'aws-cn'],
    '@aws-cdk/aws-events:eventsTargetQueueSameAccount': true,
    '@aws-cdk/aws-iam:standardizedServicePrincipals': true,
    '@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker': true,
    '@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName': true,
    '@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy': true,
    '@aws-cdk/aws-route53-patters:useCertificate': true,
    '@aws-cdk/customresources:installLatestAwsSdkDefault': false,
    '@aws-cdk/aws-rds:databaseProxyUniqueResourceName': true,
    '@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup': true,
    '@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId': true,
    '@aws-cdk/aws-ec2:launchTemplateDefaultUserData': true,
    '@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments': true,
    '@aws-cdk/aws-redshift:columnId': true,
    '@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2': true,
    '@aws-cdk/core:newStyleStackSynthesis': true,
    'acknowledged-issue-numbers': [25356]
  }
});
new Husky(project, {
  huskyHooks: {
    'pre-commit': ['yarn commitlint --edit $1'],
    'pre-push': [
      `# Set the viperlight binary directory
VIPERLIGHT_DIR="../viperlight"

# Check if the viperlight binary exists, and download it if it doesn't
if [ ! -f "$VIPERLIGHT_DIR/bin/viperlight" ]; then
  wget -v 'https://s3.amazonaws.com/viperlight-scanner/latest/viperlight.zip'
  unzip -qo viperlight.zip -d "$VIPERLIGHT_DIR"
  rm -r ./viperlight.zip
fi

# Run the viperlight scan
"$VIPERLIGHT_DIR/bin/viperlight" scan
yarn build
`
    ]
  }
});
new Commitlint(project);
project.synth();
