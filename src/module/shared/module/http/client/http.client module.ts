import { Module } from '@nestjs/common';
import { HttpClient } from './http.client';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [HttpClient],
  exports: [HttpClient],
})
export class HttpClientModule {}
