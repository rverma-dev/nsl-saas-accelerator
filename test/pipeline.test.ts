import { PDKNag } from '@aws-prototyping-sdk/pdk-nag';
import { Template } from 'aws-cdk-lib/assertions';
import { PipelineStack } from '../src/pipeline-stack';

describe('Demo Profile Unit Tests', () => {
  it('Defaults', () => {
    const app = PDKNag.app();
    const stack = new PipelineStack(app, 'PipelineStack', {
      id: 'dev-001',
      tenantId: 'CH',
      tier: 'small',
      type: 'pool',
      account: '1111111',
      region: 'us-west-2',
    });
    expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
  });
});
