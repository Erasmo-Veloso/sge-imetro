import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, Upload, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  uploadAuditDocument,
  verifyAuditDocument,
  extractApiError,
  useMyAuditDocuments,
  useAuditDocuments,
} from '@/api';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/auth-provider';
import { TBody, TD, TH, THead, Table, TR } from '@/components/ui/table';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  PENDING: 'warning',
  VERIFIED: 'success',
  REJECTED: 'destructive',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  VERIFIED: 'Verificado',
  REJECTED: 'Rejeitado',
};

const DOC_TYPES: { value: string; label: string }[] = [
  { value: 'ID_DOCUMENT', label: 'Documento de Identificação' },
  { value: 'ACADEMIC_RECORD', label: 'Registo Académico' },
  { value: 'PAYMENT_PROOF', label: 'Comprovativo de Pagamento' },
  { value: 'OTHER', label: 'Outro' },
];

export function AuditDocumentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documentos de Auditoria</h1>
        <p className="text-muted-foreground text-sm">
          {isAdmin
            ? 'Verificar e gerir documentos submetidos pelos estudantes'
            : 'Submeter e acompanhar os seus documentos'}
        </p>
      </div>

      {isAdmin ? <AdminAuditDocumentsView /> : <StudentAuditDocumentsView />}
    </div>
  );
}

function StudentAuditDocumentsView() {
  const myQ = useMyAuditDocuments();
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setUploadOpen(true)}>
          <Plus className="size-4" /> Carregar documento
        </Button>
      </div>

      <div className="space-y-3">
        {myQ.isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
          </div>
        )}
        {myQ.data?.map((d) => (
          <div key={d.id} className="bg-card rounded-lg border p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">
                  {DOC_TYPES.find((t) => t.value === d.type)?.label ?? d.type}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary flex items-center gap-1 text-sm hover:underline"
                  >
                    <ExternalLink className="size-3" /> Ver documento
                  </a>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Submetido em {new Date(d.createdAt).toLocaleDateString('pt-PT')}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[d.status] ?? 'secondary'}>
                {STATUS_LABEL[d.status] ?? d.status}
              </Badge>
            </div>
          </div>
        ))}
        {!myQ.isLoading && myQ.data && myQ.data.length === 0 && (
          <div className="bg-card text-muted-foreground rounded-lg border p-8 text-center shadow-sm">
            Ainda não tem documentos. Clique em "Carregar documento" para começar.
          </div>
        )}
      </div>

      {uploadOpen && <UploadDocumentDialog onClose={() => setUploadOpen(false)} />}
    </div>
  );
}

function UploadDocumentDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [docType, setDocType] = useState(DOC_TYPES[0].value);
  const [file, setFile] = useState<File | null>(null);

  const mut = useMutation({
    mutationFn: () => uploadAuditDocument(file!, docType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-documents', 'mine'] });
      toast.success('Documento carregado com sucesso');
      onClose();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    e.target.value = '';
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Carregar documento"
      description="Selecione o tipo e o ficheiro."
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo de documento</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
          >
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Ficheiro</label>
          <label className="border-input bg-background hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <Upload className="size-4" />
            <span>{file?.name ?? 'Escolher ficheiro'}</span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <p className="text-muted-foreground text-xs">
            Formatos aceites: JPG, PNG, PDF. Máx. 5MB.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={!file || mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}{' '}
            Carregar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function AdminAuditDocumentsView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verifyDocId, setVerifyDocId] = useState<string | null>(null);

  const { data, isLoading } = useAuditDocuments({
    page,
    pageSize: 10,
    search,
    status: statusFilter,
  });

  return (
    <div className="space-y-4">
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
          {['PENDING', 'VERIFIED', 'REJECTED'].map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <Table>
          <THead>
            <TR>
              <TH>Estudante</TH>
              <TH>Tipo</TH>
              <TH>Documento</TH>
              <TH>Estado</TH>
              <TH>Data</TH>
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
            {data?.items.map((d) => (
              <TR key={d.id}>
                <TD className="font-medium">{d.user?.name ?? '—'}</TD>
                <TD className="text-muted-foreground">
                  {DOC_TYPES.find((t) => t.value === d.type)?.label ?? d.type}
                </TD>
                <TD>
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary flex items-center gap-1 text-sm hover:underline"
                  >
                    <ExternalLink className="size-3" /> Ver
                  </a>
                </TD>
                <TD>
                  <Badge variant={STATUS_VARIANT[d.status] ?? 'secondary'}>
                    {STATUS_LABEL[d.status] ?? d.status}
                  </Badge>
                </TD>
                <TD className="text-muted-foreground">
                  {new Date(d.createdAt).toLocaleDateString('pt-PT')}
                </TD>
                <TD className="text-right">
                  {d.status === 'PENDING' && (
                    <Button variant="outline" size="sm" onClick={() => setVerifyDocId(d.id)}>
                      Avaliar
                    </Button>
                  )}
                </TD>
              </TR>
            ))}
            {!isLoading && data && data.items.length === 0 && (
              <TR>
                <TD colSpan={6} className="text-muted-foreground text-center">
                  Nenhum documento encontrado.
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

      {verifyDocId && (
        <VerifyDocumentDialog documentId={verifyDocId} onClose={() => setVerifyDocId(null)} />
      )}
    </div>
  );
}

function VerifyDocumentDialog({
  documentId,
  onClose,
}: {
  documentId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');

  const verifyMut = useMutation({
    mutationFn: (decision: 'VERIFIED' | 'REJECTED') =>
      verifyAuditDocument(documentId, decision, note || undefined),
    onSuccess: (_data, decision) => {
      queryClient.invalidateQueries({ queryKey: ['audit-documents'] });
      toast.success(`Documento ${decision === 'VERIFIED' ? 'verificado' : 'rejeitado'}`);
      onClose();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title="Avaliar documento"
      description="Decida se o documento é válido ou não."
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nota (opcional)</label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="border-input bg-background shadow-xs focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
            placeholder="Observações sobre a decisão…"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            size="sm"
            disabled={verifyMut.isPending}
            onClick={() => verifyMut.mutate('VERIFIED')}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle2 className="size-4" /> Verificar
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={verifyMut.isPending}
            onClick={() => verifyMut.mutate('REJECTED')}
            className="text-destructive hover:bg-destructive/10"
          >
            <XCircle className="size-4" /> Rejeitar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
