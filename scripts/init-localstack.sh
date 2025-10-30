#!/bin/bash
set -e

echo "🚀 Initializing LocalStack for ai-powered-project..."

# Wait for LocalStack to be fully ready
sleep 5

# Create S3 buckets
echo "📦 Creating S3 buckets..."
awslocal s3 mb s3://ai-powered-resumes 2>/dev/null || echo "  ℹ️  Bucket ai-powered-resumes already exists"
awslocal s3 mb s3://ai-powered-documents 2>/dev/null || echo "  ℹ️  Bucket ai-powered-documents already exists"

# Enable versioning (optional - keeps old versions of files)
echo "🔄 Enabling S3 versioning..."
awslocal s3api put-bucket-versioning \
  --bucket ai-powered-resumes \
  --versioning-configuration Status=Enabled 2>/dev/null || echo "  ℹ️  Versioning already enabled"

# Create secrets in Secrets Manager
echo "🔐 Creating secrets..."
awslocal secretsmanager create-secret \
  --name ai-powered-secrets \
  --description "API keys for ai-powered-project" \
  --secret-string "{
    \"CLERK_SECRET_KEY\": \"${CLERK_SECRET_KEY}\",
    \"HUME_API_KEY\": \"${HUME_API_KEY}\",
    \"HUME_SECRET_KEY\": \"${HUME_SECRET_KEY}\",
    \"GEMINI_API_KEY\": \"${GEMINI_API_KEY}\",
    \"ARCJET_KEY\": \"${ARCJET_KEY}\"
  }" 2>/dev/null || echo "  ℹ️  Secret ai-powered-secrets already exists"

echo "✅ LocalStack initialization complete!"
echo ""
echo "📊 Resources created:"
awslocal s3 ls
echo ""
awslocal secretsmanager list-secrets --query 'SecretList[].Name' --output text
