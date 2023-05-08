import { FluxV2Addon } from './addon';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { CapacityType, KubernetesVersion, NodegroupAmiType } from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';

const BOTTLEROCKET_ON_DEMAND_INSTANCES: ec2.InstanceType[] = [new ec2.InstanceType('t4g.xlarge')];

export interface EKSClusterProps {
  readonly vpcID?: string;
  readonly platformTeamRole: string;
  readonly gitopsRepoBranch?: string;
  readonly gitopsRepoSecret?: string;
  readonly gitopsRepoUrl?: string;
  readonly account: string;
  readonly region: string;
}

export class EksCluster {
  constructor(scope: Construct, props: EKSClusterProps) {
    const teams = [
      new blueprints.PlatformTeam({
        name: 'platform',
        userRoleArn: `arn:aws:iam::${props.account}:role/${props.platformTeamRole}`
      })
    ];

    blueprints.HelmAddOn.validateHelmVersions = true;
    blueprints.HelmAddOn.failOnVersionValidation = false;

    const nodeRole = new blueprints.CreateRoleProvider(
      'blueprint-node-role',
      new iam.ServicePrincipal('ec2.amazonaws.com'),
      [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
      ]
    );

    // AddOns for the cluster.
    let addOns: Array<blueprints.ClusterAddOn> = [
      new blueprints.addons.MetricsServerAddOn(),
      new blueprints.addons.EbsCsiDriverAddOn({
        kmsKeys: [
          blueprints.getResource(
            context =>
              new kms.Key(context.scope, `blueprint-${scope.node.id}-ebs-csi-driver`, {
                alias: `blueprint-${scope.node.id}/csi-driver`,
                enableKeyRotation: true
              })
          )
        ]
      }),
      new blueprints.addons.KarpenterAddOn({
        consolidation: { enabled: true },
        subnetTags: {
          ['kubernetes.io/role/internal-elb']: '1'
        },
        securityGroupTags: {
          [`kubernetes.io/cluster/blueprint-${scope.node.id}`]: 'owned'
        }
      }),
      new blueprints.addons.AwsLoadBalancerControllerAddOn(),
      new blueprints.addons.VpcCniAddOn({
        eniConfigLabelDef: 'topology.kubernetes.io/zone',
        serviceAccountPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy')]
      }),
      new blueprints.addons.CoreDnsAddOn(),
      new blueprints.addons.KubeProxyAddOn(),
      new blueprints.addons.CertManagerAddOn(),
      new blueprints.addons.SecretsStoreAddOn(),
      new blueprints.addons.KedaAddOn({
        podSecurityContextFsGroup: 1001,
        securityContextRunAsGroup: 1001,
        securityContextRunAsUser: 1001,
        irsaRoles: ['CloudWatchFullAccess', 'AmazonSQSFullAccess']
      })
    ];

    if (props.gitopsRepoBranch && props.gitopsRepoUrl && props.gitopsRepoSecret) {
      const flux = new FluxV2Addon({
        credentialsType: 'USERNAME',
        repoBranch: props.gitopsRepoBranch,
        repoUrl: props.gitopsRepoUrl,
        secretName: props.gitopsRepoSecret
      });
      addOns.push(flux);
    }

    const clusterProvider = new blueprints.GenericClusterProvider({
      version: KubernetesVersion.V1_26,
      managedNodeGroups: [
        {
          id: 'system',
          minSize: 1,
          maxSize: 2,
          instanceTypes: BOTTLEROCKET_ON_DEMAND_INSTANCES,
          nodeGroupCapacityType: CapacityType.ON_DEMAND,
          amiType: NodegroupAmiType.BOTTLEROCKET_ARM_64,
          nodeRole: blueprints.getNamedResource('node-role') as iam.Role,
          nodeGroupSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }
        }
      ]
    });

    const cluster = blueprints.EksBlueprint.builder()
      .addOns(...addOns)
      .resourceProvider(
        blueprints.GlobalResources.Vpc,
        props.vpcID
          ? new blueprints.VpcProvider(props.vpcID)
          : new blueprints.VpcProvider(undefined, '100.64.0.0/16', ['100.64.0.0/24', '100.64.1.0/24', '100.64.2.0/24'])
      )
      .resourceProvider('node-role', nodeRole)
      .clusterProvider(clusterProvider)
      .teams(...teams)
      .account(props.account)
      .region(props.region)
      .enableControlPlaneLogTypes(blueprints.ControlPlaneLogType.API)
      .build(scope, `blueprint-${scope.node.id}`);

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
        { id: 'AwsSolutions-KMS5', reason: 'Sample code for demo purposes, flow logs disabled' }
      ],
      true
    );
  }
}
