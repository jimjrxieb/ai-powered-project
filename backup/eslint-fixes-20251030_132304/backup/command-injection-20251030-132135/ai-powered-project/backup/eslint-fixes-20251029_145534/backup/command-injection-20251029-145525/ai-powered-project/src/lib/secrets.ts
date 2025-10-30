import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { awsConfig } from './aws-config';

/**
 * Secrets Manager Client
 *
 * Retrieves API keys from AWS Secrets Manager (or falls back to .env)
 */

const client = new SecretsManagerClient(awsConfig);

// Cache secrets in memory (avoid repeated API calls)
let secretsCache: Record<string, string> | null = null;

/**
 * Get all secrets from Secrets Manager
 *
 * Falls back to process.env if Secrets Manager fails
 */
export async function getSecrets(): Promise<Record<string, string>> {
  // Return cached secrets
  if (secretsCache) {
    return secretsCache;
  }

  // Try Secrets Manager if enabled
  if (process.env.USE_SECRETS_MANAGER === 'true') {
    try {
      const result = await client.send(new GetSecretValueCommand({
        SecretId: process.env.SECRETS_MANAGER_NAME || 'ai-powered-secrets'
      }));

      secretsCache = JSON.parse(result.SecretString || '{}');
      console.log('✅ Loaded secrets from Secrets Manager');
      return secretsCache;
    } catch (error) {
      console.warn('⚠️  Secrets Manager failed, using .env fallback:', error);
    }
  }

  // Fallback to .env
  secretsCache = {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',
    HUME_API_KEY: process.env.HUME_API_KEY || '',
    HUME_SECRET_KEY: process.env.HUME_SECRET_KEY || '',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    ARCJET_KEY: process.env.ARCJET_KEY || ''
  };

  return secretsCache;
}

/**
 * Get a single secret by key
 */
export async function getSecret(key: string): Promise<string> {
  const secrets = await getSecrets();
  return secrets[key] || '';
}

/**
 * Clear secrets cache
 *
 * Call this after rotating secrets in AWS
 */
export function clearSecretsCache() {
  secretsCache = null;
}
