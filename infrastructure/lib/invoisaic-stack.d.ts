import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
interface InvoisaicStackProps extends cdk.StackProps {
    environment: string;
}
export declare class InvoisaicStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: InvoisaicStackProps);
}
export {};
