import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
export interface KnowledgeBaseConstructProps {
    environment: string;
}
export declare class KnowledgeBaseConstruct extends Construct {
    readonly dataBucket: s3.Bucket;
    readonly collectionArn: string;
    readonly knowledgeBaseId: string;
    constructor(scope: Construct, id: string, props: KnowledgeBaseConstructProps);
}
