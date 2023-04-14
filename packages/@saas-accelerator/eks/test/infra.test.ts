import * as cdk from 'aws-cdk-lib';
import { describe } from '@jest/globals';
import { snapShotTest } from './snapshot-test';
import { CodeCommitRepositoryStack } from '../lib/repository-stack';
import EksCluster from '@saas-accelerator/constructs/lib/eks/eks-stack';

// Test prefix
const testNamePrefix = 'Stack(CodeCommitRepositoryStack): ';
const testNamePrefix2 = 'Stack(Blueprint): ';
// const testNamePrefix3 = 'Stack(BlueprintVpc): ';

const stack = new CodeCommitRepositoryStack(new cdk.App(), 'CodeCommitRepositoryStack', {
  synthesizer: new cdk.DefaultStackSynthesizer({
    generateBootstrapVersionRule: false,
  }),
});
/**
 * CodeCommitRepositoryStack construct test
 */
describe('CodeCommitRepositoryStack', () => {
  snapShotTest(testNamePrefix, stack);
});

/**
 * blueprintStack construct test
 */
describe(testNamePrefix2, () => {
  snapShotTest(
    testNamePrefix2,
    new EksCluster(new cdk.App(), {
      env: {
        account: '123456789012',
        region: 's-east-1,',
      },
      platformTeamRole: 'AWSAdministratorAccess',
      repoBranch: 'main',
      stackName: 'demo',
    }).testStack,
  );
});
