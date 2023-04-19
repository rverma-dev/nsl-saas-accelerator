import * as cdk from 'aws-cdk-lib';
import { describe } from '@jest/globals';
import { snapShotTest } from './snapshot-test';
import { DemoApprunnerStack } from '../index';

// Test prefix
const prefixDemoApprunnerStack = 'Stack(DemoApprunnerStack): ';
// const testNamePrefix3 = 'Stack(BlueprintVpc): ';

const stack = new DemoApprunnerStack(new cdk.App(), 'DemoApprunnerStack', {
  tenantID: 'string',
  deploymentId: 'string',
  deploymentType: 'string',
  deploymentTier: 'string',
  synthesizer: new cdk.DefaultStackSynthesizer({
    generateBootstrapVersionRule: false,
  }),
});
/**
 * CodeCommitRepositoryStack construct test
 */
describe('DemoApprunnerStack', () => {
  snapShotTest(prefixDemoApprunnerStack, stack);
});
