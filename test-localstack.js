#!/usr/bin/env node
/**
 * LocalStack Connectivity Test
 * Verifies the application can connect to LocalStack and perform AWS operations
 */

const { S3Client, PutObjectCommand, ListBucketsCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

// Load environment variables
require('dotenv').config();

const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
  }
};

async function testS3() {
  console.log('\n🪣 Testing S3...');
  const s3 = new S3Client(awsConfig);

  try {
    // List buckets
    const listBuckets = await s3.send(new ListBucketsCommand({}));
    console.log('  ✅ S3 connection successful');
    console.log(`  ✅ Found ${listBuckets.Buckets.length} buckets:`);
    listBuckets.Buckets.forEach(bucket => {
      console.log(`     - ${bucket.Name}`);
    });

    // Upload test file
    const testData = JSON.stringify({
      test: 'LocalStack S3 connectivity test',
      timestamp: new Date().toISOString()
    });

    await s3.send(new PutObjectCommand({
      Bucket: 'ai-powered-resumes',
      Key: 'test/connectivity-test.json',
      Body: testData,
      ContentType: 'application/json'
    }));
    console.log('  ✅ Test file uploaded to ai-powered-resumes/test/connectivity-test.json');

    return true;
  } catch (error) {
    console.error('  ❌ S3 test failed:', error.message);
    return false;
  }
}

async function testDynamoDB() {
  console.log('\n🗄️  Testing DynamoDB...');
  const dynamodb = new DynamoDBClient(awsConfig);

  try {
    // Put test item
    const testUser = {
      userId: { S: `test-user-${Date.now()}` },
      email: { S: 'test@localstack.test' },
      name: { S: 'LocalStack Test User' },
      createdAt: { S: new Date().toISOString() }
    };

    await dynamodb.send(new PutItemCommand({
      TableName: 'Users',
      Item: testUser
    }));
    console.log('  ✅ DynamoDB connection successful');
    console.log('  ✅ Test user created');

    // Scan users table
    const scanResult = await dynamodb.send(new ScanCommand({
      TableName: 'Users',
      Limit: 5
    }));
    console.log(`  ✅ Users table scan successful (${scanResult.Count} items found)`);

    return true;
  } catch (error) {
    console.error('  ❌ DynamoDB test failed:', error.message);
    return false;
  }
}

async function testSecretsManager() {
  console.log('\n🔐 Testing Secrets Manager...');
  const secretsManager = new SecretsManagerClient(awsConfig);

  try {
    // Get a secret
    const secret = await secretsManager.send(new GetSecretValueCommand({
      SecretId: 'clerk-secret-key'
    }));
    console.log('  ✅ Secrets Manager connection successful');
    console.log('  ✅ Retrieved secret: clerk-secret-key');
    console.log(`  ℹ️  Secret ARN: ${secret.ARN}`);

    return true;
  } catch (error) {
    console.error('  ❌ Secrets Manager test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 LocalStack Connectivity Test');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\nEndpoint: ${awsConfig.endpoint}`);
  console.log(`Region: ${awsConfig.region}`);

  const results = {
    s3: await testS3(),
    dynamodb: await testDynamoDB(),
    secretsManager: await testSecretsManager()
  };

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 Test Results Summary');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`S3:              ${results.s3 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`DynamoDB:        ${results.dynamodb ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Secrets Manager: ${results.secretsManager ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(r => r === true);

  if (allPassed) {
    console.log('\n🎉 All tests passed! Application is ready to use LocalStack.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check LocalStack configuration.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
