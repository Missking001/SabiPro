import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { SupabaseService } from '../common/supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

interface UploadFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_PORTFOLIO_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_PORTFOLIO_COUNT = 6;

@Controller('api/uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  private readonly logger = new Logger(UploadsController.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  private validateFile(file: UploadFile | undefined, maxSize: number, label: string) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `${label} must be JPG, PNG, or WebP. Received: ${file.mimetype}`,
      );
    }
    if (file.size > maxSize) {
      const maxMb = maxSize / (1024 * 1024);
      throw new BadRequestException(`${label} must be under ${maxMb}MB`);
    }
  }

  private generateFilePath(userId: string, prefix: string, ext: string): string {
    const rand = crypto.randomBytes(8).toString('hex');
    return `${prefix}/${userId}/${rand}.${ext}`;
  }

  private getExtension(mime: string): string {
    switch (mime) {
      case 'image/jpeg': return 'jpg';
      case 'image/png': return 'png';
      case 'image/webp': return 'webp';
      default: return 'jpg';
    }
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: UploadFile,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.validateFile(file, MAX_AVATAR_SIZE, 'Avatar');

    try {
      const ext = this.getExtension(file.mimetype);
      const path = this.generateFilePath(user.userId, 'avatars', ext);

      const url = await this.supabase.upload('sabipro', path, file.buffer, file.mimetype);

      await this.prisma.user.update({
        where: { id: user.userId },
        data: { avatarUrl: url },
      });

      this.logger.log(`Avatar uploaded for user ${user.userId}`);
      return { url };
    } catch (err: any) {
      this.logger.error(`Avatar upload failed: ${err.message}`);
      throw new InternalServerErrorException(
        err.message || 'Failed to upload avatar. Please try again.',
      );
    }
  }

  @Post('portfolio')
  @UseInterceptors(FilesInterceptor('files', MAX_PORTFOLIO_COUNT))
  async uploadPortfolio(
    @UploadedFiles() files: UploadFile[],
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    for (const file of files) {
      this.validateFile(file, MAX_PORTFOLIO_SIZE, 'Portfolio photo');
    }

    if (files.length > MAX_PORTFOLIO_COUNT) {
      throw new BadRequestException(`Maximum ${MAX_PORTFOLIO_COUNT} photos allowed at once`);
    }

    try {
      const urls: string[] = [];

      for (const file of files) {
        const ext = this.getExtension(file.mimetype);
        const path = this.generateFilePath(user.userId, 'portfolio', ext);
        const url = await this.supabase.upload('sabipro', path, file.buffer, file.mimetype);
        urls.push(url);
      }

      // Append to provider portfolio if profile exists, otherwise just return URLs
      const provider = await this.prisma.provider.findUnique({
        where: { userId: user.userId },
        select: { id: true, portfolioUrls: true },
      });

      if (provider) {
        const combined = [...provider.portfolioUrls, ...urls];
        if (combined.length > MAX_PORTFOLIO_COUNT) {
          // Cleanup excess uploaded files
          for (const url of urls) {
            try {
              const parts = new URL(url).pathname.split('/');
              const filePath = parts.slice(4).join('/');
              await this.supabase.delete('sabipro', `${filePath}`);
            } catch { /* ignore */ }
          }
          throw new BadRequestException(
            `You can have at most ${MAX_PORTFOLIO_COUNT} portfolio photos. You currently have ${provider.portfolioUrls.length}.`,
          );
        }

        await this.prisma.provider.update({
          where: { id: provider.id },
          data: { portfolioUrls: combined },
        });
      }

      this.logger.log(`${urls.length} portfolio photos uploaded for user ${user.userId}`);
      return { urls };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`Portfolio upload failed: ${err.message}`);
      throw new InternalServerErrorException(
        err.message || 'Failed to upload portfolio photos. Please try again.',
      );
    }
  }
}
