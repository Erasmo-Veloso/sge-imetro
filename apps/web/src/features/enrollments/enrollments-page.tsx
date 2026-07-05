import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Loader2, Upload, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  createEnrollment,
  extractApiError,
  listEnrollmentDocuments,
  uploadEnrollmentDocument,
  type EnrollmentDocumentDTO,
  useMyEnrollments,
  useSelectionProcesses,
} from '@/api';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';

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

const DOC_TYPES: { value: EnrollmentDocumentDTO['type']; label: string }[] = [
  { value: 'ID_DOCUMENT', label: 'Documento de Identificação' },
  { value: 'PAYMENT_PROOF', label: 'Comprovativo de Pagamento' },
  { value: 'TRANSCRIPT', label: 'Certificado/Transcrição' },
  { value: 'PHOTO', label: 'Fotografia' },
  { value: 'OTHER', label: 'Outro' },
];

export function EnrollmentsPage() {
  const myQ = useMyEnrollments();
  const [modalOpen, setModalOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">As minhas inscrições</h1>
          <p className="text-muted-foreground text-sm">Processos seletivos em que se inscreveu</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="size-4" /> Nova inscrição
        </Button>
      </div>

      <div className="space-y-3">
        {myQ.isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
          </div>
        )}
        {myQ.data?.map((e) => (
          <div key={e.id} className="bg-card rounded-lg border p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{e.selectionProcess?.title}</p>
                <p className="text-muted-foreground text-sm">{e.selectionProcess?.course.name}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Submetida em {new Date(e.createdAt).toLocaleDateString('pt-PT')}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[e.status] ?? 'secondary'}>
                {STATUS_LABEL[e.status] ?? e.status}
              </Badge>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setDetailId(e.id)}>
                <FileText className="size-4" /> Ver detalhes
              </Button>
            </div>
          </div>
        ))}
        {!myQ.isLoading && myQ.data && myQ.data.length === 0 && (
          <div className="bg-card text-muted-foreground rounded-lg border p-8 text-center shadow-sm">
            Ainda não tem inscrições. Clique em "Nova inscrição" para começar.
          </div>
        )}
      </div>

      {modalOpen && <NewEnrollmentDialog onClose={() => setModalOpen(false)} />}
      {detailId && (
        <EnrollmentDetailDialog enrollmentId={detailId} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}

function NewEnrollmentDialog({ onClose }: { onClose: () => void }) {
  const spQ = useSelectionProcesses({ page: 1, pageSize: 100 });
  const openProcesses = spQ.data?.items.filter((s) => s.status === 'OPEN') ?? [];
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState('');

  const mut = useMutation({
    mutationFn: (spId: string) => createEnrollment(spId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      toast.success('Inscrição submetida com sucesso');
      onClose();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title="Nova inscrição"
      description="Selecione um processo seletivo aberto."
    >
      {spQ.isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : openProcesses.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Não há processos seletivos abertos no momento.
        </p>
      ) : (
        <div className="space-y-3">
          {openProcesses.map((s) => (
            <label
              key={s.id}
              className="hover:bg-accent flex cursor-pointer items-start gap-3 rounded-md border p-3"
            >
              <input
                type="radio"
                name="sp"
                value={s.id}
                checked={selected === s.id}
                onChange={(e) => setSelected(e.target.value)}
                className="mt-1"
              />
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-muted-foreground text-sm">
                  {s.course.name} · {s.academicYear} · {s.vacancies} vagas
                </p>
              </div>
            </label>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              disabled={!selected || mut.isPending}
              onClick={() => selected && mut.mutate(selected)}
            >
              {mut.isPending ? 'A submeter…' : 'Submeter inscrição'}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function EnrollmentDetailDialog({
  enrollmentId,
  onClose,
}: {
  enrollmentId: string;
  onClose: () => void;
}) {
  const docsQ = useQuery({
    queryKey: ['enrollment-docs', enrollmentId],
    queryFn: () => listEnrollmentDocuments(enrollmentId),
  });
  const queryClient = useQueryClient();
  const [uploadType, setUploadType] = useState<EnrollmentDocumentDTO['type']>('ID_DOCUMENT');

  const uploadMut = useMutation({
    mutationFn: ({ file, type }: { file: File; type: EnrollmentDocumentDTO['type'] }) =>
      uploadEnrollmentDocument(enrollmentId, file, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment-docs', enrollmentId] });
      toast.success('Documento carregado');
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadMut.mutate({ file, type: uploadType });
    e.target.value = '';
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Detalhes da inscrição"
      description="Carregue os documentos necessários para a sua inscrição."
    >
      <div className="space-y-4">
        <div className="bg-muted/30 rounded-md border p-3">
          <p className="text-muted-foreground text-sm">Documentos carregados</p>
          {docsQ.isLoading ? (
            <div className="py-2">
              <Loader2 className="size-4 animate-spin" />
            </div>
          ) : docsQ.data && docsQ.data.length === 0 ? (
            <p className="text-muted-foreground py-2 text-sm">Nenhum documento carregado.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {docsQ.data?.map((d) => (
                <div key={d.id} className="flex items-center gap-2 text-sm">
                  <FileText className="text-muted-foreground size-4" />
                  <span className="flex-1 truncate">{d.fileName}</span>
                  <Badge variant="outline">{d.type.replace('_', ' ')}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Carregar novo documento</label>
          <div className="flex items-center gap-2">
            <select
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value as EnrollmentDocumentDTO['type'])}
              className="border-input bg-background flex h-9 rounded-md border px-3 text-sm"
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <label className="border-input bg-background hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <Upload className="size-4" />
              <span>{uploadMut.isPending ? 'A carregar…' : 'Escolher ficheiro'}</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                disabled={uploadMut.isPending}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-muted-foreground text-xs">
            Formatos aceites: JPG, PNG, PDF. Máx. 5MB.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="size-4" /> Voltar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
