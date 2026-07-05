import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  cancelRegistration,
  extractApiError,
  useMyEnrollments,
  useMyRegistrations,
  type RegistrationDTO,
} from '@/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/features/auth/auth-provider';

// NOTE: Classes aren't yet exposed via a dedicated API module in the web client.
// This page focuses on the student-facing registration flow using approved enrollments.

export function RegistrationsPage() {
  const { user } = useAuth();
  const myRegQ = useMyRegistrations();
  const myEnrQ = useMyEnrollments();
  const queryClient = useQueryClient();

  const approvedEnrollments = myEnrQ.data?.filter((e) => e.status === 'APPROVED') ?? [];

  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelRegistration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      toast.success('Matrícula cancelada');
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">As minhas matrículas</h1>
        <p className="text-muted-foreground text-sm">
          Turmas em que está matriculado ({user?.role === 'STUDENT' ? 'estudante' : 'docente'})
        </p>
      </div>

      {/* Approved enrollments ready for registration */}
      {approvedEnrollments.length > 0 && (
        <div className="rounded-lg border bg-emerald-50 p-4 dark:bg-emerald-950/20">
          <p className="mb-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            ✓ Tem {approvedEnrollments.length} inscrição(ões) aprovada(s) pronta(s) para matrícula
          </p>
          <p className="text-muted-foreground text-sm">
            Procure um curso disponível e matricule-se numa turma.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {myRegQ.isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}
        {myRegQ.data?.map((r) => (
          <RegistrationCard
            key={r.id}
            reg={r}
            onCancel={() => {
              if (confirm('Cancelar esta matrícula?')) cancelMut.mutate(r.id);
            }}
          />
        ))}
        {!myRegQ.isLoading && myRegQ.data && myRegQ.data.length === 0 && (
          <div className="bg-card text-muted-foreground rounded-lg border p-8 text-center shadow-sm">
            Ainda não tem matrículas. Quando uma inscrição for aprovada, poderá matricular-se numa
            turma.
          </div>
        )}
      </div>
    </div>
  );
}

function RegistrationCard({ reg, onCancel }: { reg: RegistrationDTO; onCancel: () => void }) {
  return (
    <div className="bg-card flex items-start justify-between gap-4 rounded-lg border p-4 shadow-sm">
      <div>
        <p className="font-medium">{reg.class?.discipline.name}</p>
        <p className="text-muted-foreground text-sm">
          {reg.class?.discipline.code} · Ano {reg.academicYear}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Matriculado em {new Date(reg.enrolledAt).toLocaleDateString('pt-PT')}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <Badge variant={reg.status === 'ACTIVE' ? 'success' : 'secondary'}>{reg.status}</Badge>
        {reg.status === 'ACTIVE' && (
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-destructive">
            <XCircle className="size-4" /> Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
