import { startPipelineExecution, waitPipelineExecution } from './lib/apitools';
import { readConfig } from './lib/configtools';
import { Deployment, getPipelineName } from '../common';

/*
 * update-deployments implements the control flow and logic of how updates are
 * rolled out to deployments. The default implementation uses a sequential
 * one-at-a-time strategy, with a configurable error bucket size.
 *
 * As each deployments' pipeline is implemented using CDK Pipelines, they can each
 * self-mutate. This means that we simply need to trigger the pipelines to execute,
 * and they will each update themselves. The utility waits for the pipeline
 * execution to finish, before continuing with the new pipeline.
 */

const allDeployments = readConfig('deployments.json') as Array<Deployment>;

const error_budget = 1;
let errors = 0;

console.log('Triggering each configured deployment to self-update.');
processDeployments(allDeployments).then(
  () => {
    console.log(`Finished with ${errors} error(s).`);
  },
  (error: Error) => {
    console.error(error);
    process.exit(1);
  }
);

function incrementErrors() {
  if (++errors >= error_budget) {
    console.error(`Error budget ${error_budget} exhausted, aborting.`);
    process.exit(1);
  }
}

async function processDeployments(deployments: Array<Deployment>) {
  for (const deployment of deployments) {
    if (!deployment.provisioned) {
      console.log('Ignoring unprovisioned deployment ' + deployment.tenantId);
      continue;
    }

    const pipelineName = getPipelineName(deployment);
    console.log(`Starting execution of ${deployment.account}/${deployment.region} deployment pipeline ${pipelineName}`);

    let startResult;
    try {
      startResult = await startPipelineExecution(pipelineName);
    } catch (error) {
      console.error(error);
      incrementErrors();
      continue;
    }

    if (!startResult.pipelineExecutionId) {
      console.error('No executionId in startPipelineExecution response.');
      incrementErrors();
      continue;
    }

    console.log(`Pipeline execution started with executionId ${startResult.pipelineExecutionId}`);

    let waitResult;
    try {
      waitResult = await waitPipelineExecution(pipelineName, startResult.pipelineExecutionId);
    } catch (error) {
      console.error(error);
      incrementErrors();
      continue;
    }
    if (!waitResult) {
      incrementErrors();
    }
  }
}
