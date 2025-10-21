import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
export interface BedrockAgentConstructProps {
    environment: string;
    lambdaRole?: iam.Role;
}
export declare class BedrockAgentConstruct extends Construct {
    readonly agent: bedrock.CfnAgent;
    readonly actionGroupLambda: lambda.Function;
    constructor(scope: Construct, id: string, props: BedrockAgentConstructProps);
}
