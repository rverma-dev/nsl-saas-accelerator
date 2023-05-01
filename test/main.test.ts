import { TOOLCHAIN_ENV } from '../src/installer/lib/configuration';
import { ToolchainStack } from '../src/installer/toolchain-stack';
import { WorkloadPipelineStack } from '../src/installer/workload-pipeline-stack';
import { PDKNag } from '@aws-prototyping-sdk/pdk-nag';
import { Template } from 'aws-cdk-lib/assertions';

test('ToolChain Stack', () => {
  const app = PDKNag.app();
  const stack = new ToolchainStack(app, 'toolchain', { env: TOOLCHAIN_ENV });
  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});

test('Workload DEMO Stack', () => {
  const app = PDKNag.app();
  const stack = new WorkloadPipelineStack(app, 'workload', {
    tenantId: 'demo',
    id: 'dev-001',
    type: 'demo',
    tier: 'small',
    account: TOOLCHAIN_ENV.account,
    region: TOOLCHAIN_ENV.region,
  });
  const template = Template.fromStack(stack.testStack);
  expect(template.toJSON()).toMatchSnapshot();
});

test('Workload POOL Stack', () => {
  const app = PDKNag.app();
  const stack = new WorkloadPipelineStack(app, 'workload', {
    tenantId: 'demo',
    id: 'dev-001',
    type: 'pool',
    tier: 'small',
    account: TOOLCHAIN_ENV.account,
    region: TOOLCHAIN_ENV.region,
  });
  const template = Template.fromStack(stack.testStack);
  expect(template.toJSON()).toMatchSnapshot();
});

test('Workload SILO Stack', () => {
  const app = PDKNag.app();
  const stack = new WorkloadPipelineStack(app, 'workload', {
    tenantId: 'demo',
    id: 'dev-001',
    type: 'silo',
    tier: 'small',
    account: TOOLCHAIN_ENV.account,
    region: TOOLCHAIN_ENV.region,
  });
  const template = Template.fromStack(stack.testStack);
  expect(template.toJSON()).toMatchSnapshot();
});
