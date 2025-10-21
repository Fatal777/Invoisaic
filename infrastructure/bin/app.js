#!/usr/bin/env node
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
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const invoisaic_stack_1 = require("../lib/invoisaic-stack");
const app = new cdk.App();
const environment = app.node.tryGetContext('environment') || 'dev';
new invoisaic_stack_1.InvoisaicStack(app, `InvoisaicStack-${environment}`, {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUFxQztBQUNyQyxpREFBbUM7QUFDbkMsNERBQXdEO0FBRXhELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEtBQUssQ0FBQztBQUVuRSxJQUFJLGdDQUFjLENBQUMsR0FBRyxFQUFFLGtCQUFrQixXQUFXLEVBQUUsRUFBRTtJQUN2RCxHQUFHLEVBQUU7UUFDSCxPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsSUFBSSxjQUFjO1FBQzFELE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLFlBQVk7S0FDdkQ7SUFDRCxXQUFXO0lBQ1gsV0FBVyxFQUFFLGtGQUFrRjtJQUMvRixJQUFJLEVBQUU7UUFDSixPQUFPLEVBQUUsV0FBVztRQUNwQixXQUFXLEVBQUUsV0FBVztRQUN4QixTQUFTLEVBQUUsbUJBQW1CO1FBQzlCLFNBQVMsRUFBRSxLQUFLO0tBQ2pCO0NBQ0YsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuaW1wb3J0ICdzb3VyY2UtbWFwLXN1cHBvcnQvcmVnaXN0ZXInO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IEludm9pc2FpY1N0YWNrIH0gZnJvbSAnLi4vbGliL2ludm9pc2FpYy1zdGFjayc7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbmNvbnN0IGVudmlyb25tZW50ID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW52aXJvbm1lbnQnKSB8fCAnZGV2JztcblxubmV3IEludm9pc2FpY1N0YWNrKGFwcCwgYEludm9pc2FpY1N0YWNrLSR7ZW52aXJvbm1lbnR9YCwge1xuICBlbnY6IHtcbiAgICBhY2NvdW50OiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5UIHx8ICcyMDI1MzM0OTc4MzknLFxuICAgIHJlZ2lvbjogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfUkVHSU9OIHx8ICdhcC1zb3V0aC0xJyxcbiAgfSxcbiAgZW52aXJvbm1lbnQsXG4gIGRlc2NyaXB0aW9uOiAnSW52b2lzYWljIC0gQUktUG93ZXJlZCBJbnZvaWNlIEF1dG9tYXRpb24gUGxhdGZvcm0gKEFXUyBBSSBBZ2VudCBIYWNrYXRob24gMjAyNSknLFxuICB0YWdzOiB7XG4gICAgUHJvamVjdDogJ0ludm9pc2FpYycsXG4gICAgRW52aXJvbm1lbnQ6IGVudmlyb25tZW50LFxuICAgIEhhY2thdGhvbjogJ0FXUy1BSS1BZ2VudC0yMDI1JyxcbiAgICBNYW5hZ2VkQnk6ICdDREsnLFxuICB9LFxufSk7XG4iXX0=