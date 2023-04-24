# API Reference
**Classes**
Name|Description
----|-----------
[CreateGitopsSecretResource](#nsa-construct-creategitopssecretresource)|Class to configure CloudWatch Destination on logs receiving account.
[EksCluster](#nsa-construct-ekscluster)|
**Structs**
Name|Description
----|-----------
[CreateGitopsSecretProps](#nsa-construct-creategitopssecretprops)|
[EKSClusterProps](#nsa-construct-eksclusterprops)|


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



