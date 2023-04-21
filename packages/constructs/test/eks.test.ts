import { EksBlueprint, SecretsStoreAddOn } from '@aws-quickstart/eks-blueprints';
import * as cdk from 'aws-cdk-lib';
import { FluxV2Addon } from '../src/aws-eks/addon';

const flux = new FluxV2Addon({
  credentialsType: 'USERNAME',
  repoBranch: 'repoBranch',
  repoUrl: 'CodeCommitRepoUrlExport',
  secretName: 'AAA/CodeCommitSecretNameExport',
});
describe('FluxAddon', () => {
  const app = new cdk.App();
  const stack = EksBlueprint.builder()
    .account('123456789012')
    .region('us-east-1')
    .addOns(new SecretsStoreAddOn(), flux)
    .build(app, 'east-test-1');
  test('FluxEksClusterStack Snapshot Test', () => {
    expect(stack).toBeDefined();
  });
  // snapShotTest('FluxEksClusterStack', stack.);
});
