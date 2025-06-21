import { GetStreamingURLUseCase } from '@contentModule/catalog/core/use-case/get-streaming-url.use-case';
import { MediaPlayerController } from '@contentModule/catalog/http/rest/controller/media-player.controller';
import { ContentSharedModule } from '@contentModule/shared/content-shared.module';
import { Module } from '@nestjs/common';
import { AuthModule } from '@sharedModule/auth/auth.module';
import { ConfigModule } from '@sharedModule/config/config.module';
import { HttpClientModule } from '@sharedModule/http/client/http-client.module';
import { LoggerModule } from '@sharedModule/logger/logger.module';

@Module({
  imports: [
    ContentSharedModule,
    LoggerModule,
    HttpClientModule,
    ConfigModule.forRoot(),
    AuthModule,
  ],
  providers: [GetStreamingURLUseCase],
  controllers: [MediaPlayerController],
})
export class ContentCatalogModule {}
