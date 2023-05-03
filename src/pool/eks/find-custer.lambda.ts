import * as console from 'console';
// eslint-disable-next-line import/no-extraneous-dependencies
import { CloudFormationCustomResourceEvent } from 'aws-lambda';

export async function handler(event: CloudFormationCustomResourceEvent) {
  //print out the event in case manual intervention is needed
  console.log(event);
  const seedStack = event.ResourceProperties.Seed;

  switch (event.RequestType) {
    case 'Create':
    case 'Update':
      try {
        return {
          PhysicalResourceId: seedStack,
          Data: {
            Username: '22'
          }
        };
      } catch (e) {
        console.error(e);
        throw e;
      }
    case 'Delete':
      try {
      } catch (e) {
        console.error(e);
        throw e;
      }
  }

  return {
    PhysicalResourceId: 'Not Defined'
  };
}
