'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ResumeUpload() {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ filename: string; url: string }>>([]);

  const handleServerSideUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'resume');

      // Upload via API route (file goes through your server)
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`✅ ${file.name} uploaded successfully!`);
        setUploadedFiles(prev => [...prev, { filename: file.name, url: data.url }]);
        setFile(null);

        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        toast.error(`❌ Upload failed: ${data.error}`);
      }

    } catch (error) {
      toast.error('❌ Upload failed. Please try again.');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleClientSideUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      // Step 1: Get presigned URL from backend
      const urlResponse = await fetch(
        `/api/upload?type=resume&filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`
      );
      const { uploadUrl, url } = await urlResponse.json();

      // Step 2: Upload directly to S3 (faster, doesn't go through your server)
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (uploadResponse.ok) {
        toast.success(`✅ ${file.name} uploaded successfully! (Direct to S3)`);
        setUploadedFiles(prev => [...prev, { filename: file.name, url }]);
        setFile(null);

        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        toast.error('❌ Upload failed');
      }

    } catch (error) {
      toast.error('❌ Upload failed. Please try again.');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>📄 Resume Upload Test</CardTitle>
        <CardDescription>
          Test S3 file upload (LocalStack or AWS)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Input */}
        <div>
          <Input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={uploading}
          />
          {file && (
            <p className="text-sm text-muted-foreground mt-2">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {/* Upload Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleServerSideUpload}
            disabled={!file || uploading}
            className="flex-1"
          >
            {uploading ? '⏳ Uploading...' : '📤 Upload (via Server)'}
          </Button>

          <Button
            onClick={handleClientSideUpload}
            disabled={!file || uploading}
            variant="outline"
            className="flex-1"
          >
            {uploading ? '⏳ Uploading...' : '⚡ Upload (Direct to S3)'}
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Server Upload:</strong> File → Your API → S3 (simpler, but slower for large files)</p>
          <p><strong>Direct Upload:</strong> File → S3 directly (faster, recommended for production)</p>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-2">✅ Uploaded Files:</h3>
            <ul className="space-y-1 text-sm">
              {uploadedFiles.map((file, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="font-mono text-xs">{file.filename}</span>
                  <span className="text-muted-foreground text-xs">→ {file.url}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
