import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';

// This would use @aws-sdk/client-s3 in production
// For MVP, we generate presigned URLs (mock-friendly)

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime',
  'application/pdf',
  'application/zip',
];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

@Injectable()
export class UploadService {
  constructor(private config: ConfigService) {}

  async getPresignedUploadUrl(fileName: string, mimeType: string, folder = 'uploads') {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(`File type ${mimeType} not allowed`);
    }

    const ext = fileName.split('.').pop() || 'bin';
    const key = `${folder}/${uuid()}.${ext}`;
    const bucket = this.config.get('S3_BUCKET', 'collabify');
    const endpoint = this.config.get('S3_ENDPOINT', 'http://localhost:9000');

    // In production, use @aws-sdk/s3-request-presigner
    // For MVP, return a mock URL
    const url = `${endpoint}/${bucket}/${key}`;

    return {
      uploadUrl: url, // Would be presigned PUT URL
      fileUrl: url,
      key,
    };
  }
}
