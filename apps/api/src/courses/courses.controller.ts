import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ParseIdPipe } from '../common/parse-id.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CoursesService } from './courses.service';
import { CreateCourseDto, PaginationDto, UpdateCourseDto } from './dto/course.dto';

@UseGuards(JwtAuthGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get()
  list(@Query() query: PaginationDto) {
    return this.courses.findAll(query);
  }

  @Get(':id')
  show(@Param('id', ParseIdPipe) id: string) {
    return this.courses.findOne(id);
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateCourseDto) {
    return this.courses.create(dto);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id', ParseIdPipe) id: string, @Body() dto: UpdateCourseDto) {
    return this.courses.update(id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id', ParseIdPipe) id: string) {
    await this.courses.remove(id);
  }
}
