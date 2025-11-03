#!/bin/bash

# LocalStack Initialization Script
# Auto-creates AWS resources when LocalStack starts
# This runs after all LocalStack services are ready

set -e

echo "🚀 Initializing AWS resources in LocalStack..."

# Configuration
REGION="us-east-1"
BUCKET_NAME="ai-powered-resumes"
TABLE_NAME="Users"

# S3: Create buckets
echo "📦 Creating S3 bucket: $BUCKET_NAME"
awslocal s3 mb s3://$BUCKET_NAME 2>/dev/null || echo "  Bucket already exists"

# S3: Enable versioning
awslocal s3api put-bucket-versioning \
  --bucket $BUCKET_NAME \
  --versioning-configuration Status=Enabled

# S3: Add CORS configuration
awslocal s3api put-bucket-cors \
  --bucket $BUCKET_NAME \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["http://localhost:3000", "http://127.0.0.1:3000"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }]
  }'

echo "  ✅ S3 bucket configured"

# DynamoDB: Create Users table
echo "🗄️  Creating DynamoDB table: $TABLE_NAME"
awslocal dynamodb create-table \
  --table-name $TABLE_NAME \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION 2>/dev/null || echo "  Table already exists"

echo "  ✅ DynamoDB table created"

# Secrets Manager: Store secrets
echo "🔐 Creating secrets in Secrets Manager"

# Store Clerk secret
if [ -n "$CLERK_SECRET_KEY" ]; then
  awslocal secretsmanager create-secret \
    --name clerk-secret-key \
    --secret-string "$CLERK_SECRET_KEY" \
    --region $REGION 2>/dev/null || \
  awslocal secretsmanager update-secret \
    --secret-id clerk-secret-key \
    --secret-string "$CLERK_SECRET_KEY" \
    --region $REGION
  echo "  ✅ Clerk secret stored"
fi

# Store Hume API key
if [ -n "$HUME_API_KEY" ]; then
  awslocal secretsmanager create-secret \
    --name hume-api-key \
    --secret-string "$HUME_API_KEY" \
    --region $REGION 2>/dev/null || \
  awslocal secretsmanager update-secret \
    --secret-id hume-api-key \
    --secret-string "$HUME_API_KEY" \
    --region $REGION
  echo "  ✅ Hume API key stored"
fi

# SQS: Create queues
echo "📬 Creating SQS queues"
awslocal sqs create-queue \
  --queue-name resume-processing-queue \
  --region $REGION 2>/dev/null || echo "  Queue already exists"

echo "  ✅ SQS queue created"

# Lambda: Upload function (if exists)
if [ -f "/etc/localstack/init/lambda-resume-parser.zip" ]; then
  echo "⚡ Deploying Lambda function"
  awslocal lambda create-function \
    --function-name resume-parser \
    --runtime nodejs18.x \
    --handler index.handler \
    --zip-file fileb:///etc/localstack/init/lambda-resume-parser.zip \
    --role arn:aws:iam::000000000000:role/lambda-role \
    --region $REGION 2>/dev/null || echo "  Function already exists"
  echo "  ✅ Lambda function deployed"
fi

echo "✅ All AWS resources initialized successfully!"
echo ""
echo "📊 Resource Summary:"
echo "  S3 Buckets: $BUCKET_NAME"
echo "  DynamoDB Tables: $TABLE_NAME"
echo "  SQS Queues: resume-processing-queue"
echo "  Secrets: clerk-secret-key, hume-api-key"
echo ""
echo "🔗 LocalStack Endpoint: http://localhost:4566"
echo "🌐 Health Check: http://localhost:4566/_localstack/health"
