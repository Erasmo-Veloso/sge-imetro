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
import { DisciplinesService } from './disciplines.service';
import { CreateDisciplineDto, PaginationDto, UpdateDisciplineDto } from './dto/discipline.dto';

@UseGuards(JwtAuthGuard)
@Controller('disciplines')
export class DisciplinesController {
  constructor(private readonly disciplines: DisciplinesService) {}

  @Get()
  list(@Query() query: PaginationDto) {
    return this.disciplines.findAll(query);
  }

  @Get(':id')
  show(@Param('id', ParseUUIDPipe) id: string) {
    return this.disciplines.findOne(id);
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateDisciplineDto) {
    return this.disciplines.create(dto);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDisciplineDto) {
    return this.disciplines.update(id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.disciplines.remove(id);
  }
}
