# API Reference
**Classes**
Name|Description
----|-----------
[CreateGitopsSecretResource](#nsa-construct-creategitopssecretresource)|Class to configure CloudWatch Destination on logs receiving account.
[EksCluster](#nsa-construct-ekscluster)|
[SaasPipeline](#nsa-construct-saaspipeline)|An extension to CodePipeline which configures sane defaults for a NX Monorepo codebase.
**Structs**
Name|Description
----|-----------
[CreateGitopsSecretProps](#nsa-construct-creategitopssecretprops)|
[EKSClusterProps](#nsa-construct-eksclusterprops)|
[PDKPipelineProps](#nsa-construct-pdkpipelineprops)|Properties to configure the PDKPipeline.


## class CreateGitopsSecretResource  <a id="nsa-construct-creategitopssecretresource"></a>

Class to configure CloudWatch Destination on logs receiving account.

**Implements**: [IConstruct](#constructs-iconstruct), [IDependable](#constructs-idependable)
**Extends**: [Construct](#constructs-construct)

### Initializer




```
new CreateGitopsSecretResource(scope: Construct, id: string, props: CreateGitopsSecretProps)
```

* **scope** (<code>[Construct](#constructs-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[CreateGitopsSecretProps](#nsa-construct-creategitopssecretprops)</code>)  *No description*
  * **secretName** (<code>string</code>)  Secret name. 
  * **username** (<code>string</code>)  Gitops IAM username. 



### Properties


Name | Type | Description 
-----|------|-------------
**id** | <code>string</code> | <span></span>
**node** | <code>[Node](#constructs-node)</code> | The tree node.

### Methods


Name | Description
-----|-----
[**toString()**](#nsa-construct-creategitopssecretresource-tostring) | Returns a string representation of this construct.


---
#### toString() <a id="nsa-construct-creategitopssecretresource-tostring"></a>

Returns a string representation of this construct.
```
public toString(): string
```


*Returns*
* <code>string</code>



## class EksCluster  <a id="nsa-construct-ekscluster"></a>



**Implements**: [IConstruct](#constructs-iconstruct), [IDependable](#constructs-idependable)
**Extends**: [Construct](#constructs-construct)

### Initializer




```
new EksCluster(scope: Construct, props: EKSClusterProps)
```

* **scope** (<code>[Construct](#constructs-construct)</code>)  *No description*
* **props** (<code>[EKSClusterProps](#nsa-construct-eksclusterprops)</code>)  *No description*
  * **platformTeamRole** (<code>string</code>)  *No description* 
  * **gitopsRepoBranch** (<code>string</code>)  *No description* *Optional*
  * **gitopsRepoSecret** (<code>string</code>)  *No description* *Optional*
  * **gitopsRepoUrl** (<code>string</code>)  *No description* *Optional*
  * **vpcID** (<code>string</code>)  *No description* *Optional*



### Properties


Name | Type | Description 
-----|------|-------------
**node** | <code>[Node](#constructs-node)</code> | The tree node.

### Methods


Name | Description
-----|-----
[**toString()**](#nsa-construct-ekscluster-tostring) | Returns a string representation of this construct.


---
#### toString() <a id="nsa-construct-ekscluster-tostring"></a>

Returns a string representation of this construct.
```
public toString(): string
```


*Returns*
* <code>string</code>



## class SaasPipeline  <a id="nsa-construct-saaspipeline"></a>

An extension to CodePipeline which configures sane defaults for a NX Monorepo codebase.

In addition to this, it also creates a CodeCommit repository with
automated PR builds and approvals.

**Implements**: [IConstruct](#constructs-iconstruct), [IDependable](#constructs-idependable)
**Extends**: [Construct](#constructs-construct)

### Initializer




```
new SaasPipeline(scope: Construct, id: string, props: PDKPipelineProps)
```

* **scope** (<code>[Construct](#constructs-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[PDKPipelineProps](#nsa-construct-pdkpipelineprops)</code>)  *No description*
  * **synth** (<code>[IFileSetProducer](#aws-cdk-lib-pipelines-ifilesetproducer)</code>)  The build step that produces the CDK Cloud Assembly. 
  * **artifactBucket** (<code>[IBucket](#aws-cdk-lib-aws-s3-ibucket)</code>)  An existing S3 Bucket to use for storing the pipeline's artifact. *Default*: A new S3 bucket will be created.
  * **assetPublishingCodeBuildDefaults** (<code>[CodeBuildOptions](#aws-cdk-lib-pipelines-codebuildoptions)</code>)  Additional customizations to apply to the asset publishing CodeBuild projects. *Default*: Only `codeBuildDefaults` are applied
  * **cliVersion** (<code>string</code>)  CDK CLI version to use in self-mutation and asset publishing steps. *Default*: Latest version
  * **codeBuildDefaults** (<code>[CodeBuildOptions](#aws-cdk-lib-pipelines-codebuildoptions)</code>)  Customize the CodeBuild projects created for this pipeline. *Default*: All projects run non-privileged build, SMALL instance, LinuxBuildImage.STANDARD_6_0
  * **codePipeline** (<code>[Pipeline](#aws-cdk-lib-aws-codepipeline-pipeline)</code>)  An existing Pipeline to be reused and built upon. *Default*: a new underlying pipeline is created.
  * **crossAccountKeys** (<code>boolean</code>)  Create KMS keys for the artifact buckets, allowing cross-account deployments. *Default*: false
  * **dockerCredentials** (<code>Array<[DockerCredential](#aws-cdk-lib-pipelines-dockercredential)></code>)  A list of credentials used to authenticate to Docker registries. *Default*: []
  * **dockerEnabledForSelfMutation** (<code>boolean</code>)  Enable Docker for the self-mutate step. *Default*: false
  * **dockerEnabledForSynth** (<code>boolean</code>)  Enable Docker for the 'synth' step. *Default*: false
  * **enableKeyRotation** (<code>boolean</code>)  Enable KMS key rotation for the generated KMS keys. *Default*: false (key rotation is disabled)
  * **pipelineName** (<code>string</code>)  The name of the CodePipeline pipeline. *Default*: Automatically generated
  * **publishAssetsInParallel** (<code>boolean</code>)  Publish assets in multiple CodeBuild projects. *Default*: true
  * **reuseCrossRegionSupportStacks** (<code>boolean</code>)  Reuse the same cross region support stack for all pipelines in the App. *Default*: true (Use the same support stack for all pipelines in App)
  * **role** (<code>[IRole](#aws-cdk-lib-aws-iam-irole)</code>)  The IAM role to be assumed by this Pipeline. *Default*: A new role is created
  * **selfMutation** (<code>boolean</code>)  Whether the pipeline will update itself. *Default*: true
  * **selfMutationCodeBuildDefaults** (<code>[CodeBuildOptions](#aws-cdk-lib-pipelines-codebuildoptions)</code>)  Additional customizations to apply to the self mutation CodeBuild projects. *Default*: Only `codeBuildDefaults` are applied
  * **synthCodeBuildDefaults** (<code>[CodeBuildOptions](#aws-cdk-lib-pipelines-codebuildoptions)</code>)  Additional customizations to apply to the synthesize CodeBuild projects. *Default*: Only `codeBuildDefaults` are applied
  * **useChangeSets** (<code>boolean</code>)  Deploy every stack by creating a change set and executing it. *Default*: true
  * **primarySynthDirectory** (<code>string</code>)  Output directory for cdk synthesized artifacts i.e: packages/infra/cdk.out. 
  * **repositoryName** (<code>string</code>)  Name of the CodeCommit repository to create. 
  * **codeCommitRemovalPolicy** (<code>[RemovalPolicy](#aws-cdk-lib-removalpolicy)</code>)  Possible values for a resource's Removal Policy The removal policy controls what happens to the resource if it stops being managed by CloudFormation. *Optional*
  * **defaultBranchName** (<code>string</code>)  Branch to trigger the pipeline execution. *Default*: mainline
  * **existingKMSKeyAlias** (<code>string</code>)  Alias to use for existing KMS Key when crossAccount. *Default*: mainline
  * **synthShellStepPartialProps** (<code>[ShellStepProps](#aws-cdk-lib-pipelines-shellstepprops)</code>)  PDKPipeline by default assumes a NX Monorepo structure for it's codebase and uses sane defaults for the install and run commands. *Optional*



### Properties


Name | Type | Description 
-----|------|-------------
**codePipeline** | <code>[CodePipeline](#aws-cdk-lib-pipelines-codepipeline)</code> | <span></span>
**node** | <code>[Node](#constructs-node)</code> | The tree node.

### Methods


Name | Description
-----|-----
[**addStage()**](#nsa-construct-saaspipeline-addstage) | <span></span>
[**addWave()**](#nsa-construct-saaspipeline-addwave) | <span></span>
[**buildPipeline()**](#nsa-construct-saaspipeline-buildpipeline) | <span></span>
[**suppressCDKViolations()**](#nsa-construct-saaspipeline-suppresscdkviolations) | <span></span>
[**toString()**](#nsa-construct-saaspipeline-tostring) | Returns a string representation of this construct.


---
#### addStage(stage, options?) <a id="nsa-construct-saaspipeline-addstage"></a>


```
public addStage(stage: Stage, options?: AddStageOpts): StageDeployment
```

* **stage** (<code>[Stage](#aws-cdk-lib-stage)</code>)  *No description*
* **options** (<code>[AddStageOpts](#aws-cdk-lib-pipelines-addstageopts)</code>)  *No description*
  * **post** (<code>Array<[Step](#aws-cdk-lib-pipelines-step)></code>)  Additional steps to run after all of the stacks in the stage. *Default*: No additional steps
  * **pre** (<code>Array<[Step](#aws-cdk-lib-pipelines-step)></code>)  Additional steps to run before any of the stacks in the stage. *Default*: No additional steps
  * **stackSteps** (<code>Array<[StackSteps](#aws-cdk-lib-pipelines-stacksteps)></code>)  Instructions for stack level steps. *Default*: No additional instructions

*Returns*
* <code>[StageDeployment](#aws-cdk-lib-pipelines-stagedeployment)</code>


---
#### addWave(wave, options?) <a id="nsa-construct-saaspipeline-addwave"></a>


```
public addWave(wave: string, options?: WaveOptions): Wave
```

* **wave** (<code>string</code>)  *No description*
* **options** (<code>[WaveOptions](#aws-cdk-lib-pipelines-waveoptions)</code>)  *No description*
  * **post** (<code>Array<[Step](#aws-cdk-lib-pipelines-step)></code>)  Additional steps to run after all of the stages in the wave. *Default*: No additional steps
  * **pre** (<code>Array<[Step](#aws-cdk-lib-pipelines-step)></code>)  Additional steps to run before any of the stages in the wave. *Default*: No additional steps

*Returns*
* <code>[Wave](#aws-cdk-lib-pipelines-wave)</code>


---
#### buildPipeline() <a id="nsa-construct-saaspipeline-buildpipeline"></a>


```
public buildPipeline(): void
```






---
#### suppressCDKViolations() <a id="nsa-construct-saaspipeline-suppresscdkviolations"></a>


```
public suppressCDKViolations(): void
```






---
#### toString() <a id="nsa-construct-saaspipeline-tostring"></a>

Returns a string representation of this construct.
```
public toString(): string
```


*Returns*
* <code>string</code>



## struct CreateGitopsSecretProps  <a id="nsa-construct-creategitopssecretprops"></a>






Name | Type | Description 
-----|------|-------------
**secretName** | <code>string</code> | Secret name.
**username** | <code>string</code> | Gitops IAM username.



## struct EKSClusterProps  <a id="nsa-construct-eksclusterprops"></a>






Name | Type | Description 
-----|------|-------------
**platformTeamRole** | <code>string</code> | <span></span>
**gitopsRepoBranch**? | <code>string</code> | <br/><br/>*Optional*
**gitopsRepoSecret**? | <code>string</code> | <br/><br/>*Optional*
**gitopsRepoUrl**? | <code>string</code> | <br/><br/>*Optional*
**vpcID**? | <code>string</code> | <br/><br/>*Optional*



## struct PDKPipelineProps  <a id="nsa-construct-pdkpipelineprops"></a>


Properties to configure the PDKPipeline.

Note: Due to limitations with JSII and generic support it should be noted that
the synth, synthShellStepPartialProps.input and
synthShellStepPartialProps.primaryOutputDirectory properties will be ignored
if passed in to this construct.

synthShellStepPartialProps.commands is marked as a required field, however
if you pass in [] the default commands of this construct will be retained.



Name | Type | Description 
-----|------|-------------
**primarySynthDirectory** | <code>string</code> | Output directory for cdk synthesized artifacts i.e: packages/infra/cdk.out.
**repositoryName** | <code>string</code> | Name of the CodeCommit repository to create.
**synth** | <code>[IFileSetProducer](#aws-cdk-lib-pipelines-ifilesetproducer)</code> | The build step that produces the CDK Cloud Assembly.
**artifactBucket**? | <code>[IBucket](#aws-cdk-lib-aws-s3-ibucket)</code> | An existing S3 Bucket to use for storing the pipeline's artifact.<br/><br/>*Default*: A new S3 bucket will be created.
**assetPublishingCodeBuildDefaults**? | <code>[CodeBuildOptions](#aws-cdk-lib-pipelines-codebuildoptions)</code> | Additional customizations to apply to the asset publishing CodeBuild projects.<br/><br/>*Default*: Only `codeBuildDefaults` are applied
**cliVersion**? | <code>string</code> | CDK CLI version to use in self-mutation and asset publishing steps.<br/><br/>*Default*: Latest version
**codeBuildDefaults**? | <code>[CodeBuildOptions](#aws-cdk-lib-pipelines-codebuildoptions)</code> | Customize the CodeBuild projects created for this pipeline.<br/><br/>*Default*: All projects run non-privileged build, SMALL instance, LinuxBuildImage.STANDARD_6_0
**codeCommitRemovalPolicy**? | <code>[RemovalPolicy](#aws-cdk-lib-removalpolicy)</code> | Possible values for a resource's Removal Policy The removal policy controls what happens to the resource if it stops being managed by CloudFormation.<br/><br/>*Optional*
**codePipeline**? | <code>[Pipeline](#aws-cdk-lib-aws-codepipeline-pipeline)</code> | An existing Pipeline to be reused and built upon.<br/><br/>*Default*: a new underlying pipeline is created.
**crossAccountKeys**? | <code>boolean</code> | Create KMS keys for the artifact buckets, allowing cross-account deployments.<br/><br/>*Default*: false
**defaultBranchName**? | <code>string</code> | Branch to trigger the pipeline execution.<br/><br/>*Default*: mainline
**dockerCredentials**? | <code>Array<[DockerCredential](#aws-cdk-lib-pipelines-dockercredential)></code> | A list of credentials used to authenticate to Docker registries.<br/><br/>*Default*: []
**dockerEnabledForSelfMutation**? | <code>boolean</code> | Enable Docker for the self-mutate step.<br/><br/>*Default*: false
**dockerEnabledForSynth**? | <code>boolean</code> | Enable Docker for the 'synth' step.<br/><br/>*Default*: false
**enableKeyRotation**? | <code>boolean</code> | Enable KMS key rotation for the generated KMS keys.<br/><br/>*Default*: false (key rotation is disabled)
**existingKMSKeyAlias**? | <code>string</code> | Alias to use for existing KMS Key when crossAccount.<br/><br/>*Default*: mainline
**pipelineName**? | <code>string</code> | The name of the CodePipeline pipeline.<br/><br/>*Default*: Automatically generated
**publishAssetsInParallel**? | <code>boolean</code> | Publish assets in multiple CodeBuild projects.<br/><br/>*Default*: true
**reuseCrossRegionSupportStacks**? | <code>boolean</code> | Reuse the same cross region support stack for all pipelines in the App.<br/><br/>*Default*: true (Use the same support stack for all pipelines in App)
**role**? | <code>[IRole](#aws-cdk-lib-aws-iam-irole)</code> | The IAM role to be assumed by this Pipeline.<br/><br/>*Default*: A new role is created
**selfMutation**? | <code>boolean</code> | Whether the pipeline will update itself.<br/><br/>*Default*: true
**selfMutationCodeBuildDefaults**? | <code>[CodeBuildOptions](#aws-cdk-lib-pipelines-codebuildoptions)</code> | Additional customizations to apply to the self mutation CodeBuild projects.<br/><br/>*Default*: Only `codeBuildDefaults` are applied
**synthCodeBuildDefaults**? | <code>[CodeBuildOptions](#aws-cdk-lib-pipelines-codebuildoptions)</code> | Additional customizations to apply to the synthesize CodeBuild projects.<br/><br/>*Default*: Only `codeBuildDefaults` are applied
**synthShellStepPartialProps**? | <code>[ShellStepProps](#aws-cdk-lib-pipelines-shellstepprops)</code> | PDKPipeline by default assumes a NX Monorepo structure for it's codebase and uses sane defaults for the install and run commands.<br/><br/>*Optional*
**useChangeSets**? | <code>boolean</code> | Deploy every stack by creating a change set and executing it.<br/><br/>*Default*: true



