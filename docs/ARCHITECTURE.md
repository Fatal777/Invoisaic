# Invoisaic Architecture Documentation

## System Overview

Invoisaic is an AI-powered invoice automation platform built on AWS serverless architecture, leveraging AWS Bedrock AgentCore Runtime and Amazon Nova models for intelligent invoice processing.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
│  React 18 + TypeScript + Tailwind CSS + shadcn/ui              │
│  Hosted on: S3 + CloudFront (Optional)                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway (REST)                          │
│  - JWT Authentication via Cognito                               │
│  - CORS enabled                                                 │
│  - Request validation                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Invoice    │  │   Customer   │  │   Analytics  │
│   Lambda     │  │   Lambda     │  │   Lambda     │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────────────────────────────────────────────────────┐
│              AWS Bedrock AgentCore Runtime                    │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ Supervisor Agent│  │  Pricing Agent  │                  │
│  │  (Nova Lite)    │  │  (Nova Micro)   │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │Compliance Agent │  │ Customer Intel  │                  │
│  │  (Nova Micro)   │  │  (Nova Micro)   │                  │
│  └─────────────────┘  └─────────────────┘                  │
└──────────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  DynamoDB    │  │  DynamoDB    │  │      S3      │
│  Invoices    │  │  Customers   │  │  Documents   │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Component Details

### Frontend Layer

**Technology Stack:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui for components
- Zustand for state management
- React Router for navigation
- AWS Amplify for AWS integration

**Key Features:**
- Responsive design for all devices
- Real-time agent monitoring
- Interactive data visualizations
- AI-powered insights dashboard

### API Layer

**AWS API Gateway:**
- RESTful API endpoints
- JWT authentication via Cognito
- Request/response validation
- CORS configuration
- Rate limiting and throttling

**Endpoints:**
- `/invoices` - Invoice CRUD operations
- `/customers` - Customer management
- `/agents` - Agent monitoring
- `/analytics` - Business intelligence

### Compute Layer

**AWS Lambda Functions:**

1. **Invoice Handler**
   - Create, read, update, delete invoices
   - Trigger AI agent processing
   - Send invoices via email
   - Payment tracking

2. **Customer Handler**
   - Customer management
   - Behavior analysis
   - Relationship insights

3. **Agent Handler**
   - Agent status monitoring
   - Performance metrics
   - Activity logs

4. **Analytics Handler**
   - Dashboard metrics
   - Revenue analytics
   - Payment trends

### AI Agent Layer

**AWS Bedrock AgentCore Runtime:**

1. **Supervisor Agent (Nova Lite)**
   - Orchestrates multi-agent workflow
   - Makes final coordination decisions
   - Resolves conflicts between agents
   - Determines approval/review requirements

2. **Pricing Agent (Nova Micro)**
   - Complex pricing calculations
   - Volume discount optimization
   - Currency conversion
   - Early payment incentives
   - Competitive analysis

3. **Compliance Agent (Nova Micro)**
   - Tax calculations across jurisdictions
   - Regulatory validation
   - E-invoicing standards
   - Industry-specific compliance
   - Data privacy adherence

4. **Customer Intelligence Agent (Nova Micro)**
   - Payment behavior prediction
   - Risk assessment
   - Optimal timing recommendations
   - Relationship health scoring
   - Lifetime value calculation

### Data Layer

**DynamoDB Tables:**

1. **Invoices Table**
   - Partition Key: `id`
   - Attributes: invoice data, AI recommendations, agent processing info
   - Billing: Pay-per-request

2. **Customers Table**
   - Partition Key: `id`
   - Attributes: customer data, behavior profile, payment history
   - Billing: Pay-per-request

3. **Agents Table**
   - Partition Key: `id`
   - Attributes: agent status, performance metrics, logs
   - Billing: Pay-per-request

**S3 Buckets:**
- Documents bucket for invoice PDFs and attachments
- Encryption at rest
- Versioning enabled (production)

### Authentication & Authorization

**AWS Cognito:**
- User Pool for authentication
- Email-based sign-in
- Password policies
- JWT token generation
- User management

## Multi-Agent Workflow

### Invoice Processing Flow

```
1. User creates invoice
   ↓
2. Invoice Handler receives request
   ↓
3. Supervisor Agent initiates workflow
   ↓
4. Parallel agent processing:
   ├─ Pricing Agent → Calculate optimal pricing
   ├─ Compliance Agent → Validate regulations
   └─ Customer Agent → Analyze behavior
   ↓
5. Supervisor Agent coordinates results
   ↓
6. Final decision with AI recommendations
   ↓
7. Save to DynamoDB with agent insights
   ↓
8. Return to user with recommendations
```

### Agent Communication

Agents communicate through:
- Structured JSON messages
- Bedrock AgentCore primitives
- Shared context via DynamoDB
- Event-driven coordination

## Scalability & Performance

**Horizontal Scaling:**
- Lambda auto-scales based on demand
- DynamoDB on-demand pricing scales automatically
- API Gateway handles high throughput

**Performance Optimizations:**
- Parallel agent processing
- Efficient DynamoDB queries
- Lambda function optimization
- CloudFront CDN for frontend (optional)

**Cost Optimization:**
- Serverless architecture (pay-per-use)
- Bedrock AgentCore free preview
- DynamoDB on-demand billing
- Lambda memory optimization

## Security

**Data Protection:**
- Encryption at rest (DynamoDB, S3)
- Encryption in transit (HTTPS/TLS)
- IAM roles with least privilege
- Cognito authentication
- Input validation

**Compliance:**
- GDPR considerations
- Data retention policies
- Audit logging via CloudWatch
- Secure credential management

## Monitoring & Observability

**CloudWatch:**
- Lambda function logs
- API Gateway metrics
- DynamoDB performance
- Custom business metrics

**AgentCore Observability:**
- Agent execution traces
- Decision reasoning logs
- Performance metrics
- Error tracking

## Disaster Recovery

**Backup Strategy:**
- DynamoDB point-in-time recovery (production)
- S3 versioning
- CloudFormation stack templates
- Infrastructure as Code (CDK)

**Recovery Procedures:**
- Automated stack recreation
- Data restoration from backups
- Multi-region deployment (future)

## Future Enhancements

1. **Multi-region deployment** for global availability
2. **Real-time notifications** via WebSocket
3. **Advanced analytics** with QuickSight
4. **Machine learning models** for predictions
5. **Mobile applications** (iOS/Android)
6. **Integration marketplace** for third-party tools
7. **Advanced reporting** with custom dashboards
8. **Workflow automation** with Step Functions
