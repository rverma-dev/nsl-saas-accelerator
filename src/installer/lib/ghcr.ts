import { GITHUB_DOMAIN } from './configuration';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class GitHubEcrPushAction extends Construct {
  constructor(scope: Construct, id: string, props: { owner: string; repo: string }) {
    super(scope, id);

    const ghProvider = new iam.OpenIdConnectProvider(this, 'github-oidc-provider', {
      url: `https://${GITHUB_DOMAIN}`,
      clientIds: ['sts.amazonaws.com']
    });

    const conditions: iam.Conditions = {
      StringLike: {
        [`${GITHUB_DOMAIN}:sub`]: `repo:${props.owner}/${props.repo}:*`
      }
    };
    new iam.WebIdentityPrincipal(ghProvider.openIdConnectProviderArn, conditions);

    new iam.Role(this, 'gitHub-ecrpush-role', {
      assumedBy: new iam.WebIdentityPrincipal(ghProvider.openIdConnectProviderArn, conditions),
      roleName: 'gitHubSaasDeployRole',
      inlinePolicies: {
        'ecr-push': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
                'ecr:PutImage',
                'ecr:GetAuthorizationToken'
              ],
              resources: [
                `arn:aws:ecr:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:repository/${props.owner}/${props.repo}/*`
              ]
            })
          ]
        })
      }
    });
  }
}
