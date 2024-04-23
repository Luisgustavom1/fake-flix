import { Module } from '@nestjs/common';
import { ContentController } from './http/rest/controller/content.controller';
import { PrismaService } from './persistence/prisma/prisma.service';
import { ContentManagementService } from './core/content-management.service';
import { MediaPlayerService } from './core/media-player.service';

@Module({
  imports: [],
  controllers: [ContentController],
  providers: [PrismaService, ContentManagementService, MediaPlayerService],
})
export class AppModule {}
