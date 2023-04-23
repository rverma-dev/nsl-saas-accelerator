import { PDKNag } from 'aws-prototyping-sdk/pdk-nag';
import { DemoPipeline } from './pipeline-stack';

const app = PDKNag.app();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT!, // Replace with Dev account
  region: process.env.CDK_DEFAULT_REGION!, // Replace with Dev region
};
const tenantProps = {
  tenantID: 'demo',
  deploymentId: 'dev-001',
  deploymentType: 'silo',
  deploymentTier: 'small',
  env: env,
};

const pipelineStack = new DemoPipeline(app, 'PipelineStack', tenantProps);
pipelineStack.pipeline.buildPipeline(); // Needed for CDK Nag
app.synth();
