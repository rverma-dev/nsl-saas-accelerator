import { PDKNag } from '@aws-prototyping-sdk/pdk-nag';
import { PipelineStack } from './pipeline-stack';

const app = PDKNag.app();
new PipelineStack(app, 'PipelineStack', {
  id: 'dev-001',
  tenantId: 'CH',
  tier: 'small',
  type: 'pool',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT!,
    region: process.env.CDK_DEFAULT_REGION!,
  },
});
app.synth();
