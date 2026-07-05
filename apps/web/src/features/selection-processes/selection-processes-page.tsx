import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createSelectionProcess,
  deleteSelectionProcess,
  extractApiError,
  updateSelectionProcess,
  type SelectionProcessDTO,
  useCourses,
  useSelectionProcesses,
} from '@/api';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TBody, TD, TH, THead, Table, TR } from '@/components/ui/table';

const STATUS_VARIANT: Record<string, 'default' | 'warning' | 'success' | 'destructive'> = {
  DRAFT: 'default',
  OPEN: 'success',
  CLOSED: 'warning',
  CANCELLED: 'destructive',
};

export function SelectionProcessesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SelectionProcessDTO | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useSelectionProcesses({ page, pageSize: 10, search });

  const createMut = useMutation({
    mutationFn: (input: Parameters<typeof createSelectionProcess>[0]) =>
      createSelectionProcess(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selection-processes'] });
      toast.success('Processo seletivo criado');
      setModalOpen(false);
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof updateSelectionProcess>[1];
    }) => updateSelectionProcess(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selection-processes'] });
      toast.success('Processo seletivo atualizado');
      setModalOpen(false);
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteSelectionProcess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selection-processes'] });
      toast.success('Processo seletivo removido');
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Processos seletivos</h1>
          <p className="text-muted-foreground text-sm">Gestão de processos de inscrição (admin)</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="size-4" /> Novo processo
        </Button>
      </div>

      <Input
        placeholder="Procurar processo…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="max-w-xs"
      />

      <div className="bg-card rounded-lg border shadow-sm">
        <Table>
          <THead>
            <TR>
              <TH>Título</TH>
              <TH>Curso</TH>
              <TH>Ano</TH>
              <TH>Vagas</TH>
              <TH>Inscritos</TH>
              <TH>Estado</TH>
              <TH className="text-right">Ações</TH>
            </TR>
          </THead>
          <TBody>
            {isLoading && (
              <TR>
                <TD colSpan={7} className="text-center">
                  <Loader2 className="mx-auto size-5 animate-spin" />
                </TD>
              </TR>
            )}
            {data?.items.map((s) => (
              <TR key={s.id}>
                <TD className="font-medium">{s.title}</TD>
                <TD className="text-muted-foreground">{s.course.name}</TD>
                <TD>{s.academicYear}</TD>
                <TD>{s.vacancies}</TD>
                <TD>{s.enrolledCount ?? '—'}</TD>
                <TD>
                  <Badge variant={STATUS_VARIANT[s.status] ?? 'default'}>{s.status}</Badge>
                </TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(s);
                        setModalOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Remover ${s.title}?`)) deleteMut.mutate(s.id);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
            {!isLoading && data && data.items.length === 0 && (
              <TR>
                <TD colSpan={7} className="text-muted-foreground text-center">
                  Nenhum processo encontrado.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </div>

      {modalOpen && (
        <SPFormDialog
          editing={editing}
          onClose={() => setModalOpen(false)}
          onSubmit={(values) => {
            if (editing) updateMut.mutate({ id: editing.id, input: values.update });
            else createMut.mutate(values.create!);
          }}
          saving={createMut.isPending || updateMut.isPending}
        />
      )}
    </div>
  );
}

function SPFormDialog({
  editing,
  onClose,
  onSubmit,
  saving,
}: {
  editing: SelectionProcessDTO | null;
  onClose: () => void;
  onSubmit: (v: {
    create?: Parameters<typeof createSelectionProcess>[0];
    update: Parameters<typeof updateSelectionProcess>[1];
  }) => void;
  saving: boolean;
}) {
  const coursesQ = useCourses({ page: 1, pageSize: 100 });
  const [title, setTitle] = useState(editing?.title ?? '');
  const [courseId, setCourseId] = useState(editing?.courseId ?? coursesQ.data?.items[0]?.id ?? '');
  const [academicYear, setAcademicYear] = useState(
    editing?.academicYear ?? new Date().getFullYear(),
  );
  const [period, setPeriod] = useState<'FIRST' | 'SECOND'>(editing?.period ?? 'FIRST');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [openDate, setOpenDate] = useState(editing?.openDate ? editing.openDate.slice(0, 10) : '');
  const [closeDate, setCloseDate] = useState(
    editing?.closeDate ? editing.closeDate.slice(0, 10) : '',
  );
  const [vacancies, setVacancies] = useState(editing?.vacancies ?? 0);
  const [status, setStatus] = useState(editing?.status ?? 'DRAFT');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (editing) {
      onSubmit({
        update: {
          title,
          description: description || undefined,
          vacancies,
          status,
          openDate,
          closeDate,
        },
      });
    } else {
      onSubmit({
        create: {
          courseId,
          academicYear,
          period,
          title,
          description: description || undefined,
          openDate: new Date(openDate).toISOString(),
          closeDate: new Date(closeDate).toISOString(),
          vacancies,
        },
        update: {},
      });
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={editing ? 'Editar processo seletivo' : 'Novo processo seletivo'}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Título</Label>
          <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        {!editing && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="course">Curso</Label>
              <select
                id="course"
                required
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
              >
                <option value="" disabled>
                  Selecione…
                </option>
                {coursesQ.data?.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="year">Ano académico</Label>
                <Input
                  id="year"
                  type="number"
                  min={2000}
                  max={2100}
                  value={academicYear}
                  onChange={(e) => setAcademicYear(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="period">Período</Label>
                <select
                  id="period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as 'FIRST' | 'SECOND')}
                  className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                >
                  <option value="FIRST">1º Semestre</option>
                  <option value="SECOND">2º Semestre</option>
                </select>
              </div>
            </div>
          </>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="openDate">Abertura</Label>
            <Input
              id="openDate"
              type="date"
              required
              value={openDate}
              onChange={(e) => setOpenDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="closeDate">Fecho</Label>
            <Input
              id="closeDate"
              type="date"
              required
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="vacancies">Vagas</Label>
            <Input
              id="vacancies"
              type="number"
              min={0}
              value={vacancies}
              onChange={(e) => setVacancies(Number(e.target.value))}
            />
          </div>
          {editing && (
            <div className="space-y-1.5">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as never)}
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
              >
                {['DRAFT', 'OPEN', 'CLOSED', 'CANCELLED'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Descrição (opcional)</Label>
          <textarea
            id="description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border-input bg-background shadow-xs focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'A guardar…' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
