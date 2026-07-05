import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = moduleRef.get(AppController);
  });

  describe('health', () => {
    it('should return ok status', () => {
      const result = appController.health();
      expect(result.status).toBe('ok');
      expect(result.service).toBe('sge-api');
    });
  });
});
