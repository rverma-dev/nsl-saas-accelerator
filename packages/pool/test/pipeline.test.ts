import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { PipelineStack } from '../src/pipeline-stack';

test('Snapshot', () => {
  const app = new App();
  const stack = new PipelineStack(app, 'test', {
    id: 'dev-001',
    tenantId: 'CH',
    tier: 'small',
    type: 'pool',
    env: { account: '1234567890', region: 'us-east-1' },
  });

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
