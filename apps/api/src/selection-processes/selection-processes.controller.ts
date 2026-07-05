import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SelectionProcessesService } from './selection-processes.service';
import {
  CreateSelectionProcessDto,
  PaginationDto,
  UpdateSelectionProcessDto,
} from './dto/selection-process.dto';

@UseGuards(JwtAuthGuard)
@Controller('selection-processes')
export class SelectionProcessesController {
  constructor(private readonly service: SelectionProcessesService) {}

  @Get()
  list(@Query() query: PaginationDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  show(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateSelectionProcessDto) {
    return this.service.create(dto);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSelectionProcessDto) {
    return this.service.update(id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
  }
}
