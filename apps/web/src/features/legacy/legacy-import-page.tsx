import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Loader2, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { extractApiError, uploadLegacyFile, useLegacyImports } from '@/api';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const STATUS_VARIANT: Record<
  string,
  'success' | 'warning' | 'destructive' | 'secondary' | 'default'
> = {
  PENDING: 'secondary',
  PROCESSING: 'warning',
  COMPLETED: 'success',
  FAILED: 'destructive',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  PROCESSING: 'A processar',
  COMPLETED: 'Concluído',
  FAILED: 'Falhou',
};

const STATUS_ICON: Record<string, typeof Clock> = {
  PENDING: Clock,
  PROCESSING: Loader2,
  COMPLETED: CheckCircle2,
  FAILED: XCircle,
};

export function LegacyImportPage() {
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const q = useLegacyImports({ page, pageSize: 15 });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Importação Legacy</h1>
          <p className="text-muted-foreground text-sm">
            Importar dados de sistemas anteriores (CSV ou SQL)
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="size-4" /> Importar ficheiro
        </Button>
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 font-medium">Ficheiro</th>
                <th className="p-3 font-medium">Tipo</th>
                <th className="p-3 font-medium">Estado</th>
                <th className="p-3 font-medium">Registos</th>
                <th className="p-3 font-medium">Erros</th>
                <th className="p-3 font-medium">Início</th>
                <th className="p-3 font-medium">Fim</th>
              </tr>
            </thead>
            <tbody>
              {q.isLoading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <Loader2 className="text-muted-foreground mx-auto size-5 animate-spin" />
                  </td>
                </tr>
              )}
              {q.data?.items.map((imp) => {
                const Icon = STATUS_ICON[imp.status] ?? Clock;
                return (
                  <tr key={imp.id} className="border-b last:border-0">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="text-muted-foreground size-4" />
                        <span className="font-medium">{imp.filename}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{imp.type}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant={STATUS_VARIANT[imp.status] ?? 'secondary'}>
                        <Icon
                          className={`mr-1 size-3 ${imp.status === 'PROCESSING' ? 'animate-spin' : ''}`}
                        />
                        {STATUS_LABEL[imp.status] ?? imp.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {imp.processedRecords}/{imp.totalRecords}
                    </td>
                    <td className="p-3">
                      {imp.errorRecords > 0 ? (
                        <span className="text-destructive font-medium">{imp.errorRecords}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="text-muted-foreground p-3">
                      {imp.startedAt ? new Date(imp.startedAt).toLocaleString('pt-PT') : '—'}
                    </td>
                    <td className="text-muted-foreground p-3">
                      {imp.completedAt ? new Date(imp.completedAt).toLocaleString('pt-PT') : '—'}
                    </td>
                  </tr>
                );
              })}
              {!q.isLoading && q.data?.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-muted-foreground p-8 text-center">
                    Nenhuma importação realizada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {q.data && q.data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t p-3">
            <span className="text-muted-foreground text-sm">
              Página {page} de {q.data.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= q.data.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Seguinte
              </Button>
            </div>
          </div>
        )}
      </div>

      {uploadOpen && <UploadDialog onClose={() => setUploadOpen(false)} />}
    </div>
  );
}

function UploadDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<'CSV' | 'SQL'>('CSV');

  const mut = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('Seleccione um ficheiro');
      return uploadLegacyFile(file, type);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legacy-imports'] });
      toast.success('Importação iniciada');
      onClose();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  return (
    <Dialog open onClose={onClose} title="Importar dados legacy">
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Tipo de ficheiro</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'CSV' | 'SQL')}
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="CSV">CSV</option>
            <option value="SQL">SQL (INSERT)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Ficheiro</label>
          <label className="border-input bg-background hover:bg-accent flex cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-4 text-sm">
            <Upload className="size-5" />
            <span>{file ? file.name : 'Clique para selecionar ficheiro'}</span>
            <input
              type="file"
              accept={type === 'CSV' ? '.csv' : '.sql'}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
          <p className="text-muted-foreground text-xs">Formatos aceites: CSV ou SQL. Máx. 50MB.</p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={!file || mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Importar'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
