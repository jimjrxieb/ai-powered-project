import { ResumeUpload } from '@/components/ResumeUpload';

export default function TestUploadPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">S3 Upload Test</h1>
          <p className="text-muted-foreground">
            Testing LocalStack S3 integration
          </p>
        </div>

        <ResumeUpload />

        <div className="max-w-2xl w-full border rounded-lg p-6 bg-muted/30">
          <h2 className="font-semibold mb-3">📋 Setup Status:</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>LocalStack running on port 4566</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>S3 buckets created (ai-powered-resumes, ai-powered-documents)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>AWS SDK installed (@aws-sdk/client-s3)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Upload API route created (/api/upload)</span>
            </li>
          </ul>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded text-xs">
            <p className="font-semibold mb-1">💡 Next Steps:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Upload a test file using either method</li>
              <li>Check docker logs: <code className="bg-white dark:bg-black px-1 rounded">docker logs ai-powered-localstack</code></li>
              <li>Verify in S3: <code className="bg-white dark:bg-black px-1 rounded">awslocal s3 ls s3://ai-powered-resumes/ --recursive</code></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
