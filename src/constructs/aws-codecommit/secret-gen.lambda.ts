import * as console from 'console';
import { IAM } from '@aws-sdk/client-iam';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
// eslint-disable-next-line import/no-extraneous-dependencies
import { CloudFormationCustomResourceEvent } from 'aws-lambda';

export async function handler(event: CloudFormationCustomResourceEvent) {
  //print out the event in case manual intervention is needed
  console.log(event);
  const username = event.ResourceProperties.username;
  const secretName = event.ResourceProperties.secretName;
  const solutionId: string = process.env.SOLUTION_ID ?? '';
  const iam = new IAM({ customUserAgent: solutionId });
  const secretsManager = new SecretsManager({ customUserAgent: solutionId });

  switch (event.RequestType) {
    case 'Create':
    case 'Update':
      try {
        let gitUser, gitCredId;
        let gitPassword = '';
        const listCred = await iam.listServiceSpecificCredentials({
          UserName: username,
          ServiceName: 'codecommit.amazonaws.com'
        });
        if (listCred.ServiceSpecificCredentials && listCred.ServiceSpecificCredentials?.length > 0) {
          const codeCommitCredsMeta = listCred.ServiceSpecificCredentials.pop();
          if (codeCommitCredsMeta) {
            gitUser = codeCommitCredsMeta.ServiceUserName;
            gitCredId = codeCommitCredsMeta.ServiceSpecificCredentialId;
          }
        } else {
          const codeCommitCreds = await iam.createServiceSpecificCredential({
            UserName: username,
            ServiceName: 'codecommit.amazonaws.com'
          });

          gitUser = codeCommitCreds.ServiceSpecificCredential!.ServiceUserName!;
          gitPassword = codeCommitCreds.ServiceSpecificCredential!.ServicePassword!;
          gitCredId = codeCommitCreds.ServiceSpecificCredential!.ServiceSpecificCredentialId!;

          const listSecret = await secretsManager.listSecrets({
            Filters: [{ Key: 'name', Values: [secretName] }]
          });
          // Try to Create the secret in Secrets Manager if secret doesn't exists
          if (listSecret.SecretList && listSecret.SecretList.length === 0) {
            await secretsManager.createSecret({
              Name: secretName,
              SecretString: JSON.stringify({ Username: gitUser, Password: gitPassword, credId: gitCredId })
            });
          } else {
            await secretsManager.putSecretValue({
              SecretId: secretName,
              SecretString: JSON.stringify({ Username: gitUser, Password: gitPassword, credId: gitCredId })
            });
          }
        }
        return {
          PhysicalResourceId: gitCredId,
          Data: {
            Username: gitUser,
            Password: gitPassword
          }
        };
      } catch (e) {
        console.error(e);
        throw e;
      }
    case 'Delete':
      try {
        const secretValue = await secretsManager.getSecretValue({ SecretId: secretName });
        const gitCredId = JSON.parse(secretValue.SecretString!).credId;
        await iam.deleteServiceSpecificCredential({
          UserName: username,
          ServiceSpecificCredentialId: gitCredId
        });
        await secretsManager.deleteSecret({
          SecretId: secretName,
          RecoveryWindowInDays: 7
        });
      } catch (e) {
        console.error(e);
        throw e;
      }
  }

  return {
    PhysicalResourceId: 'Not Defined'
  };
}
