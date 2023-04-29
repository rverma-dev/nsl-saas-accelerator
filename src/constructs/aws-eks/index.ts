import * as blueprints from '@aws-quickstart/eks-blueprints';
import { Construct } from 'constructs';
import * as addons from './addon';
import { Stack } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as kms from 'aws-cdk-lib/aws-kms';
import { NagSuppressions } from 'cdk-nag';

const BOTTLEROCKET_ON_DEMAND_INSTANCES: ec2.InstanceType[] = [new ec2.InstanceType('t4g.large')];

export interface EKSClusterProps {
  readonly vpcID?: string;
  readonly platformTeamRole: string;
  readonly gitopsRepoBranch?: string;
  readonly gitopsRepoSecret?: string;
  readonly gitopsRepoUrl?: string;
}

export class EksCluster extends Construct {
  constructor(scope: Construct, props: EKSClusterProps) {
    super(scope, `blueprint-${scope.node.id}`);
    const st = Stack.of(this);
    const account = st.account;
    const region = st.region;
    const teams = [
      new blueprints.PlatformTeam({
        name: 'platform',
        userRoleArn: `arn:aws:iam::${account}:role/${props.platformTeamRole}`,
      }),
    ];

    // AddOns for the cluster.
    let addOns: Array<blueprints.ClusterAddOn> = [
      new blueprints.addons.MetricsServerAddOn(),
      new blueprints.addons.EbsCsiDriverAddOn({
        kmsKeys: [
          blueprints.getResource(
            context =>
              new kms.Key(context.scope, `blueprint-${scope.node.id}-ebs-csi-driver`, {
                alias: `blueprint-${scope.node.id}/csi-driver`,
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
          [`kubernetes.io/cluster/blueprint-${scope.node.id}`]: 'owned',
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
    ];

    if (props.gitopsRepoBranch && props.gitopsRepoUrl && props.gitopsRepoSecret) {
      const flux = new addons.FluxV2Addon({
        credentialsType: 'USERNAME',
        repoBranch: props.gitopsRepoBranch,
        repoUrl: props.gitopsRepoUrl,
        secretName: props.gitopsRepoSecret,
      });
      addOns.push(flux);
    }

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
      .account(account)
      .region(region)
      .enableControlPlaneLogTypes(blueprints.ControlPlaneLogType.API)
      .build(this, `blueprint-${scope.node.id}`);

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
  }
}
