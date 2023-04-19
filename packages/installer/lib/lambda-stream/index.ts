import { CodeBuild, DynamoDB } from 'aws-sdk';
import { DynamoDBRecord, DynamoDBStreamHandler } from 'aws-lambda';

// Configure AWS SDK
const AWS = require('aws-sdk');
AWS.config.update({ region: process.env['AWS_REGION'] });

const codebuild = new CodeBuild({ apiVersion: 'latest' });

const projectName = process.env['PROJECT_NAME'];

interface DeploymentDynamoRecord {
  id: DynamoDB.AttributeValue;
  tenantID?: DynamoDB.AttributeValue;
  type?: DynamoDB.AttributeValue;
  region?: DynamoDB.AttributeValue;
  account?: DynamoDB.AttributeValue;
}

async function startBuildCommand(record: DeploymentDynamoRecord): Promise<void> {
  const env = [
    { name: 'DEPLOYMENT_ID', value: record.id.S },
    { name: 'DEPLOYMENT_TENANT_ID', value: record.tenantID?.S },
    { name: 'DEPLOYMENT_TYPE', value: record.type?.S },
    { name: 'COMPONENT_ACCOUNT', value: record.account?.S },
    { name: 'COMPONENT_REGION', value: record.region?.S },
  ].reduce<CodeBuild.EnvironmentVariable[]>((acc, variable) => {
    if (variable.value !== undefined) {
      acc.push({ name: variable.name, value: variable.value });
    }
    return acc;
  }, []);

  console.log(`Calling startBuild() on CodeBuild project ${projectName}`);

  try {
    const result = await codebuild
      .startBuild({
        projectName: projectName!,
        environmentVariablesOverride: env,
      })
      .promise();
    console.log('Build started successfully:', result);
  } catch (error) {
    console.error('Error starting the build:', error);
  }
}

function convertToRecord(record: { [key: string]: DynamoDB.AttributeValue }) {
  return {
    id: record['id'],
    tenantID: record['tenantID'],
    type: record['type'],
    account: record['account'],
    region: record['region'],
  };
}

const processInsertRecord = async (record: DynamoDBRecord): Promise<void> => {
  if (record.dynamodb?.NewImage) {
    console.log('New item added to deployment database');
    const newRecord = convertToRecord(record.dynamodb.NewImage);
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

  // TODO
};
