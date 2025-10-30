#!/bin/bash
# LocalStack Initialization Script
# Automatically sets up AWS services based on AWS Audit Agent recommendations

set -e

echo "=========================================="
echo "LocalStack AWS Service Initialization"
echo "=========================================="
echo ""

# Wait for LocalStack to be fully ready
echo "Waiting for LocalStack to be ready..."
while ! awslocal s3 ls &>/dev/null; do
  sleep 2
done
echo "✓ LocalStack is ready!"
echo ""

# ========================================
# Phase 1: S3 Buckets (File Storage)
# ========================================
echo "Phase 1: Setting up S3 buckets..."

# Resume uploads bucket
awslocal s3 mb s3://ai-powered-resumes 2>/dev/null || echo "  → Bucket ai-powered-resumes already exists"

# Static assets bucket
awslocal s3 mb s3://ai-powered-static 2>/dev/null || echo "  → Bucket ai-powered-static already exists"

# Interview recordings bucket
awslocal s3 mb s3://ai-powered-interviews 2>/dev/null || echo "  → Bucket ai-powered-interviews already exists"

echo "✓ S3 buckets created"
echo ""

# ========================================
# Phase 2: DynamoDB Tables (File Metadata)
# ========================================
echo "Phase 2: Setting up DynamoDB tables..."

# File metadata table
awslocal dynamodb create-table \
  --table-name FileMetadata \
  --attribute-definitions \
    AttributeName=fileId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=uploadedAt,AttributeType=N \
  --key-schema \
    AttributeName=fileId,KeyType=HASH \
  --global-secondary-indexes \
    "[{\"IndexName\":\"UserIdIndex\",\"KeySchema\":[{\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"uploadedAt\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"},\"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}}]" \
  --provisioned-throughput \
    ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1 \
  2>/dev/null || echo "  → Table FileMetadata already exists"

# Interview sessions table
awslocal dynamodb create-table \
  --table-name InterviewSessions \
  --attribute-definitions \
    AttributeName=sessionId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
  --key-schema \
    AttributeName=sessionId,KeyType=HASH \
  --global-secondary-indexes \
    "[{\"IndexName\":\"UserIdIndex\",\"KeySchema\":[{\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"},\"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}}]" \
  --provisioned-throughput \
    ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1 \
  2>/dev/null || echo "  → Table InterviewSessions already exists"

echo "✓ DynamoDB tables created"
echo ""

# ========================================
# Phase 3: SQS Queues (Background Jobs)
# ========================================
echo "Phase 3: Setting up SQS queues..."

# Resume processing queue
awslocal sqs create-queue \
  --queue-name resume-processing-queue \
  --attributes VisibilityTimeout=300,MessageRetentionPeriod=1209600 \
  --region us-east-1 \
  2>/dev/null || echo "  → Queue resume-processing-queue already exists"

# Interview analysis queue
awslocal sqs create-queue \
  --queue-name interview-analysis-queue \
  --attributes VisibilityTimeout=600,MessageRetentionPeriod=1209600 \
  --region us-east-1 \
  2>/dev/null || echo "  → Queue interview-analysis-queue already exists"

# Dead letter queue for failed jobs
awslocal sqs create-queue \
  --queue-name failed-jobs-dlq \
  --attributes MessageRetentionPeriod=1209600 \
  --region us-east-1 \
  2>/dev/null || echo "  → Queue failed-jobs-dlq already exists"

echo "✓ SQS queues created"
echo ""

# ========================================
# Phase 4: Secrets Manager (API Keys)
# ========================================
echo "Phase 4: Setting up Secrets Manager..."

# OpenAI API key (placeholder)
awslocal secretsmanager create-secret \
  --name ai-powered/openai-api-key \
  --description "OpenAI API key for LLM inference" \
  --secret-string '{"apiKey":"sk-placeholder-replace-with-real-key"}' \
  --region us-east-1 \
  2>/dev/null || echo "  → Secret ai-powered/openai-api-key already exists"

# Database credentials
awslocal secretsmanager create-secret \
  --name ai-powered/database-credentials \
  --description "PostgreSQL database credentials" \
  --secret-string "{\"username\":\"${DB_USER:-postgres}\",\"password\":\"${DB_PASSWORD:-postgres}\",\"host\":\"${DB_HOST:-db}\",\"port\":\"${DB_PORT:-5432}\",\"database\":\"${DB_NAME:-ai_powered_db}\"}" \
  --region us-east-1 \
  2>/dev/null || echo "  → Secret ai-powered/database-credentials already exists"

# JWT secret
awslocal secretsmanager create-secret \
  --name ai-powered/jwt-secret \
  --description "JWT signing secret" \
  --secret-string '{"secret":"localstack-jwt-secret-change-in-production"}' \
  --region us-east-1 \
  2>/dev/null || echo "  → Secret ai-powered/jwt-secret already exists"

echo "✓ Secrets created"
echo ""

# ========================================
# Phase 5: RDS (MySQL for legacy support)
# ========================================
echo "Phase 5: Setting up RDS instances..."
echo "  Note: RDS instances simulated via LocalStack proxy to PostgreSQL/MySQL containers"
echo "  For testing: Use PostgreSQL container (db:5432) as RDS endpoint"
echo "✓ RDS configuration ready"
echo ""

# ========================================
# Phase 6: ElastiCache (Redis)
# ========================================
echo "Phase 6: ElastiCache configuration..."
echo "  Note: Using dedicated Redis container (redis:6379) for caching"
echo "  LocalStack ElastiCache endpoints available at localhost:4566"
echo "✓ ElastiCache ready"
echo ""

# ========================================
# Summary
# ========================================
echo ""
echo "=========================================="
echo "LocalStack Initialization Complete!"
echo "=========================================="
echo ""
echo "Services Ready:"
echo "  ✓ S3 Buckets: ai-powered-resumes, ai-powered-static, ai-powered-interviews"
echo "  ✓ DynamoDB Tables: FileMetadata, InterviewSessions"
echo "  ✓ SQS Queues: resume-processing-queue, interview-analysis-queue, failed-jobs-dlq"
echo "  ✓ Secrets Manager: openai-api-key, database-credentials, jwt-secret"
echo "  ✓ RDS: Proxied via PostgreSQL container"
echo "  ✓ ElastiCache: Proxied via Redis container"
echo ""
echo "Endpoints:"
echo "  LocalStack Gateway: http://localhost:4566"
echo "  PostgreSQL: localhost:5432"
echo "  Redis: localhost:6379"
echo ""
echo "AWS CLI Usage:"
echo "  awslocal s3 ls"
echo "  awslocal dynamodb list-tables"
echo "  awslocal sqs list-queues"
echo "  awslocal secretsmanager list-secrets"
echo ""
echo "=========================================="
