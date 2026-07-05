import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, CheckCircle2, XCircle, Clock, ListChecks, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  extractApiError,
  getEnrollment,
  listEnrollmentDocuments,
  reviewEnrollment,
  type EnrollmentDTO,
  useEnrollments,
  useSelectionProcesses,
} from '@/api';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TBody, TD, TH, THead, Table, TR } from '@/components/ui/table';

const STATUS_VARIANT: Record<
  string,
  'success' | 'warning' | 'destructive' | 'secondary' | 'default'
> = {
  SUBMITTED: 'secondary',
  IN_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
  WAITLIST: 'default',
};

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Submetida',
  IN_REVIEW: 'Em análise',
  APPROVED: 'Aprovada',
  REJECTED: 'Recusada',
  WAITLIST: 'Lista de espera',
};

export function ReviewEnrollmentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [spFilter, setSpFilter] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading } = useEnrollments({
    page,
    pageSize: 10,
    search,
    status: statusFilter,
    selectionProcessId: spFilter,
  });
  const spQ = useSelectionProcesses({ page: 1, pageSize: 100 });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revisão de inscrições</h1>
        <p className="text-muted-foreground text-sm">
          Avalie e decida sobre as inscrições dos candidatos
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Procurar por nome ou email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border-input bg-background flex h-9 rounded-md border px-3 text-sm"
        >
          <option value="">Todos os estados</option>
          {['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'WAITLIST'].map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          value={spFilter}
          onChange={(e) => {
            setSpFilter(e.target.value);
            setPage(1);
          }}
          className="border-input bg-background flex h-9 rounded-md border px-3 text-sm"
        >
          <option value="">Todos os processos</option>
          {spQ.data?.items.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <Table>
          <THead>
            <TR>
              <TH>Candidato</TH>
              <TH>Processo</TH>
              <TH>Curso</TH>
              <TH>Documentos</TH>
              <TH>Estado</TH>
              <TH className="text-right">Ações</TH>
            </TR>
          </THead>
          <TBody>
            {isLoading && (
              <TR>
                <TD colSpan={6} className="text-center">
                  <Loader2 className="mx-auto size-5 animate-spin" />
                </TD>
              </TR>
            )}
            {data?.items.map((e) => (
              <TR key={e.id}>
                <TD className="font-medium">{e.user?.name}</TD>
                <TD className="text-muted-foreground">{e.selectionProcess?.title}</TD>
                <TD className="text-muted-foreground">{e.selectionProcess?.course.name}</TD>
                <TD>
                  {(e as EnrollmentDTO & { _count?: { documents: number } })._count?.documents ??
                    '—'}
                </TD>
                <TD>
                  <Badge variant={STATUS_VARIANT[e.status] ?? 'secondary'}>
                    {STATUS_LABEL[e.status] ?? e.status}
                  </Badge>
                </TD>
                <TD className="text-right">
                  <Button variant="outline" size="sm" onClick={() => setDetailId(e.id)}>
                    Rever
                  </Button>
                </TD>
              </TR>
            ))}
            {!isLoading && data && data.items.length === 0 && (
              <TR>
                <TD colSpan={6} className="text-muted-foreground text-center">
                  Nenhuma inscrição encontrada.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {data.total} registos · pág. {data.page}/{data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {detailId && <ReviewDialog enrollmentId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}

function ReviewDialog({ enrollmentId, onClose }: { enrollmentId: string; onClose: () => void }) {
  const enrollmentQ = useQuery({
    queryKey: ['enrollment', enrollmentId],
    queryFn: () => getEnrollment(enrollmentId),
  });
  const docsQ = useQuery({
    queryKey: ['enrollment-docs', enrollmentId],
    queryFn: () => listEnrollmentDocuments(enrollmentId),
  });
  const queryClient = useQueryClient();
  const [reviewNote, setReviewNote] = useState('');

  const reviewMut = useMutation({
    mutationFn: (decision: 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'WAITLIST') =>
      reviewEnrollment(
        enrollmentId,
        decision,
        reviewNote || undefined,
        decision === 'REJECTED' ? reviewNote || undefined : undefined,
      ),
    onSuccess: (_data, decision) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment', enrollmentId] });
      toast.success(`Inscrição ${STATUS_LABEL[decision].toLowerCase()}`);
      onClose();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const enrollment = enrollmentQ.data;
  const canDecide =
    enrollment && enrollment.status !== 'APPROVED' && enrollment.status !== 'REJECTED';

  return (
    <Dialog open onClose={onClose} title="Rever inscrição" description={enrollment?.user?.name}>
      {enrollmentQ.isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : enrollment ? (
        <div className="space-y-4">
          <div className="bg-muted/30 rounded-md border p-3 text-sm">
            <p>
              <strong>Processo:</strong> {enrollment.selectionProcess?.title}
            </p>
            <p>
              <strong>Curso:</strong> {enrollment.selectionProcess?.course.name}
            </p>
            <p>
              <strong>Estado:</strong>{' '}
              <Badge variant={STATUS_VARIANT[enrollment.status] ?? 'secondary'}>
                {STATUS_LABEL[enrollment.status] ?? enrollment.status}
              </Badge>
            </p>
          </div>

          <div className="rounded-md border p-3">
            <p className="mb-2 text-sm font-medium">Documentos ({docsQ.data?.length ?? 0})</p>
            {docsQ.isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : docsQ.data && docsQ.data.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum documento carregado.</p>
            ) : (
              <div className="space-y-1">
                {docsQ.data?.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 text-sm">
                    <FileText className="text-muted-foreground size-4" />
                    <span className="flex-1 truncate">{d.fileName}</span>
                    <Badge variant="outline">{d.type.replace('_', ' ')}</Badge>
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      Ver
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {canDecide && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nota de revisão (opcional)</label>
                <textarea
                  rows={2}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="border-input bg-background shadow-xs focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                  placeholder="Observações sobre a decisão…"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reviewMut.isPending}
                  onClick={() => reviewMut.mutate('IN_REVIEW')}
                >
                  <Clock className="size-4" /> Marcar em análise
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  disabled={reviewMut.isPending}
                  onClick={() => reviewMut.mutate('APPROVED')}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="size-4" /> Aprovar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reviewMut.isPending}
                  onClick={() => reviewMut.mutate('WAITLIST')}
                >
                  <ListChecks className="size-4" /> Lista de espera
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reviewMut.isPending}
                  onClick={() => reviewMut.mutate('REJECTED')}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="size-4" /> Recusar
                </Button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </Dialog>
  );
}
