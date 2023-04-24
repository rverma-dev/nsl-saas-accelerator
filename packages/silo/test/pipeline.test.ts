import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Silo } from '../src/pipeline';

test('Snapshot', () => {
  const app = new App();
  app.node.setContext('PLATFORM_TEAM_ROLE', 'Admin');
  app.node.setContext('VPC_ID', 'vpc-12345678');
  const stack = new Silo(app, 'test', {
    env: {
      account: '123456789',
      region: 'us-east-1',
    },
  });

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});