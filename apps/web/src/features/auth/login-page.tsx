import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/auth-provider';
import { extractApiError } from '@/api';
import { Button } from '@/components/ui/button';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@sge.local');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await signIn(email, password);
      toast.success(`Bem-vindo, ${user.name}`);
      navigate('/');
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-muted/30 flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="bg-primary text-primary-foreground mx-auto mb-3 flex size-12 items-center justify-center rounded-xl font-bold">
            SGE
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Aceder à plataforma</h1>
          <p className="text-muted-foreground mt-1 text-sm">Sistema de Gestão Educacional</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card space-y-4 rounded-lg border p-6 shadow-sm">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-input bg-background shadow-xs focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm outline-none focus-visible:ring-2"
              placeholder="o.seu@email.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Palavra-passe
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-input bg-background shadow-xs focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm outline-none focus-visible:ring-2"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'A entrar…' : 'Entrar'}
          </Button>

          <p className="text-muted-foreground text-center text-xs">
            Demo: admin@/teacher@/student@sge.local · Password123!
          </p>
        </form>
      </div>
    </div>
  );
}
