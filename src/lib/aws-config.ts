/**
 * AWS Configuration - Works with LocalStack and Production AWS
 *
 * Environment Variables:
 * - USE_LOCALSTACK=true (dev) or false (production)
 * - LOCALSTACK_ENDPOINT=http://localhost:4566
 * - AWS_REGION=us-east-1
 */

const isLocalStack = process.env.USE_LOCALSTACK === 'true';

export const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',

  // LocalStack-specific configuration
  ...(isLocalStack && {
    endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',

    // Required for LocalStack S3
    forcePathStyle: true,

    // Dummy credentials for LocalStack (not used in production)
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test'
    }
  })

  // Production AWS uses IAM roles (no hardcoded credentials)
};

console.log(`📊 AWS Config: ${isLocalStack ? 'LocalStack' : 'Production AWS'} (${awsConfig.region})`);
