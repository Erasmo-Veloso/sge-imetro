import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { DisciplinesModule } from './disciplines/disciplines.module';
import { SelectionProcessesModule } from './selection-processes/selection-processes.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { ClassesModule } from './classes/classes.module';
import { AssessmentPlansModule } from './assessment-plans/assessment-plans.module';
import { GradesModule } from './grades/grades.module';
import { AttendanceModule } from './attendance/attendance.module';
import { PaymentsModule } from './payments/payments.module';
import { AuditModule } from './audit/audit.module';
import { LegacyModule } from './legacy/legacy.module';
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
    StorageModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    DisciplinesModule,
    SelectionProcessesModule,
    EnrollmentsModule,
    RegistrationsModule,
    ClassesModule,
    AssessmentPlansModule,
    GradesModule,
    AttendanceModule,
    PaymentsModule,
    AuditModule,
    LegacyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
