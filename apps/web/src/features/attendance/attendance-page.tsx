import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, QrCode, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  useMyRegistrations,
  useClassSessions,
  useAttendances,
  createSession,
  closeSession,
  recordManualAttendance,
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
  const myRegQ = useMyRegistrations();
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const classes = myRegQ.data?.filter((r) => r.status === 'ACTIVE').map((r) => r.class) ?? [];
  const uniqueClasses = classes.filter((c, i, arr) => arr.findIndex((x) => x?.id === c?.id) === i);

  const isStudent = user?.role === 'STUDENT';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Presença</h1>
        <p className="text-muted-foreground text-sm">
          {isStudent ? 'Registar presença com código QR' : 'Gerar sessões e marcar presenças'}
        </p>
      </div>

      {isStudent ? (
        <StudentAttendanceView />
      ) : (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Turma</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Selecione uma turma</option>
              {uniqueClasses.map(
                (c) =>
                  c && (
                    <option key={c.id} value={c.id}>
                      {c.discipline.name} ({c.discipline.code})
                    </option>
                  ),
              )}
            </select>
          </div>
          {selectedClassId && <TeacherAttendanceView classId={selectedClassId} />}
        </>
      )}
    </div>
  );
}

function StudentAttendanceView() {
  const [qrToken, setQrToken] = useState('');
  const queryClient = useQueryClient();

  const verifyMut = useMutation({
    mutationFn: (token: string) => verifyQr('current', token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      toast.success('Presença registada com sucesso');
      setQrToken('');
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  return (
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
  );
}

function TeacherAttendanceView({ classId }: { classId: string }) {
  const queryClient = useQueryClient();
  const sessionsQ = useClassSessions(classId);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  const createMut = useMutation({
    mutationFn: () => createSession(classId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', classId] });
      setSelectedSessionId(data.id);
      toast.success('Sessão criada');
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="font-medium">Sessões</h3>
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
          <SessionCard
            key={session.id}
            session={session}
            isSelected={selectedSessionId === session.id}
            onSelect={() => setSelectedSessionId(session.id)}
          />
        ))}
      </div>

      {selectedSessionId && <SessionDetailView classId={classId} sessionId={selectedSessionId} />}
    </div>
  );
}

function SessionCard({
  session,
  isSelected,
  onSelect,
}: {
  session: ClassSessionDTO;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`bg-card cursor-pointer rounded-lg border p-4 shadow-sm transition-colors ${
        isSelected ? 'ring-primary ring-2' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{new Date(session.date).toLocaleDateString('pt-PT')}</p>
          <p className="text-muted-foreground text-sm">
            {session.status === 'OPEN'
              ? 'Aberta'
              : session.status === 'CLOSED'
                ? 'Fechada'
                : 'Cancelada'}
          </p>
        </div>
        <Badge variant={session.status === 'OPEN' ? 'success' : 'secondary'}>
          {session.status}
        </Badge>
      </div>
      {session.qrDataUrl && session.status === 'OPEN' && (
        <div className="mt-3 flex justify-center">
          <img src={session.qrDataUrl} alt="QR Code" className="h-32 w-32" />
        </div>
      )}
    </div>
  );
}

function SessionDetailView({ classId, sessionId }: { classId: string; sessionId: string }) {
  const queryClient = useQueryClient();
  const attendancesQ = useAttendances(sessionId);

  const closeMut = useMutation({
    mutationFn: () => closeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', classId] });
      toast.success('Sessão fechada');
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Presenças</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => closeMut.mutate()}
          disabled={closeMut.isPending}
        >
          {closeMut.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <XCircle className="size-4" />
          )}{' '}
          Fechar sessão
        </Button>
      </div>

      {attendancesQ.isLoading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : attendancesQ.data && attendancesQ.data.length > 0 ? (
        <div className="space-y-2">
          {attendancesQ.data.map((att) => (
            <AttendanceRow key={att.id} attendance={att} classId={classId} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Nenhuma presença registada.</p>
      )}
    </Card>
  );
}

function AttendanceRow({
  attendance,
  classId,
}: {
  attendance: {
    id: string;
    registrationId: string;
    status: string;
    method: string;
    registration?: { student?: { name: string } };
  };
  classId: string;
}) {
  const queryClient = useQueryClient();

  const updateMut = useMutation({
    mutationFn: (status: string) =>
      recordManualAttendance(classId, attendance.id, {
        registrationId: attendance.registrationId,
        status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      toast.success('Presença atualizada');
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  return (
    <div className="flex items-center justify-between rounded-md border p-2">
      <span className="text-sm">{attendance.registration?.student?.name ?? 'Aluno'}</span>
      <div className="flex items-center gap-2">
        <Badge
          variant={
            attendance.status === 'PRESENT'
              ? 'success'
              : attendance.status === 'ABSENT'
                ? 'destructive'
                : 'secondary'
          }
        >
          {attendance.status}
        </Badge>
        <Badge variant="outline">{attendance.method}</Badge>
        {attendance.status !== 'PRESENT' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateMut.mutate('PRESENT')}
            disabled={updateMut.isPending}
          >
            <CheckCircle className="size-4 text-green-600" />
          </Button>
        )}
      </div>
    </div>
  );
}
