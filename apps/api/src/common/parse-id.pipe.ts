import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseIdPipe implements PipeTransform<string> {
  transform(value: string): string {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException('ID inválido');
    }
    return value.trim();
  }
}
