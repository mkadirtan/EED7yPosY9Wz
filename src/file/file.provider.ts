import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FileProvider {
  constructor(private readonly configService: ConfigService) {}

  public getFileUrl(filename: string) {
    return this.configService.get('HOST') + '/' + filename;
  }
}
