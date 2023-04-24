import { PDKNag } from '@aws-prototyping-sdk/pdk-nag';
import { Template } from 'aws-cdk-lib/assertions';
import { DemoPipeline } from '../src/pipeline-stack';

describe('Static Website Unit Tests', () => {
  it('Defaults', () => {
    const app = PDKNag.app();
    const pipelineStack = new DemoPipeline(app, 'PipelineStack', {
      tenantId: 'demo',
      id: 'dev-001',
      type: 'silo',
      tier: 'small',
      account: '1111111',
      region: 'us-west-2',
    });
    expect(Template.fromStack(pipelineStack)).toMatchSnapshot();
  });
});
