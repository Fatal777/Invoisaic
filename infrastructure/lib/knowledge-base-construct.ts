import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as opensearch from 'aws-cdk-lib/aws-opensearchserverless';
import { Construct } from 'constructs';

export interface KnowledgeBaseConstructProps {
  environment: string;
}

export class KnowledgeBaseConstruct extends Construct {
  public readonly dataBucket: s3.Bucket;
  public readonly collectionArn: string;
  public readonly knowledgeBaseId: string;

  constructor(scope: Construct, id: string, props: KnowledgeBaseConstructProps) {
    super(scope, id);

    const { environment } = props;

    // ========================================
    // S3 Bucket for Knowledge Base Documents
    // ========================================

    this.dataBucket = new s3.Bucket(this, 'KnowledgeBaseDataBucket', {
      bucketName: `invoisaic-knowledge-${environment}-${cdk.Aws.ACCOUNT_ID}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // ========================================
    // IAM Role for Knowledge Base
    // ========================================

    const kbRole = new iam.Role(this, 'KnowledgeBaseRole', {
      assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
      description: 'Role for Bedrock Knowledge Base',
    });

    // Grant read access to S3
    this.dataBucket.grantRead(kbRole);

    // Grant Bedrock model invocation
    kbRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel'],
        resources: [
          `arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0`,
        ],
      })
    );

    // ========================================
    // OpenSearch Serverless Collection
    // ========================================

    // Encryption policy
    const encryptionPolicy = new opensearch.CfnSecurityPolicy(this, 'EncryptionPolicy', {
      name: `invoisaic-kb-encryption-${environment}`,
      type: 'encryption',
      policy: JSON.stringify({
        Rules: [
          {
            ResourceType: 'collection',
            Resource: [`collection/invoisaic-kb-${environment}`],
          },
        ],
        AWSOwnedKey: true,
      }),
    });

    // Network policy
    const networkPolicy = new opensearch.CfnSecurityPolicy(this, 'NetworkPolicy', {
      name: `invoisaic-kb-network-${environment}`,
      type: 'network',
      policy: JSON.stringify([
        {
          Rules: [
            {
              ResourceType: 'collection',
              Resource: [`collection/invoisaic-kb-${environment}`],
            },
            {
              ResourceType: 'dashboard',
              Resource: [`collection/invoisaic-kb-${environment}`],
            },
          ],
          AllowFromPublic: true,
        },
      ]),
    });

    // Data access policy
    const dataAccessPolicyStatement = {
      Rules: [
        {
          ResourceType: 'collection',
          Resource: [`collection/invoisaic-kb-${environment}`],
          Permission: [
            'aoss:CreateCollectionItems',
            'aoss:DeleteCollectionItems',
            'aoss:UpdateCollectionItems',
            'aoss:DescribeCollectionItems',
          ],
        },
        {
          ResourceType: 'index',
          Resource: [`index/invoisaic-kb-${environment}/*`],
          Permission: [
            'aoss:CreateIndex',
            'aoss:DeleteIndex',
            'aoss:UpdateIndex',
            'aoss:DescribeIndex',
            'aoss:ReadDocument',
            'aoss:WriteDocument',
          ],
        },
      ],
      Principal: [kbRole.roleArn, `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:root`],
    };

    const dataAccessPolicy = new opensearch.CfnAccessPolicy(this, 'DataAccessPolicy', {
      name: `invoisaic-kb-access-${environment}`,
      type: 'data',
      policy: JSON.stringify([dataAccessPolicyStatement]),
    });

    // OpenSearch Serverless Collection
    const collection = new opensearch.CfnCollection(this, 'KnowledgeBaseCollection', {
      name: `invoisaic-kb-${environment}`,
      type: 'VECTORSEARCH',
      description: 'Vector database for tax compliance knowledge base',
    });

    collection.addDependency(encryptionPolicy);
    collection.addDependency(networkPolicy);
    collection.addDependency(dataAccessPolicy);

    this.collectionArn = collection.attrArn;

    // Grant OpenSearch access to Knowledge Base role
    kbRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['aoss:APIAccessAll'],
        resources: [collection.attrArn],
      })
    );

    // ========================================
    // Outputs
    // ========================================

    new cdk.CfnOutput(this, 'KnowledgeBaseBucketName', {
      value: this.dataBucket.bucketName,
      description: 'S3 bucket for knowledge base documents',
      exportName: `${environment}-kb-bucket`,
    });

    new cdk.CfnOutput(this, 'CollectionEndpoint', {
      value: collection.attrCollectionEndpoint,
      description: 'OpenSearch Serverless collection endpoint',
      exportName: `${environment}-kb-collection-endpoint`,
    });

    new cdk.CfnOutput(this, 'CollectionArn', {
      value: collection.attrArn,
      description: 'OpenSearch Serverless collection ARN',
      exportName: `${environment}-kb-collection-arn`,
    });

    // Note: Knowledge Base creation requires additional manual setup or custom resource
    // For now, we'll create the infrastructure and Knowledge Base ID will be provided via env var
  }
}
