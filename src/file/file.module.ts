import { Module } from '@nestjs/common';
import { FileProvider } from './file.provider';

@Module({
  providers: [FileProvider],
  exports: [FileProvider]
})
export class FileModule {}
