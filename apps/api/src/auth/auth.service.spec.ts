import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { validateEnv } from '../config/env';

describe('AuthService (integration)', () => {
  let moduleRef: TestingModule;
  let auth: AuthService;
  let prisma: PrismaService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validate: (raw) => validateEnv(raw),
          load: [
            () => ({
              DATABASE_URL: process.env.DATABASE_URL,
              JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
              JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
              JWT_ACCESS_TTL: '15m',
              JWT_REFRESH_TTL: '7d',
              BCRYPT_ROUNDS: 4,
            }),
          ],
        }),
        JwtModule.register({ secret: process.env.JWT_ACCESS_SECRET }),
      ],
      providers: [AuthService, PrismaService],
    }).compile();

    auth = moduleRef.get(AuthService);
    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await moduleRef?.close();
  });

  it('should login with valid credentials', async () => {
    const email = `test+sprint1@sg.local`;
    const password = 'Password123!';
    const passwordHash = await bcrypt.hash(password, 4);
    const user = await prisma.user.create({
      data: { name: 'Test Sprint1', email, passwordHash, role: 'ADMIN', status: 'ACTIVE' },
    });

    try {
      const result = await auth.login(email, password);
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(result.user.email).toBe(email);
      expect(result.user.role).toBe('ADMIN');
    } finally {
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  it('should reject login with wrong password', async () => {
    const email = `test+wrong@sg.local`;
    const passwordHash = await bcrypt.hash('Password123!', 4);
    const user = await prisma.user.create({
      data: { name: 'Wrong', email, passwordHash, role: 'STUDENT', status: 'ACTIVE' },
    });

    try {
      await expect(auth.login(email, 'wrong-password')).rejects.toThrow(UnauthorizedException);
    } finally {
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  it('should reject login for inactive user', async () => {
    const email = `test+inactive@sg.local`;
    const passwordHash = await bcrypt.hash('Password123!', 4);
    const user = await prisma.user.create({
      data: { name: 'Inactive', email, passwordHash, role: 'STUDENT', status: 'PENDING' },
    });

    try {
      await expect(auth.login(email, 'Password123!')).rejects.toThrow(UnauthorizedException);
    } finally {
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
});
