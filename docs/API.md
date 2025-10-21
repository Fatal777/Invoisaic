# API Documentation

## Base URL

```
https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod
```

## Authentication

All API requests require authentication using JWT tokens from AWS Cognito.

```http
Authorization: Bearer <jwt-token>
```

## Endpoints

### Invoices

#### Create Invoice

```http
POST /invoices
```

**Request Body:**
```json
{
  "customerId": "string",
  "issueDate": "2025-01-30",
  "dueDate": "2025-02-28",
  "currency": "USD",
  "items": [
    {
      "description": "Software License",
      "quantity": 10,
      "unitPrice": 1000,
      "taxRate": 0
    }
  ],
  "notes": "Payment terms: Net 30",
  "paymentTerms": "Net 30"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "inv-123",
    "invoiceNumber": "INV-2025-001",
    "status": "draft",
    "totalAmount": 10000,
    "agentProcessing": {
      "supervisorDecision": "approved",
      "pricingAnalysis": {...},
      "complianceCheck": {...},
      "customerInsights": {...},
      "confidence": 92
    },
    "aiRecommendations": [...]
  }
}
```

#### Get Invoice

```http
GET /invoices/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "inv-123",
    "invoiceNumber": "INV-2025-001",
    "customerId": "cust-456",
    "customerName": "Acme Corp",
    "status": "sent",
    "totalAmount": 10000,
    "createdAt": "2025-01-30T10:00:00Z"
  }
}
```

#### List Invoices

```http
GET /invoices?page=1&pageSize=20&status=sent
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `status` (optional): Filter by status
- `customerId` (optional): Filter by customer

**Response:**
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "hasMore": true
}
```

#### Update Invoice

```http
PUT /invoices/{id}
```

#### Delete Invoice

```http
DELETE /invoices/{id}
```

#### Send Invoice

```http
POST /invoices/{id}/send
```

#### Mark as Paid

```http
POST /invoices/{id}/mark-paid
```

### Customers

#### Create Customer

```http
POST /customers
```

#### Get Customer

```http
GET /customers/{id}
```

#### List Customers

```http
GET /customers?page=1&pageSize=20
```

#### Update Customer

```http
PUT /customers/{id}
```

#### Delete Customer

```http
DELETE /customers/{id}
```

#### Get Customer Insights

```http
GET /customers/{id}/insights
```

### Agents

#### List Agents

```http
GET /agents
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "supervisor-001",
      "name": "Supervisor Agent",
      "type": "supervisor",
      "status": "processing",
      "currentTask": "Processing invoice INV-2025-045",
      "tasksCompleted": 1247,
      "successRate": 98.5,
      "avgProcessingTime": 2.3
    }
  ]
}
```

#### Get Agent Details

```http
GET /agents/{id}
```

#### Get Agent Performance

```http
GET /agents/performance
```

### Analytics

#### Get Dashboard Metrics

```http
GET /analytics/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 125000,
    "revenueChange": 12.5,
    "outstandingAmount": 45000,
    "outstandingChange": -8.3,
    "averagePaymentDays": 28,
    "paymentDaysChange": -15.2,
    "invoiceCount": 156,
    "invoiceCountChange": 23.1
  }
}
```

#### Get Revenue Data

```http
GET /analytics/revenue?period=month
```

#### Get Payment Trends

```http
GET /analytics/payment-trends?period=month
```

## Error Responses

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

**Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error
