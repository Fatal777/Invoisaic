"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeBaseConstruct = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const opensearch = __importStar(require("aws-cdk-lib/aws-opensearchserverless"));
const constructs_1 = require("constructs");
class KnowledgeBaseConstruct extends constructs_1.Construct {
    constructor(scope, id, props) {
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
        kbRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['bedrock:InvokeModel'],
            resources: [
                `arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0`,
            ],
        }));
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
        kbRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['aoss:APIAccessAll'],
            resources: [collection.attrArn],
        }));
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
exports.KnowledgeBaseConstruct = KnowledgeBaseConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia25vd2xlZGdlLWJhc2UtY29uc3RydWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsia25vd2xlZGdlLWJhc2UtY29uc3RydWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBeUM7QUFDekMseURBQTJDO0FBQzNDLGlGQUFtRTtBQUNuRSwyQ0FBdUM7QUFNdkMsTUFBYSxzQkFBdUIsU0FBUSxzQkFBUztJQUtuRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWtDO1FBQzFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsTUFBTSxFQUFFLFdBQVcsRUFBRSxHQUFHLEtBQUssQ0FBQztRQUU5QiwyQ0FBMkM7UUFDM0MseUNBQXlDO1FBQ3pDLDJDQUEyQztRQUUzQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUseUJBQXlCLEVBQUU7WUFDL0QsVUFBVSxFQUFFLHVCQUF1QixXQUFXLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUU7WUFDdEUsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztZQUN4QyxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsVUFBVSxFQUFFLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVO1NBQzNDLENBQUMsQ0FBQztRQUVILDJDQUEyQztRQUMzQyw4QkFBOEI7UUFDOUIsMkNBQTJDO1FBRTNDLE1BQU0sTUFBTSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7WUFDckQsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLHVCQUF1QixDQUFDO1lBQzVELFdBQVcsRUFBRSxpQ0FBaUM7U0FDL0MsQ0FBQyxDQUFDO1FB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VyxFQUFFLHNDQUFzQztZQUNuRCxVQUFVLEVBQUUsR0FBRyxXQUFXLG9CQUFvQjtTQUMvQyxDQUFDLENBQUM7UUFFSCxvRkFBb0Y7UUFDcEYsOEZBQThGO0lBQ2hHLENBQUM7Q0FDRjtBQXZLRCx3REF1S0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIG9wZW5zZWFyY2ggZnJvbSAnYXdzLWNkay1saWIvYXdzLW9wZW5zZWFyY2hzZXJ2ZXJsZXNzJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEtub3dsZWRnZUJhc2VDb25zdHJ1Y3RQcm9wcyB7XG4gIGVudmlyb25tZW50OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBLbm93bGVkZ2VCYXNlQ29uc3RydWN0IGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgcHVibGljIHJlYWRvbmx5IGRhdGFCdWNrZXQ6IHMzLkJ1Y2tldDtcbiAgcHVibGljIHJlYWRvbmx5IGNvbGxlY3Rpb25Bcm46IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IGtub3dsZWRnZUJhc2VJZDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBLbm93bGVkZ2VCYXNlQ29uc3RydWN0UHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgY29uc3QgeyBlbnZpcm9ubWVudCB9ID0gcHJvcHM7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gUzMgQnVja2V0IGZvciBLbm93bGVkZ2UgQmFzZSBEb2N1bWVudHNcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICB0aGlzLmRhdGFCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdLbm93bGVkZ2VCYXNlRGF0YUJ1Y2tldCcsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IGBpbnZvaXNhaWMta25vd2xlZGdlLSR7ZW52aXJvbm1lbnR9LSR7Y2RrLkF3cy5BQ0NPVU5UX0lEfWAsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IHRydWUsXG4gICAgICB2ZXJzaW9uZWQ6IHRydWUsXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgfSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gSUFNIFJvbGUgZm9yIEtub3dsZWRnZSBCYXNlXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgY29uc3Qga2JSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdLbm93bGVkZ2VCYXNlUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdiZWRyb2NrLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUm9sZSBmb3IgQmVkcm9jayBLbm93bGVkZ2UgQmFzZScsXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCByZWFkIGFjY2VzcyB0byBTM1xuICAgIHRoaXMuZGF0YUJ1Y2tldC5ncmFudFJlYWQoa2JSb2xlKTtcblxuICAgIC8vIEdyYW50IEJlZHJvY2sgbW9kZWwgaW52b2NhdGlvblxuICAgIGtiUm9sZS5hZGRUb1BvbGljeShcbiAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICBhY3Rpb25zOiBbJ2JlZHJvY2s6SW52b2tlTW9kZWwnXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgICAgYGFybjphd3M6YmVkcm9jazoqOjpmb3VuZGF0aW9uLW1vZGVsL2FtYXpvbi50aXRhbi1lbWJlZC10ZXh0LXYyOjBgLFxuICAgICAgICBdLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIE9wZW5TZWFyY2ggU2VydmVybGVzcyBDb2xsZWN0aW9uXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLy8gRW5jcnlwdGlvbiBwb2xpY3lcbiAgICBjb25zdCBlbmNyeXB0aW9uUG9saWN5ID0gbmV3IG9wZW5zZWFyY2guQ2ZuU2VjdXJpdHlQb2xpY3kodGhpcywgJ0VuY3J5cHRpb25Qb2xpY3knLCB7XG4gICAgICBuYW1lOiBgaW52b2lzYWljLWtiLWVuY3J5cHRpb24tJHtlbnZpcm9ubWVudH1gLFxuICAgICAgdHlwZTogJ2VuY3J5cHRpb24nLFxuICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIFJ1bGVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgUmVzb3VyY2VUeXBlOiAnY29sbGVjdGlvbicsXG4gICAgICAgICAgICBSZXNvdXJjZTogW2Bjb2xsZWN0aW9uL2ludm9pc2FpYy1rYi0ke2Vudmlyb25tZW50fWBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIEFXU093bmVkS2V5OiB0cnVlLFxuICAgICAgfSksXG4gICAgfSk7XG5cbiAgICAvLyBOZXR3b3JrIHBvbGljeVxuICAgIGNvbnN0IG5ldHdvcmtQb2xpY3kgPSBuZXcgb3BlbnNlYXJjaC5DZm5TZWN1cml0eVBvbGljeSh0aGlzLCAnTmV0d29ya1BvbGljeScsIHtcbiAgICAgIG5hbWU6IGBpbnZvaXNhaWMta2ItbmV0d29yay0ke2Vudmlyb25tZW50fWAsXG4gICAgICB0eXBlOiAnbmV0d29yaycsXG4gICAgICBwb2xpY3k6IEpTT04uc3RyaW5naWZ5KFtcbiAgICAgICAge1xuICAgICAgICAgIFJ1bGVzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFJlc291cmNlVHlwZTogJ2NvbGxlY3Rpb24nLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogW2Bjb2xsZWN0aW9uL2ludm9pc2FpYy1rYi0ke2Vudmlyb25tZW50fWBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgUmVzb3VyY2VUeXBlOiAnZGFzaGJvYXJkJyxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6IFtgY29sbGVjdGlvbi9pbnZvaXNhaWMta2ItJHtlbnZpcm9ubWVudH1gXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgICBBbGxvd0Zyb21QdWJsaWM6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICBdKSxcbiAgICB9KTtcblxuICAgIC8vIERhdGEgYWNjZXNzIHBvbGljeVxuICAgIGNvbnN0IGRhdGFBY2Nlc3NQb2xpY3lTdGF0ZW1lbnQgPSB7XG4gICAgICBSdWxlczogW1xuICAgICAgICB7XG4gICAgICAgICAgUmVzb3VyY2VUeXBlOiAnY29sbGVjdGlvbicsXG4gICAgICAgICAgUmVzb3VyY2U6IFtgY29sbGVjdGlvbi9pbnZvaXNhaWMta2ItJHtlbnZpcm9ubWVudH1gXSxcbiAgICAgICAgICBQZXJtaXNzaW9uOiBbXG4gICAgICAgICAgICAnYW9zczpDcmVhdGVDb2xsZWN0aW9uSXRlbXMnLFxuICAgICAgICAgICAgJ2Fvc3M6RGVsZXRlQ29sbGVjdGlvbkl0ZW1zJyxcbiAgICAgICAgICAgICdhb3NzOlVwZGF0ZUNvbGxlY3Rpb25JdGVtcycsXG4gICAgICAgICAgICAnYW9zczpEZXNjcmliZUNvbGxlY3Rpb25JdGVtcycsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIFJlc291cmNlVHlwZTogJ2luZGV4JyxcbiAgICAgICAgICBSZXNvdXJjZTogW2BpbmRleC9pbnZvaXNhaWMta2ItJHtlbnZpcm9ubWVudH0vKmBdLFxuICAgICAgICAgIFBlcm1pc3Npb246IFtcbiAgICAgICAgICAgICdhb3NzOkNyZWF0ZUluZGV4JyxcbiAgICAgICAgICAgICdhb3NzOkRlbGV0ZUluZGV4JyxcbiAgICAgICAgICAgICdhb3NzOlVwZGF0ZUluZGV4JyxcbiAgICAgICAgICAgICdhb3NzOkRlc2NyaWJlSW5kZXgnLFxuICAgICAgICAgICAgJ2Fvc3M6UmVhZERvY3VtZW50JyxcbiAgICAgICAgICAgICdhb3NzOldyaXRlRG9jdW1lbnQnLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgUHJpbmNpcGFsOiBba2JSb2xlLnJvbGVBcm4sIGBhcm46YXdzOmlhbTo6JHtjZGsuQXdzLkFDQ09VTlRfSUR9OnJvb3RgXSxcbiAgICB9O1xuXG4gICAgY29uc3QgZGF0YUFjY2Vzc1BvbGljeSA9IG5ldyBvcGVuc2VhcmNoLkNmbkFjY2Vzc1BvbGljeSh0aGlzLCAnRGF0YUFjY2Vzc1BvbGljeScsIHtcbiAgICAgIG5hbWU6IGBpbnZvaXNhaWMta2ItYWNjZXNzLSR7ZW52aXJvbm1lbnR9YCxcbiAgICAgIHR5cGU6ICdkYXRhJyxcbiAgICAgIHBvbGljeTogSlNPTi5zdHJpbmdpZnkoW2RhdGFBY2Nlc3NQb2xpY3lTdGF0ZW1lbnRdKSxcbiAgICB9KTtcblxuICAgIC8vIE9wZW5TZWFyY2ggU2VydmVybGVzcyBDb2xsZWN0aW9uXG4gICAgY29uc3QgY29sbGVjdGlvbiA9IG5ldyBvcGVuc2VhcmNoLkNmbkNvbGxlY3Rpb24odGhpcywgJ0tub3dsZWRnZUJhc2VDb2xsZWN0aW9uJywge1xuICAgICAgbmFtZTogYGludm9pc2FpYy1rYi0ke2Vudmlyb25tZW50fWAsXG4gICAgICB0eXBlOiAnVkVDVE9SU0VBUkNIJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVmVjdG9yIGRhdGFiYXNlIGZvciB0YXggY29tcGxpYW5jZSBrbm93bGVkZ2UgYmFzZScsXG4gICAgfSk7XG5cbiAgICBjb2xsZWN0aW9uLmFkZERlcGVuZGVuY3koZW5jcnlwdGlvblBvbGljeSk7XG4gICAgY29sbGVjdGlvbi5hZGREZXBlbmRlbmN5KG5ldHdvcmtQb2xpY3kpO1xuICAgIGNvbGxlY3Rpb24uYWRkRGVwZW5kZW5jeShkYXRhQWNjZXNzUG9saWN5KTtcblxuICAgIHRoaXMuY29sbGVjdGlvbkFybiA9IGNvbGxlY3Rpb24uYXR0ckFybjtcblxuICAgIC8vIEdyYW50IE9wZW5TZWFyY2ggYWNjZXNzIHRvIEtub3dsZWRnZSBCYXNlIHJvbGVcbiAgICBrYlJvbGUuYWRkVG9Qb2xpY3koXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgYWN0aW9uczogWydhb3NzOkFQSUFjY2Vzc0FsbCddLFxuICAgICAgICByZXNvdXJjZXM6IFtjb2xsZWN0aW9uLmF0dHJBcm5dLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIE91dHB1dHNcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnS25vd2xlZGdlQmFzZUJ1Y2tldE5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5kYXRhQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ1MzIGJ1Y2tldCBmb3Iga25vd2xlZGdlIGJhc2UgZG9jdW1lbnRzJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke2Vudmlyb25tZW50fS1rYi1idWNrZXRgLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0NvbGxlY3Rpb25FbmRwb2ludCcsIHtcbiAgICAgIHZhbHVlOiBjb2xsZWN0aW9uLmF0dHJDb2xsZWN0aW9uRW5kcG9pbnQsXG4gICAgICBkZXNjcmlwdGlvbjogJ09wZW5TZWFyY2ggU2VydmVybGVzcyBjb2xsZWN0aW9uIGVuZHBvaW50JyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke2Vudmlyb25tZW50fS1rYi1jb2xsZWN0aW9uLWVuZHBvaW50YCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDb2xsZWN0aW9uQXJuJywge1xuICAgICAgdmFsdWU6IGNvbGxlY3Rpb24uYXR0ckFybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnT3BlblNlYXJjaCBTZXJ2ZXJsZXNzIGNvbGxlY3Rpb24gQVJOJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke2Vudmlyb25tZW50fS1rYi1jb2xsZWN0aW9uLWFybmAsXG4gICAgfSk7XG5cbiAgICAvLyBOb3RlOiBLbm93bGVkZ2UgQmFzZSBjcmVhdGlvbiByZXF1aXJlcyBhZGRpdGlvbmFsIG1hbnVhbCBzZXR1cCBvciBjdXN0b20gcmVzb3VyY2VcbiAgICAvLyBGb3Igbm93LCB3ZSdsbCBjcmVhdGUgdGhlIGluZnJhc3RydWN0dXJlIGFuZCBLbm93bGVkZ2UgQmFzZSBJRCB3aWxsIGJlIHByb3ZpZGVkIHZpYSBlbnYgdmFyXG4gIH1cbn1cbiJdfQ==