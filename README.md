This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## GP-Copilot Security Assessment & LocalStack Deployment

**Date**: November 3, 2025
**Status**: ✅ Deployed & Operational

### Phase 1: Infrastructure Assessment
- **Fixed**: Corrupted docker-compose.localstack.yml (broken by previous AI fixes)
- **Created**: LocalStack initialization scripts with automatic resource provisioning
- **Security**: Applied hardening (no-new-privileges, localhost-only binding)
- **Dependencies**: Installed missing AWS SDK packages (@aws-sdk/client-dynamodb, dotenv)

### Phase 2: Security Scanning
- **npm audit**: 6 moderate vulnerabilities identified (acceptable for dev, transitive dependencies)
- **Infrastructure**: Validated YAML configuration, verified service health checks
- **Created**: AWS audit capability for GP-Copilot to detect service usage patterns

### Phase 3: LocalStack Deployment
Successfully deployed local AWS environment with **8 services**:

**Storage & Data**:
- **S3** (instead of local filesystem) - 3 buckets for resumes, static assets, interviews
- **DynamoDB** (instead of PostgreSQL for some features) - 3 tables (Users, FileMetadata, InterviewSessions)
- **Secrets Manager** (instead of .env for sensitive data) - 5 secrets (Clerk, Hume AI, OpenAI, DB, JWT)

**Compute & Messaging**:
- **Lambda** - Serverless function execution
- **SQS** - 3 queues (resume-processing, interview-analysis, failed-jobs-dlq)
- **DynamoDB Streams** - Change data capture
- **Kinesis** - Real-time data streaming
- **STS** - Security token service

### Verification Results
```
✅ S3 Connection: 3 buckets created, file upload successful
✅ DynamoDB Connection: 3 tables created, read/write operations verified
✅ Secrets Manager: 5 secrets stored, retrieval successful
✅ All connectivity tests passed
```

### Quick Start with LocalStack
```bash
# Start LocalStack
docker-compose -f docker-compose.localstack.yml up -d

# Verify services
node test-localstack.js

# Start development
npm run dev
```

### Documentation
- [DEPLOYMENT-SUCCESS.md](DEPLOYMENT-SUCCESS.md) - Complete deployment summary
- [LOCALSTACK-DEPLOYMENT-COMPLETE.md](LOCALSTACK-DEPLOYMENT-COMPLETE.md) - Comprehensive guide
- [test-localstack.js](test-localstack.js) - Connectivity test suite

**Endpoint**: http://localhost:4566 | **Region**: us-east-1 | **Credentials**: test/test
