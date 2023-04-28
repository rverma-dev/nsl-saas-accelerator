import { ClusterAddOn, ClusterInfo, SecretProviderClass, utils } from '@aws-quickstart/eks-blueprints';
import { aws_eks as eks } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as yaml from 'js-yaml';
import * as request from 'sync-request';
import { createSecretRef } from './manifest-utils';

export class FluxV2Props {
  readonly fluxVersion?: string;
  readonly secretName!: string;
  readonly repoUrl!: string;
  readonly repoBranch?: string;
  readonly repoPath?: string;
  readonly credentialsType!: string;
  readonly k8secret?: string;
}

const defaultProps = {
  k8secret: 'flux-system',
  repoBranch: 'main',
  repoPath: '/',
};

export class FluxRelease {
  readonly fluxVersion: string;
  readonly manifestUrl: string;

  constructor(version?: string) {
    if (!version) {
      this.fluxVersion = this.getLatestReleaseVersion();
    } else {
      this.fluxVersion = version;
    }
    this.manifestUrl = `https://github.com/fluxcd/flux2/releases/download/${this.fluxVersion}/install.yaml`;
  }

  private getLatestReleaseVersion(): string {
    const metadataUrl = 'https://api.github.com/repos/fluxcd/flux2/releases/latest';
    const releaseMetadata = JSON.parse(
      request
        .default('GET', metadataUrl, {
          headers: {
            'User-Agent': 'CDK', // GH API requires us to set UA
          },
        })
        .getBody()
        .toString(),
    );

    return releaseMetadata.tag_name;
  }

  public getUrl(): string {
    return this.manifestUrl;
  }

  public getManifests(): Record<string, unknown>[] {
    const installManifest: Record<string, unknown>[] = [];
    yaml.loadAll(request.default('GET', this.getUrl()).getBody().toString(), doc => {
      const x = doc as Record<string, unknown>;
      installManifest.push(x);
    });
    return installManifest;
  }
}

export class FluxV2Addon implements ClusterAddOn {
  readonly fluxV2Props: FluxV2Props;

  constructor(props: FluxV2Props) {
    this.fluxV2Props = { ...defaultProps, ...props };
  }
  deploy(clusterInfo: ClusterInfo): void {
    const cluster = clusterInfo.cluster;
    const csiSecret = createSecretRef(
      this.fluxV2Props.credentialsType!,
      this.fluxV2Props.secretName,
      this.fluxV2Props.k8secret,
    );
    const sa = this.createIRSA(cluster);
    const secretProviderClassVM = new SecretProviderClass(clusterInfo, sa, 'flux-system', csiSecret).getVolumeMounts(
      'flux-system',
    );

    const secretSync = cluster.addManifest('FluxSyncSecret', {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: {
        name: 'flux-gitrepository-sync',
        namespace: 'flux-system',
      },
      spec: {
        serviceAccountName: 'flux-system-git-sa',
        containers: [
          {
            name: 'busybox',
            image: 'registry.k8s.io/e2e-test-images/busybox:1.29',
            command: ['/bin/sleep', '10000'],
            volumeMounts: secretProviderClassVM.volumeMounts,
          },
        ],
        volumes: secretProviderClassVM.volumes,
      },
    });

    /**
     * Actually installs Flux components onto the cluster. While perhaps not the prettiest implementation,
     * it should do the trick. We are breaking down the full install manifest into individual resources
     * so that they get applied individually, this way we avoid sending a too large payload to lambda.
     *
     * We're also setting up ordered resource dependencies given the structure of the install.yaml, ensuring
     * our namespace is in place before we try applying other resources. With additional work the actual
     * dependencies could be identified and set up in detail to parallelize the effort of applying
     * the rest of the resources in the full manifest.
     */
    const fluxRelease = new FluxRelease(this.fluxV2Props?.fluxVersion);
    const fluxResourceManifests = fluxRelease.getManifests();
    const fluxResourceNodes: Construct[] = [];
    fluxResourceManifests.forEach((m, i) => {
      const manifestResource = cluster.addManifest(`flux-${i}`, m);
      if (fluxResourceNodes.length > 0) {
        manifestResource.node.addDependency(fluxResourceNodes[fluxResourceNodes.length - 1]);
      }
      fluxResourceNodes.push(manifestResource);
    });
    // create Namespace first
    secretSync.node.addDependency(fluxResourceNodes[0]);
    fluxResourceNodes[1].node.addDependency(secretSync);
    //
    // Bootstrap manifests
    const gitRepoManifest = cluster.addManifest('GitRepoSelf', {
      apiVersion: 'source.toolkit.fluxcd.io/v1beta1',
      kind: 'GitRepository',
      metadata: {
        name: 'flux-system',
        namespace: 'flux-system',
      },
      spec: {
        interval: '10m0s',
        ref: {
          branch: this.fluxV2Props.repoBranch,
        },
        secretRef: {
          name: csiSecret.kubernetesSecret?.secretName,
        },
        url: this.fluxV2Props.repoUrl,
      },
    });
    gitRepoManifest.node.addDependency(fluxResourceNodes[fluxResourceNodes.length - 1]);

    const kustomizationManifest = cluster.addManifest('KustomizationSelf', {
      apiVersion: 'kustomize.toolkit.fluxcd.io/v1beta1',
      kind: 'Kustomization',
      metadata: {
        name: 'flux-system',
        namespace: 'flux-system',
      },
      spec: {
        interval: '10m0s',
        path: this.fluxV2Props.repoPath,
        prune: true,
        sourceRef: {
          kind: 'GitRepository',
          name: 'flux-system',
        },
        validation: 'client',
      },
    });
    kustomizationManifest.node.addDependency(fluxResourceNodes[fluxResourceNodes.length - 1]);
  }

  private createIRSA(cluster: eks.Cluster): eks.ServiceAccount {
    const readSecretStatement = new iam.PolicyStatement();
    readSecretStatement.addResources('*');
    readSecretStatement.addActions('secretsmanager:Get*');

    const sourceControllerPolicy = new iam.PolicyDocument({
      statements: [readSecretStatement],
    });
    return utils.createServiceAccount(cluster, 'flux-system-git-sa', 'flux-system', sourceControllerPolicy);
  }
}
