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
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@UseGuards(JwtAuthGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classes: ClassesService) {}

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateClassDto) {
    return this.classes.create(dto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('year') year?: string,
  ) {
    return this.classes.findAll({
      page: page ? +page : undefined,
      pageSize: pageSize ? +pageSize : undefined,
      search,
      year: year ? +year : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: string) {
    return this.classes.findOne(id);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id', ParseIdPipe) id: string, @Body() dto: UpdateClassDto) {
    return this.classes.update(id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id', ParseIdPipe) id: string) {
    await this.classes.remove(id);
  }
}
