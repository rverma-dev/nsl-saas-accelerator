import { EksCluster } from '../src/constructs';
import { FluxV2Addon } from '../src/constructs/aws-eks/addon';
import { EksBlueprint, SecretsStoreAddOn } from '@aws-quickstart/eks-blueprints';
import * as cdk from 'aws-cdk-lib';

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
});

describe('EksContruct: No VPC', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'MyStack', { env: { account: '123456789012', region: 'us-east-1' } });
  new EksCluster(stack, { platformTeamRole: 'Admin' });
  test('EksContruct No VPC Snapshot Test', () => {
    expect(stack).toBeDefined();
  });
});

describe('EksContruct: Existing VPC', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'MyStack', { env: { account: '123456789012', region: 'us-east-1' } });
  new EksCluster(stack, { vpcID: 'vpc-12345678', platformTeamRole: 'Admin' });
  test('EksContruct Existing VPC Snapshot Test', () => {
    expect(stack).toBeDefined();
  });
});
