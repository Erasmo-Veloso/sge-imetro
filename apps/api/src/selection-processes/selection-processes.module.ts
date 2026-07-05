import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SelectionProcessesController } from './selection-processes.controller';
import { SelectionProcessesService } from './selection-processes.service';

@Module({
  imports: [AuthModule],
  controllers: [SelectionProcessesController],
  providers: [SelectionProcessesService],
  exports: [SelectionProcessesService],
})
export class SelectionProcessesModule {}
