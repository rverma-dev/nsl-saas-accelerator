// ~~ Generated by projen. To modify, edit .projenrc.js and run "npx projen".
import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

/**
 * Props for FindEksCusterFunction
 */
export interface FindEksCusterFunctionProps extends lambda.FunctionOptions {
}

/**
 * An AWS Lambda function which executes src/lib/find-eks-custer.
 */
export class FindEksCusterFunction extends lambda.Function {
  constructor(scope: Construct, id: string, props?: FindEksCusterFunctionProps) {
    super(scope, id, {
      description: 'src/lib/find-eks-custer.lambda.ts',
      ...props,
      runtime: new lambda.Runtime('nodejs18.x', lambda.RuntimeFamily.NODEJS),
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../assets/lib/find-eks-custer.lambda')),
    });
    this.addEnvironment('AWS_NODEJS_CONNECTION_REUSE_ENABLED', '1', { removeInEdge: true });
  }
}