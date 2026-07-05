import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health() {
    return {
      status: 'ok',
      service: 'sge-api',
      time: new Date().toISOString(),
    };
  }
}
