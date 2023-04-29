import { CsiSecretProps, LookupSecretsManagerSecretByName } from '@aws-quickstart/eks-blueprints';

/**
 * Creates CsiSecretProps that contains secret template for ssh/username/pwd credentials.
 * In each case, the secret is expected to be a JSON structure containing url and either sshPrivateKey
 * or username and password attributes.
 * @param credentialsType SSH | USERNAME | TOKEN
 * @param secretName
 * @param k8secret
 * @returns
 */
export function createSecretRef(credentialsType: string, secretName: string, k8secret?: string): CsiSecretProps {
  if (!k8secret) {
    k8secret = secretName.replace(/\//g, '-');
  }
  switch (credentialsType) {
    case 'SSH':
      return createSshSecretRef(secretName, k8secret);
    case 'USERNAME':
    case 'TOKEN':
      return createUserNameSecretRef(secretName, k8secret);
    default:
      throw new Error(`credentials type ${credentialsType} is not supported by Flux add-on.`);
  }
}

/**
 * Local function to create a secret reference for SSH key.
 * @param secretName
 * @param k8secret
 * @returns
 */
export function createSshSecretRef(secretName: string, k8secret: string): CsiSecretProps {
  return {
    secretProvider: new LookupSecretsManagerSecretByName(secretName),
    jmesPath: [{ path: 'sshPrivateKey', objectAlias: 'sshPrivateKey' }],
    kubernetesSecret: {
      secretName: k8secret,
      data: [{ key: 'sshPrivateKey', objectName: 'sshPrivateKey' }],
    },
  };
}

/**
 * Local function to a secret reference for username/pwd or username/token key.
 * @param secretName
 * @param k8secret
 * @returns
 */
export function createUserNameSecretRef(secretName: string, k8secret: string): CsiSecretProps {
  return {
    secretProvider: new LookupSecretsManagerSecretByName(secretName),
    jmesPath: [
      { path: 'username', objectAlias: 'username' },
      { path: 'password', objectAlias: 'password' },
    ],
    kubernetesSecret: {
      secretName: k8secret,
      data: [
        { key: 'username', objectName: 'username' },
        { key: 'password', objectName: 'password' },
      ],
    },
  };
}
