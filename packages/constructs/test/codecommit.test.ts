import * as cdk from 'aws-cdk-lib';
import { snapShotTest } from './snapshot-test';
import { CreateGitopsSecretResource } from '../src';

const testNamePrefix = 'Construct(GitopsStack): ';

//Initialize stack for snapshot test and resource configuration test
const stack = new cdk.Stack();
describe('GitopsSecret', () => {
  new CreateGitopsSecretResource(stack, 'codeCommitSecret', {
    username: 'demo',
    secretName: 'demo',
  });
  snapShotTest(testNamePrefix, stack);
});
