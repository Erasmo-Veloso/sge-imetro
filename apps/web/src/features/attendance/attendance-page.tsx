import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, QrCode, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  useMyRegistrations,
  useClasses,
  useClassSessions,
  createSession,
  closeSession,
  getSession,
  listAttendances,
  verifyQr,
  extractApiError,
  type ClassSessionDTO,
} from '@/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/features/auth/auth-provider';

export function AttendancePage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';

  return isStudent ? <StudentAttendanceView /> : <TeacherAttendanceView />;
}

function StudentAttendanceView() {
  const [qrToken, setQrToken] = useState('');
  const queryClient = useQueryClient();

  const verifyMut = useMutation({
    mutationFn: (token: string) => verifyQr('', token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      toast.success('Presença registada com sucesso');
      setQrToken('');
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Presença</h1>
        <p className="text-muted-foreground text-sm">Registar presença com código QR</p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="text-center">
            <QrCode className="text-muted-foreground mx-auto size-12" />
            <h3 className="mt-2 font-medium">Registar presença</h3>
            <p className="text-muted-foreground text-sm">
              Insira o código QR apresentado pelo docente
            </p>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Código QR"
              value={qrToken}
              onChange={(e) => setQrToken(e.target.value)}
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm"
            />
          </div>

          <Button
            className="w-full"
            disabled={!qrToken || verifyMut.isPending}
            onClick={() => verifyMut.mutate(qrToken)}
          >
            {verifyMut.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle className="size-4" />
            )}{' '}
            Confirmar presença
          </Button>
        </div>
      </Card>
    </div>
  );
}

function TeacherAttendanceView() {
  const { user } = useAuth();
  const myRegQ = useMyRegistrations();
  const classesQ = useClasses({ page: 1, pageSize: 200 });
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  let classOptions: any[] = [];
  if (user?.role === 'STUDENT') {
    const seen = new Set<string>();
    for (const r of myRegQ.data ?? []) {
      if (r.status === 'ACTIVE' && r.class && !seen.has(r.class.id)) {
        seen.add(r.class.id);
        classOptions.push(r.class);
      }
    }
  } else {
    classOptions = classesQ.data?.items ?? [];
  }

  if (selectedSessionId) {
    return (
      <SessionDetailView sessionId={selectedSessionId} onBack={() => setSelectedSessionId(null)} />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Presença</h1>
        <p className="text-muted-foreground text-sm">Gerir sessões e presenças</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Turma</label>
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
        >
          <option value="">Selecione uma turma</option>
          {classOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.discipline?.name} ({c.discipline?.code})
            </option>
          ))}
        </select>
      </div>

      {selectedClassId && (
        <SessionsList classId={selectedClassId} onSelect={setSelectedSessionId} />
      )}
    </div>
  );
}

function SessionsList({ classId, onSelect }: { classId: string; onSelect: (id: string) => void }) {
  const queryClient = useQueryClient();
  const sessionsQ = useClassSessions(classId);

  const createMut = useMutation({
    mutationFn: () => createSession(classId),
    onSuccess: (data) => {
      queryClient.setQueryData(['sessions', classId], (old: ClassSessionDTO[] | undefined) => {
        return [data, ...(old ?? [])];
      });
      onSelect(data.id);
      toast.success('Sessão criada');
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
          {createMut.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}{' '}
          Criar sessão
        </Button>
      </div>

      {sessionsQ.isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      )}

      <div className="space-y-2">
        {sessionsQ.data?.map((session) => (
          <div
            key={session.id}
            onClick={() => onSelect(session.id)}
            className="bg-card hover:bg-accent cursor-pointer rounded-lg border p-4 shadow-sm transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {new Date(session.date).toLocaleDateString('pt-PT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <Badge variant={session.status === 'OPEN' ? 'success' : 'secondary'}>
                {session.status === 'OPEN' ? 'Aberta' : 'Fechada'}
              </Badge>
            </div>
          </div>
        ))}
        {!sessionsQ.isLoading && sessionsQ.data?.length === 0 && (
          <div className="bg-card text-muted-foreground rounded-lg border p-8 text-center shadow-sm">
            Nenhuma sessão criada. Crie uma sessão para gerar o QR code.
          </div>
        )}
      </div>
    </div>
  );
}

function SessionDetailView({ sessionId, onBack }: { sessionId: string; onBack: () => void }) {
  const queryClient = useQueryClient();
  const sessionQ = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId),
    refetchInterval: 5000,
  });

  const attendancesQ = useQuery({
    queryKey: ['attendances', 'session', sessionId],
    queryFn: () => listAttendances(sessionId),
  });

  const closeMut = useMutation({
    mutationFn: () => closeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Sessão fechada');
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const session = sessionQ.data;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" /> Voltar
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Detalhes da sessão</h1>
      </div>

      {sessionQ.isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      ) : session ? (
        <>
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">Criada em</p>
                <p className="font-medium">{new Date(session.date).toLocaleString('pt-PT')}</p>
                <p className="text-muted-foreground mt-2 text-sm">Estado</p>
                <Badge variant={session.status === 'OPEN' ? 'success' : 'secondary'}>
                  {session.status === 'OPEN' ? 'Aberta' : 'Fechada'}
                </Badge>
              </div>

              {session.status === 'OPEN' && (
                <Button variant="destructive" size="sm" onClick={() => closeMut.mutate()}>
                  <XCircle className="size-4" /> Fechar sessão
                </Button>
              )}
            </div>

            {session.status === 'OPEN' && session.qrDataUrl && session.qrToken && (
              <div className="mt-6 flex flex-col items-center gap-3">
                <p className="text-sm font-medium">QR Code para alunos</p>
                <img src={session.qrDataUrl} alt="QR Code" className="h-48 w-48" />
                <p
                  className="bg-muted max-w-xs cursor-pointer select-all rounded-md px-3 py-1.5 text-center font-mono text-xs tracking-wider"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(session.qrToken!)
                      .then(() => toast.success('Código copiado'));
                  }}
                  title="Clique para copiar"
                >
                  {session.qrToken}
                </p>
                <p className="text-muted-foreground text-xs">
                  Válido até{' '}
                  {session.qrExpiresAt
                    ? new Date(session.qrExpiresAt).toLocaleTimeString('pt-PT')
                    : '—'}
                </p>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 font-medium">Presenças registadas</h3>
            {attendancesQ.isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : attendancesQ.data && attendancesQ.data.length > 0 ? (
              <div className="space-y-2">
                {attendancesQ.data.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between rounded-md border p-2"
                  >
                    <span className="text-sm">{att.registration?.student?.name ?? 'Aluno'}</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          att.status === 'PRESENT'
                            ? 'success'
                            : att.status === 'ABSENT'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {att.status === 'PRESENT'
                          ? 'Presente'
                          : att.status === 'ABSENT'
                            ? 'Ausente'
                            : att.status === 'JUSTIFIED'
                              ? 'Justificado'
                              : 'Atrasado'}
                      </Badge>
                      <Badge variant="outline">{att.method === 'QR' ? 'QR' : 'Manual'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhuma presença registada.</p>
            )}
          </Card>
        </>
      ) : (
        <div className="bg-card text-muted-foreground rounded-lg border p-8 text-center shadow-sm">
          Sessão não encontrada.
        </div>
      )}
    </div>
  );
}
