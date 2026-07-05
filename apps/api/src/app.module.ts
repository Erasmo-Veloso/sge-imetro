import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { DisciplinesModule } from './disciplines/disciplines.module';
import { validateEnv } from './config/env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (raw) => validateEnv(raw),
      cache: true,
    }),
    PrismaModule,
    MailModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    DisciplinesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
