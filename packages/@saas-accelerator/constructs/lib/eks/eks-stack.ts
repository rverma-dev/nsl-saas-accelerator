import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as addons from './addon';
import { ClusterConstructProps } from './eks-stack-param';

const BOTTLEROCKET_ON_DEMAND_INSTANCES: ec2.InstanceType[] = [new ec2.InstanceType('t4g.large')];

export default class EksCluster {
  testStack!: cdk.Stack;
  constructor(scope: Construct, props: ClusterConstructProps) {
    const stackName = props.stackName;
    const teams = [
      new blueprints.PlatformTeam({
        name: 'platform',
        userRoleArn: `arn:aws:iam::${process.env['CDK_DEFAULT_ACCOUNT']}:role/${props.platformTeamRole}`,
      }),
    ];

    // AddOns for the cluster.
    const addOns: Array<blueprints.ClusterAddOn> = [
      new blueprints.addons.MetricsServerAddOn(),
      new blueprints.addons.EbsCsiDriverAddOn({
        kmsKeys: [
          blueprints.getResource(
            context =>
              new kms.Key(context.scope, `${stackName}-ebs-csi-driver`, {
                alias: `${stackName}/csi-driver`,
                enableKeyRotation: true,
              }),
          ),
        ],
      }),
      new blueprints.addons.KarpenterAddOn({
        consolidation: { enabled: true },
        subnetTags: {
          ['kubernetes.io/role/internal-elb']: '1',
        },
        securityGroupTags: {
          [`kubernetes.io/cluster/blueprint-${stackName}`]: 'owned',
        },
      }),
      new blueprints.addons.AwsLoadBalancerControllerAddOn(),
      new blueprints.addons.VpcCniAddOn({
        eniConfigLabelDef: 'topology.kubernetes.io/zone',
      }),
      new blueprints.addons.CoreDnsAddOn(),
      new blueprints.addons.KubeProxyAddOn(),
      new blueprints.addons.CertManagerAddOn(),
      new blueprints.addons.SecretsStoreAddOn(),
      new addons.FluxV2Addon({
        credentialsType: 'USERNAME',
        repoBranch: props.gitopsRepoBranch,
        repoUrl: props.gitopsRepoUrl,
        secretName: props.gitopsRepoSecret,
      }),
    ];

    const clusterProvider = new blueprints.GenericClusterProvider({
      version: eks.KubernetesVersion.V1_25,
      managedNodeGroups: [
        {
          id: 'system',
          minSize: 1,
          maxSize: 2,
          instanceTypes: BOTTLEROCKET_ON_DEMAND_INSTANCES,
          nodeGroupCapacityType: eks.CapacityType.ON_DEMAND,
          amiType: eks.NodegroupAmiType.BOTTLEROCKET_ARM_64,
          nodeGroupSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        },
      ],
    });

    const cluster = blueprints.EksBlueprint.builder()
      .addOns(...addOns)
      .resourceProvider(blueprints.GlobalResources.Vpc, new blueprints.VpcProvider(props.vpcID))
      .clusterProvider(clusterProvider)
      .teams(...teams)
      .enableControlPlaneLogTypes(blueprints.ControlPlaneLogType.API)
      .build(scope, stackName);

    NagSuppressions.addStackSuppressions(
      cluster,
      [
        { id: 'AwsSolutions-L1', reason: 'Internal EKS Construct' },
        { id: 'AwsSolutions-IAM4', reason: 'Managed IAM Policies' },
        { id: 'AwsSolutions-IAM5', reason: 'Wildcard policies for AWS Load Balancer Controller' },
        { id: 'AwsSolutions-EKS1', reason: 'Public access for demo purposes' },
        { id: 'AwsSolutions-EKS2', reason: 'Public access for demo purposes' },
        { id: 'AwsSolutions-AS3', reason: 'Notifications disabled' },
        { id: 'AwsSolutions-VPC7', reason: 'Sample code for demo purposes, flow logs disabled' },
        { id: 'AwsSolutions-KMS5', reason: 'Sample code for demo purposes, flow logs disabled' },
      ],
      true,
    );
    this.testStack = cluster;
  }
}
