import { ContentModule } from '@contentModule/content.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [ContentModule],
})
export class AppModule {}
