import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UploadService } from './upload.service';

@ApiTags('upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('presign')
  @ApiOperation({ summary: 'Get presigned upload URL' })
  async presign(@Body() body: { fileName: string; mimeType: string; folder?: string }) {
    return this.uploadService.getPresignedUploadUrl(body.fileName, body.mimeType, body.folder);
  }
}
