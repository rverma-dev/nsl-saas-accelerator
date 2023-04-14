import * as AWS from 'aws-sdk';
import * as console from 'console';
AWS.config.logger = console;

export async function handler(event: AWSLambda.CloudFormationCustomResourceEvent) {
  //print out the event in case manual intervention is needed
  console.log(event);
  const username = event.ResourceProperties['username'];
  const secretName = event.ResourceProperties['secretName'];
  const solutionId: string = process.env['SOLUTION_ID'] ?? '';

  const iam = new AWS.IAM({ customUserAgent: solutionId });
  const secretsManager = new AWS.SecretsManager({ customUserAgent: solutionId });

  switch (event.RequestType) {
    case 'Create':
    case 'Update':
      try {
        let gitUser, gitCredId;
        let gitPassword = '';
        const listCred = await iam
          .listServiceSpecificCredentials({
            UserName: username,
            ServiceName: 'codecommit.amazonaws.com',
          })
          .promise();
        if (listCred.ServiceSpecificCredentials && listCred.ServiceSpecificCredentials?.length > 0) {
          const codeCommitCredsMeta = listCred.ServiceSpecificCredentials.pop();
          if (codeCommitCredsMeta) {
            gitUser = codeCommitCredsMeta.ServiceUserName;
            gitCredId = codeCommitCredsMeta.ServiceSpecificCredentialId;
          }
        } else {
          const codeCommitCreds = await iam
            .createServiceSpecificCredential({
              UserName: username,
              ServiceName: 'codecommit.amazonaws.com',
            })
            .promise();

          gitUser = codeCommitCreds.ServiceSpecificCredential!.ServiceUserName!;
          gitPassword = codeCommitCreds.ServiceSpecificCredential!.ServicePassword!;
          gitCredId = codeCommitCreds.ServiceSpecificCredential!.ServiceSpecificCredentialId!;

          const listSecret = await secretsManager
            .listSecrets({
              Filters: [{ Key: 'name', Values: [secretName] }],
            })
            .promise();
          // Try to Create the secret in Secrets Manager if secret doesn't exists
          if (listSecret.SecretList && listSecret.SecretList.length === 0) {
            await secretsManager
              .createSecret({
                Name: secretName,
                SecretString: JSON.stringify({ Username: gitUser, Password: gitPassword, credId: gitCredId }),
              })
              .promise();
          } else {
            await secretsManager
              .putSecretValue({
                SecretId: secretName,
                SecretString: JSON.stringify({ Username: gitUser, Password: gitPassword, credId: gitCredId }),
              })
              .promise();
          }
        }
        return {
          PhysicalResourceId: gitCredId,
          Data: {
            Username: gitUser,
            Password: gitPassword,
          },
        };
      } catch (e) {
        console.error(e);
        throw e;
      }
    case 'Delete':
      try {
        const secretValue = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
        const gitCredId = JSON.parse(secretValue.SecretString!)['credId'];
        await iam
          .deleteServiceSpecificCredential({
            UserName: username,
            ServiceSpecificCredentialId: gitCredId,
          })
          .promise();
        await secretsManager.deleteSecret({
          SecretId: secretName,
          RecoveryWindowInDays: 7,
        });
      } catch (e) {
        console.error(e);
        throw e;
      }
  }

  return {
    PhysicalResourceId: 'Not Defined',
  };
}
