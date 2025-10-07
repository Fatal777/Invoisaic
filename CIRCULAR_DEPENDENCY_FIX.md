# Circular Dependency Fix - CDK API Gateway Issue

## Problem
CDK creates circular dependencies when there are many API Gateway routes with Lambda integrations.

## Quick Solution Options

### Option 1: Deploy Without New Routes (Fastest)
Temporarily comment out the new agent-monitor and architecture routes, deploy, then add them back.

### Option 2: Use Lambda Proxy+ (Recommended)
Instead of individual routes, use `{proxy+}` to handle all routes in Lambda code.

### Option 3: Split into Multiple Stacks
Create separate stacks for different API sections.

---

## Recommended Fix: Simplify API Structure

The issue is we have **40+ API routes** which creates complex dependencies. 

**Solution:** Use proxy integration for new endpoints.

Replace these routes:
```typescript
// Instead of 10 individual routes:
const agentsMonitor = api.root.addResource('agents-monitor');
const agentStatusResource = agentsMonitor.addResource('status');
// ... etc

// Use proxy:
const agentsMonitor = api.root.addResource('agents-monitor');
const agentsMonitorProxy = agentsMonitor.addResource('{proxy+}');
agentsMonitorProxy.addMethod('ANY', new apigateway.LambdaIntegration(agentStatusFunction));
```

This reduces routes from 40+ to 25, breaking the circular dependency.

---

## Immediate Workaround

If you need to deploy NOW for the hackathon:

1. **Comment out new routes** (lines 540-573 in invoisaic-stack.ts)
2. Deploy the stack
3. Your existing API will work
4. Add new routes after hackathon

The frontend will still work, but Agent Theater and Architecture View will use mock data (which they already do for demos).

---

## For Production

After hackathon, implement proper fix:
1. Use API Gateway HTTP API (v2) instead of REST API
2. Split into microservices with separate APIs
3. Use Lambda proxy integration for dynamic routes

---

**Current Status:** Destroying existing stack to deploy fresh
