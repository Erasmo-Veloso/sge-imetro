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
import { UsersService } from './users.service';
import { CreateUserDto, PaginationDto, UpdateUserDto } from './dto/user.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Roles('ADMIN')
  @Get()
  list(@Query() query: PaginationDto) {
    return this.users.findAll(query);
  }

  @Roles('ADMIN')
  @Get(':id')
  show(@Param('id', ParseIdPipe) id: string) {
    return this.users.findOne(id);
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id', ParseIdPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id', ParseIdPipe) id: string) {
    await this.users.remove(id);
  }
}
