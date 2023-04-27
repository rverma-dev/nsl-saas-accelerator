import { getCloudFormationStacks, getRegions, scanDynamoDB } from './lib/apitools';
import { saveConfig, isValidDeploymentRecord } from './lib/configtools';
import { DeploymentRecord, Deployment, getPipelineName } from '@nsa/common';

/*
 * This utility reads a point-in-time snapshot of the deployment database,
 * validates all records, and checks the provisioning status of each
 * deployment. The resulting file is stored in build_output directory,
 * so that it can be read by the update-deployments utility.
 *
 * Both the records read from deployment database, and the validated
 * output of the utility are logged, so that a clear record exists
 * of the input and output of the utility.
 */

processDeployments().catch(error => {
  console.error(error);
  process.exit(1);
});

async function processDeployments(): Promise<void> {
  const stacks = await getCloudFormationStacks();
  const regions = await getRegions();
  const records = await scanDynamoDB();
  verifyAndSaveData(records, regions, stacks);
}

function verifyAndSaveData(records: Array<DeploymentRecord>, regions: Array<string>, stacks: Array<string>): void {
  console.log('Records from deployment database:');
  console.log(records);

  const deployments: Array<Deployment> = [];

  records.forEach(record => {
    // Verify records are properly formatted
    try {
      if (isValidDeploymentRecord(record, regions)) {
        console.log(record);
        const deployment = record as Deployment;
        deployment.provisioned = stacks.includes(getPipelineName(record));
        deployments.push(deployment);
      }
    } catch (error) {
      console.error(`Deployment record ${record.tenantId} failed validation: ${error}. Ignoring record.`);
    }
  });

  console.log('Validated records:');
  console.log(deployments);

  saveConfig(deployments, 'deployments.json');
}
