import { type ReactNode } from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  LogOut,
  ClipboardList,
  FileCheck,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-provider';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles: string[];
}

const NAV: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  { label: 'Utilizadores', to: '/users', icon: Users, roles: ['ADMIN'] },
  { label: 'Cursos', to: '/courses', icon: GraduationCap, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  {
    label: 'Disciplinas',
    to: '/disciplines',
    icon: BookOpen,
    roles: ['ADMIN', 'TEACHER', 'STUDENT'],
  },
  {
    label: 'Processos seletivos',
    to: '/selection-processes',
    icon: ClipboardList,
    roles: ['ADMIN'],
  },
  { label: 'Turmas', to: '/classes', icon: GraduationCap, roles: ['ADMIN', 'TEACHER'] },
  { label: 'Inscrições', to: '/enrollments', icon: FileText, roles: ['STUDENT'] },
  { label: 'Rever inscrições', to: '/review-enrollments', icon: FileCheck, roles: ['ADMIN'] },
  {
    label: 'Matrículas',
    to: '/registrations',
    icon: GraduationCap,
    roles: ['ADMIN', 'TEACHER', 'STUDENT'],
  },
  { label: 'Avaliação', to: '/assessment', icon: ClipboardList, roles: ['TEACHER', 'ADMIN'] },
  { label: 'Notas', to: '/grades', icon: FileText, roles: ['TEACHER', 'STUDENT', 'ADMIN'] },
  { label: 'Presença', to: '/attendance', icon: ClipboardList, roles: ['TEACHER', 'STUDENT'] },
  { label: 'Pagamentos', to: '/payments', icon: FileText, roles: ['STUDENT', 'ADMIN'] },
  { label: 'Documentos', to: '/audit-documents', icon: FileText, roles: ['STUDENT', 'ADMIN'] },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  TEACHER: 'Docente',
  STUDENT: 'Estudante',
};

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  const items = NAV.filter((n) => user && n.roles.includes(user.role));

  return (
    <div className="bg-muted/20 flex min-h-svh">
      <aside className="bg-card flex w-60 flex-col border-r">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg text-xs font-bold">
            SGE
          </div>
          <span className="font-semibold">SGE</span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-3">
          <div className="mb-2 px-3">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="text-muted-foreground text-xs">{user ? ROLE_LABELS[user.role] : ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
          >
            <LogOut className="size-4" />
            Terminar sessão
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl p-6">{children}</div>
      </main>
    </div>
  );
}
