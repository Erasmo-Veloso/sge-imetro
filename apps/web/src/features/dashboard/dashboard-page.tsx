import { useAuth } from '@/features/auth/auth-provider';
import { useCourses, useDisciplines, useUsers } from '@/api';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  TEACHER: 'Docente',
  STUDENT: 'Estudante',
};

export function DashboardPage() {
  const { user } = useAuth();
  const usersQ = useUsers({ page: 1, pageSize: 1 });
  const coursesQ = useCourses({ page: 1, pageSize: 1 });
  const disciplinesQ = useDisciplines({ page: 1, pageSize: 1 });

  const stats = [
    { label: 'Utilizadores', value: usersQ.data?.total ?? '—', show: user?.role === 'ADMIN' },
    { label: 'Cursos', value: coursesQ.data?.total ?? '—', show: true },
    { label: 'Disciplinas', value: disciplinesQ.data?.total ?? '—', show: true },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Olá, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground text-sm">
          Perfil: {user ? ROLE_LABELS[user.role] : ''} · {user?.email}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats
          .filter((s) => s.show)
          .map((s) => (
            <div key={s.label} className="bg-card rounded-lg border p-5 shadow-sm">
              <p className="text-muted-foreground text-sm font-medium">{s.label}</p>
              <p className="mt-2 text-3xl font-bold">{s.value}</p>
            </div>
          ))}
      </div>

      <div className="bg-card rounded-lg border p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Bem-vindo ao SGE</h2>
        <p className="text-muted-foreground text-sm">
          {user?.role === 'ADMIN' &&
            'Como administrador, gere utilizadores, cursos e disciplinas no menu lateral.'}
          {user?.role === 'TEACHER' &&
            'Como docente, vai poder lançar notas e marcar presença (Sprint 3).'}
          {user?.role === 'STUDENT' &&
            'Como estudante, vai poder consultar notas e marcar presença via QR (Sprint 3).'}
        </p>
      </div>
    </div>
  );
}
