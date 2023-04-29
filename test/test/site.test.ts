import { PDKNag } from '@aws-prototyping-sdk/pdk-nag';
import { Template } from 'aws-cdk-lib/assertions';
import { PipelineStack } from '../src/pipeline-stack';

describe('Static Website Unit Tests', () => {
  it('Defaults', () => {
    const app = PDKNag.app();
    const stack = new PipelineStack(app, 'PipelineStack', {
      id: 'dev-001',
      tenantId: 'demo',
      tier: 'small',
      type: 'silo',
      account: '1111111',
      region: 'ap-south-1',
    });
    expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
  });
});
