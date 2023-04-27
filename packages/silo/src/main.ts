import { PDKNag } from '@aws-prototyping-sdk/pdk-nag';
import { PipelineStack } from './pipeline-stack';

const app = PDKNag.app();
const tenantProps = {
  tenantId: 'CH',
  id: 'dev-001',
  type: 'pool',
  tier: 'small',
  account: process.env.CDK_DEFAULT_ACCOUNT!,
  region: process.env.CDK_DEFAULT_REGION!,
};

new PipelineStack(app, 'PipelineStack', tenantProps);
app.synth();
