#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InvoisaicStack } from '../lib/invoisaic-stack';

const app = new cdk.App();

const environment = app.node.tryGetContext('environment') || 'dev';

new InvoisaicStack(app, `InvoisaicStack-${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '202533497839',
    region: process.env.CDK_DEFAULT_REGION || 'ap-south-1',
  },
  environment,
  description: 'Invoisaic - AI-Powered Invoice Automation Platform (AWS AI Agent Hackathon 2025)',
  tags: {
    Project: 'Invoisaic',
    Environment: environment,
    Hackathon: 'AWS-AI-Agent-2025',
    ManagedBy: 'CDK',
  },
});
