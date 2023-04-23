import { PDKNag } from '@aws-prototyping-sdk/pdk-nag';
import { Template } from 'aws-cdk-lib/assertions';
import { DemoPipeline } from '../src/pipeline-stack';

describe('Static Website Unit Tests', () => {
  it('Defaults', () => {
    const app = PDKNag.app();
    const env = { account: '1111111', region: 'us-west-2' };
    const pipelineStack = new DemoPipeline(app, 'PipelineStack', { tenantID: 'demo', deploymentId: 'dev-001', deploymentType: 'silo', deploymentTier: 'small', ...{ env: env } });
    expect(Template.fromStack(pipelineStack)).toMatchSnapshot();
  });
});