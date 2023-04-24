import { PDKNag } from 'aws-prototyping-sdk/pdk-nag';
import { DemoPipeline } from './pipeline-stack';

const app = PDKNag.app();
const tenantProps = {
  tenantId: 'demo',
  id: 'dev-001',
  type: 'silo',
  tier: 'small',
  account: process.env.CDK_DEFAULT_ACCOUNT!,
  region: process.env.CDK_DEFAULT_REGION!,
};

new DemoPipeline(app, 'PipelineStack', tenantProps);
app.synth();
