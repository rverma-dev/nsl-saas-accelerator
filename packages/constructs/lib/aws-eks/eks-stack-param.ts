import * as cdk from 'aws-cdk-lib';

export interface EKSClusterProps extends cdk.StackProps {
  stackName: string;
  vpcID?: string;
  platformTeamRole: string;
  gitopsRepoBranch: string;
  gitopsRepoSecret: string;
  gitopsRepoUrl: string;
}
export interface EKSClusterPropsBuilder {
  withStackName(stackName: string): this;
  withVpcID(vpcID: string): this;
  withPlatformTeamRole(platformTeamRole: string): this;
  withGitopsRepoBranch(gitopsRepoBranch: string): this;
  withGitopsRepoSecret(gitopsRepoSecret: string): this;
  withGitopsRepoUrl(gitopsRepoUrl: string): this;
  build(): EKSClusterProps;
}

class ClusterConstructPropsBuilderImpl implements EKSClusterPropsBuilder {
  private props: EKSClusterProps = {
    stackName: '',
    platformTeamRole: '',
    gitopsRepoBranch: '',
    gitopsRepoSecret: '',
    gitopsRepoUrl: '',
  };

  withStackName(stackName: string): this {
    this.props.stackName = stackName;
    return this;
  }

  withVpcID(vpcID: string): this {
    this.props.vpcID = vpcID;
    return this;
  }

  withPlatformTeamRole(platformTeamRole: string): this {
    this.props.platformTeamRole = platformTeamRole;
    return this;
  }

  withGitopsRepoBranch(gitopsRepoBranch: string): this {
    this.props.gitopsRepoBranch = gitopsRepoBranch;
    return this;
  }

  withGitopsRepoSecret(gitopsRepoSecret: string): this {
    this.props.gitopsRepoSecret = gitopsRepoSecret;
    return this;
  }

  withGitopsRepoUrl(gitopsRepoUrl: string): this {
    this.props.gitopsRepoUrl = gitopsRepoUrl;
    return this;
  }

  build(): EKSClusterProps {
    return this.props;
  }
}

export function clusterPropsBuilder(): EKSClusterPropsBuilder {
  return new ClusterConstructPropsBuilderImpl();
}
