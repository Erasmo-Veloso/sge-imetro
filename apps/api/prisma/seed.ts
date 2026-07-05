import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sge.local' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@sge.local',
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@sge.local' },
    update: {},
    create: {
      name: 'Docente Exemplo',
      email: 'teacher@sge.local',
      passwordHash,
      role: UserRole.TEACHER,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.user.upsert({
    where: { email: 'student@sge.local' },
    update: {},
    create: {
      name: 'Estudante Exemplo',
      email: 'student@sge.local',
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    },
  });

  const course = await prisma.course.upsert({
    where: { code: 'ENG-INF' },
    update: {},
    create: {
      name: 'Engenharia Informática',
      code: 'ENG-INF',
      description: 'Curso de Engenharia Informática — exemplo',
      durationYears: 3,
      coordinatorId: teacher.id,
      status: 'ACTIVE',
    },
  });

  const disciplines = [
    { name: 'Programação I', code: 'PROG1', credits: 4, workloadHrs: 60, semester: 1 },
    { name: 'Matemática Discreta', code: 'MD', credits: 4, workloadHrs: 60, semester: 1 },
    { name: 'Estruturas de Dados', code: 'ED', credits: 4, workloadHrs: 60, semester: 2 },
    { name: 'Bases de Dados', code: 'BD', credits: 4, workloadHrs: 60, semester: 2 },
    { name: 'Engenharia de Software', code: 'ES', credits: 4, workloadHrs: 60, semester: 3 },
  ];

  for (const d of disciplines) {
    await prisma.discipline.upsert({
      where: { courseId_code: { courseId: course.id, code: d.code } },
      update: {},
      create: { courseId: course.id, ...d },
    });
  }

  // eslint-disable-next-line no-console
  console.log('✅ Seed completed:');
  console.log('   Users: admin@/teacher@/student@sge.local (pwd: Password123!)');
  console.log(`   Course: ${course.name} (${course.code}) with ${disciplines.length} disciplines`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
