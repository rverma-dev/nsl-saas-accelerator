import { PDKNag } from 'aws-prototyping-sdk/pdk-nag';
import { ApplicationStage } from './application-stage';
import { DemoPipeline } from './pipeline-stack';

const app = PDKNag.app();

const pipelineStack = new DemoPipeline(app, 'PipelineStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT!,
    region: process.env.CDK_DEFAULT_REGION!,
  },
});

const devStage = new ApplicationStage(app, 'Dev', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT!, // Replace with Dev account
    region: process.env.CDK_DEFAULT_REGION!, // Replace with Dev region
  },
});

pipelineStack.pipeline.addStage(devStage);
// Add additional stages here i.e. Prod

pipelineStack.pipeline.buildPipeline(); // Needed for CDK Nag
app.synth();
