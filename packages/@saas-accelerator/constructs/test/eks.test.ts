import * as cdk from 'aws-cdk-lib';
import * as blueprints from '@aws-quickstart/eks-blueprints';

// Test FluxAddon
import { describe } from '@jest/globals';
import { snapShotTest } from './snapshot-test';
import { FluxV2Addon } from '../lib/eks/addon';

const flux = new FluxV2Addon({
  credentialsType: 'USERNAME',
  repoBranch: 'repoBranch',
  repoUrl: 'CodeCommitRepoUrlExport',
  secretName: 'AAA/CodeCommitSecretNameExport',
});
describe('FluxAddon', () => {
  const app = new cdk.App();
  const stack = blueprints.EksBlueprint.builder()
    .account('123456789012')
    .region('us-east-1')
    .addOns(new blueprints.addons.SecretsStoreAddOn(), flux)
    .build(app, 'east-test-1');
  snapShotTest('FluxEksClusterStack', stack);
});
