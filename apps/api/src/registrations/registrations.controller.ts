import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto, PaginationDto } from './dto/registration.dto';

@UseGuards(JwtAuthGuard)
@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrations: RegistrationsService) {}

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.registrations.findByStudent(user.id);
  }

  @Get()
  list(@Query() query: PaginationDto) {
    return this.registrations.findAll(query);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRegistrationDto) {
    return this.registrations.create(user.id, dto);
  }

  @Delete(':id')
  async cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    await this.registrations.cancel(id, user.id, user.role);
  }
}
