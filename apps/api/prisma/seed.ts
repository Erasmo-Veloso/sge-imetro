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

  const student = await prisma.user.upsert({
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

  const disciplinesData = [
    { name: 'Programação I', code: 'PROG1', credits: 4, workloadHrs: 60, semester: 1 },
    { name: 'Matemática Discreta', code: 'MD', credits: 4, workloadHrs: 60, semester: 1 },
    { name: 'Estruturas de Dados', code: 'ED', credits: 4, workloadHrs: 60, semester: 2 },
    { name: 'Bases de Dados', code: 'BD', credits: 4, workloadHrs: 60, semester: 2 },
    { name: 'Engenharia de Software', code: 'ES', credits: 4, workloadHrs: 60, semester: 3 },
  ];

  const disciplines = [];
  for (const d of disciplinesData) {
    const disc = await prisma.discipline.upsert({
      where: { courseId_code: { courseId: course.id, code: d.code } },
      update: {},
      create: { courseId: course.id, ...d },
    });
    disciplines.push(disc);
  }

  // Turmas 2026/1º semestre para as 3 primeiras disciplinas
  const classes = [];
  for (let i = 0; i < 3; i++) {
    const cls = await prisma.class.upsert({
      where: {
        disciplineId_year_period: { disciplineId: disciplines[i].id, year: 2026, period: 'FIRST' },
      },
      update: {},
      create: {
        disciplineId: disciplines[i].id,
        teacherId: teacher.id,
        year: 2026,
        period: 'FIRST',
        capacity: 40,
        schedule: ['Seg/Qua 10:00-12:00', 'Ter/Qui 08:00-10:00', 'Sex 14:00-17:00'][i],
        room: ['B301', 'B205', 'Lab-1'][i],
      },
    });
    classes.push(cls);
  }

  // Plano de avaliação para a primeira turma (Programação I)
  const plan = await prisma.assessmentPlan.upsert({
    where: { classId: classes[0].id },
    update: {},
    create: {
      classId: classes[0].id,
      scaleMax: 20,
      passingScore: 10,
      minAttendancePct: 70,
      roundingRule: 'ROUND',
      items: {
        create: [
          { type: 'FREQUENCY', name: 'Frequência', weight: 20, maxScore: 20, order: 0 },
          { type: 'TEST', name: 'Teste 1', weight: 20, maxScore: 20, order: 1 },
          { type: 'TEST', name: 'Teste 2', weight: 20, maxScore: 20, order: 2 },
          { type: 'PROJECT', name: 'Projeto', weight: 25, maxScore: 20, order: 3 },
          { type: 'EXAM', name: 'Exame Final', weight: 15, maxScore: 20, order: 4 },
        ],
      },
    },
  });

  // Matrícula do estudante na primeira turma
  const registration = await prisma.registration.upsert({
    where: {
      studentId_classId_academicYear: {
        studentId: student.id,
        classId: classes[0].id,
        academicYear: 2026,
      },
    },
    update: {},
    create: {
      studentId: student.id,
      classId: classes[0].id,
      academicYear: 2026,
      status: 'ACTIVE',
    },
  });

  // Notas de exemplo
  const planItems = await prisma.assessmentItem.findMany({
    where: { planId: plan.id },
    orderBy: { order: 'asc' },
  });
  const scores = [16, 14, 17, 15, 18];
  for (let i = 0; i < planItems.length && i < scores.length; i++) {
    await prisma.grade.upsert({
      where: {
        registrationId_assessmentItemId: {
          registrationId: registration.id,
          assessmentItemId: planItems[i].id,
        },
      },
      update: {},
      create: {
        registrationId: registration.id,
        assessmentItemId: planItems[i].id,
        score: scores[i],
        recordedById: teacher.id,
      },
    });
  }

  // Sessão de presença de exemplo
  await prisma.classSession.create({
    data: {
      classId: classes[0].id,
      status: 'CLOSED',
      closedAt: new Date(),
    },
  });

  // Pagamento de exemplo (para Sprint 4)
  await prisma.payment.create({
    data: {
      userId: student.id,
      amount: 25000,
      concept: 'Propina 1º Semestre 2026',
      reference: 'REF-2026-001',
      status: 'COMPLETED',
      gateway: 'MULTICAIXA_MOCK',
    },
  });

  // eslint-disable-next-line no-console
  console.log('✅ Seed completed:');
  console.log('   Users: admin@/teacher@/student@sge.local (pwd: Password123!)');
  console.log(`   Course: ${course.name} (${course.code}) with ${disciplines.length} disciplines`);
  console.log(`   Classes: ${classes.length} (2026/1º semestre)`);
  console.log(`   Assessment plan: ${planItems.length} items (Programação I)`);
  console.log(`   Grades: ${scores.length} notas de exemplo`);
  console.log('   Payment: 1 pagamento de exemplo');
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
