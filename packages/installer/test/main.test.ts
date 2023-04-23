import { PDKNag } from '@aws-prototyping-sdk/pdk-nag';
import { Template } from 'aws-cdk-lib/assertions';
import { TOOLCHAIN_ENV } from '../src/lib/configuration';
import { ToolchainStack } from '../src/lib/toolchain-stack';
import { WorkloadPipelineStack } from '../src/lib/workload-pipeline-stack';

test('ToolChain Stack', () => {
  const app = PDKNag.app();
  const stack = new ToolchainStack(app, 'toolchain', { env: TOOLCHAIN_ENV });
  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});

test('Workload Stack', () => {
  const app = PDKNag.app();
  const stack = new WorkloadPipelineStack(app, 'workload', {
    tenantId: 'demo',
    id: 'dev-001',
    type: 'silo',
    tier: 'small',
    account: TOOLCHAIN_ENV.account,
    region: TOOLCHAIN_ENV.region,
  });
  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});