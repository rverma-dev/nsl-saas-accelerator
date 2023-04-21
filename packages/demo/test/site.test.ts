import { PDKNag } from '@aws-prototyping-sdk/pdk-nag';
import { Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DemoSiteStage } from '../src/main';

describe('Static Website Unit Tests', () => {
  it('Defaults', () => {
    const stack = new Stack(PDKNag.app());
    new DemoSiteStage(stack, 'Defaults', {
      tenantID: 'demo',
      deploymentId: 'dev-01',
      deploymentType: 'silo',
    });

    expect(Template.fromStack(stack)).toMatchSnapshot();
  });
});