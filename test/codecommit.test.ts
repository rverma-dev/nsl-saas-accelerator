import { CreateGitopsSecretResource } from '../src/constructs';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

//Initialize stack for snapshot test and resource configuration test
const stack = new cdk.Stack();
describe('GitopsSecret', () => {
  test('Snapshot test', () => {
    new CreateGitopsSecretResource(stack, 'codeCommitSecret', {
      username: 'XXXX',
      secretName: 'demo',
    });
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  });
});
