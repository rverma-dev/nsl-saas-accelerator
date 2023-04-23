import { CodeBuild } from '@aws-sdk/client-codebuild';
// eslint-disable-next-line import/no-extraneous-dependencies
import { DynamoDBRecord, DynamoDBStreamHandler } from 'aws-lambda';

const codebuild = new CodeBuild({ apiVersion: 'latest' });

const projectName = process.env.PROJECT_NAME;

interface DeploymentDynamoRecord {
  id: string;
  tenantID: string;
  type: string;
  tier: string;
  region: string;
  account: string;
}

async function startBuildCommand(record: DeploymentDynamoRecord): Promise<void> {
  const env = [
    { name: 'DEPLOYMENT_ID', value: record.id },
    { name: 'DEPLOYMENT_TENANT_ID', value: record.tenantID },
    { name: 'DEPLOYMENT_TYPE', value: record.type },
    { name: 'DEPLOYMENT_TIER', value: record.tier },
    { name: 'COMPONENT_ACCOUNT', value: record.account },
    { name: 'COMPONENT_REGION', value: record.region },
  ];

  console.log(`Calling startBuild() on CodeBuild project ${projectName}, env ${env}`);

  try {
    const result = await codebuild.startBuild({
      projectName: projectName!,
      environmentVariablesOverride: env,
    });
    console.log('Build started successfully:', result);
  } catch (error) {
    console.error('Error starting the build:', error);
  }
}

const processInsertRecord = async (record: DynamoDBRecord): Promise<void> => {
  if (record.dynamodb?.NewImage) {
    console.log('New item added to deployment database');
    const input = record.dynamodb?.NewImage;
    const newRecord = {
      id: input.id.S!,
      tenantID: input.tenantID.S!,
      type: input.type.S!,
      tier: input.tier.S!,
      account: input.account.S!,
      region: input.region.S!,
    };
    console.log('Processing record:', newRecord);
    await startBuildCommand(newRecord);
  }
};

export const handler: DynamoDBStreamHandler = async event => {
  const insertRecords = event.Records.filter(record => record.eventName === 'INSERT');
  await Promise.all(insertRecords.map(processInsertRecord));

  // This sample code does not process MODIFY or REMOVE records
  // Implementation of business logic related to these events is
  // left for the reader.
};
