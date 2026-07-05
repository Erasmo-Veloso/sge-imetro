import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createDiscipline,
  deleteDiscipline,
  extractApiError,
  updateDiscipline,
  type DisciplineDTO,
  useDisciplines,
  useCourses,
} from '@/api';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/input';
import { TBody, TD, TH, THead, Table, TR } from '@/components/ui/table';

export function DisciplinesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DisciplineDTO | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useDisciplines({ page, pageSize: 10, search, courseId });
  const coursesQ = useCourses({ page: 1, pageSize: 100 });

  const createMut = useMutation({
    mutationFn: (input: Parameters<typeof createDiscipline>[0]) => createDiscipline(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplines'] });
      toast.success('Disciplina criada');
      setModalOpen(false);
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateDiscipline>[1] }) =>
      updateDiscipline(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplines'] });
      toast.success('Disciplina atualizada');
      setModalOpen(false);
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteDiscipline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplines'] });
      toast.success('Disciplina removida');
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Disciplinas</h1>
          <p className="text-muted-foreground text-sm">Disciplinas por curso</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="size-4" /> Nova disciplina
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Procurar disciplina…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <select
          value={courseId}
          onChange={(e) => {
            setCourseId(e.target.value);
            setPage(1);
          }}
          className="border-input bg-background flex h-9 rounded-md border px-3 text-sm"
        >
          <option value="">Todos os cursos</option>
          {coursesQ.data?.items.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <Table>
          <THead>
            <TR>
              <TH>Disciplina</TH>
              <TH>Código</TH>
              <TH>Curso</TH>
              <TH>Semestre</TH>
              <TH>Créditos</TH>
              <TH>Carga</TH>
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
            {data?.items.map((d) => (
              <TR key={d.id}>
                <TD className="font-medium">{d.name}</TD>
                <TD className="text-muted-foreground">{d.code}</TD>
                <TD className="text-muted-foreground">{d.course.name}</TD>
                <TD>{d.semester}º</TD>
                <TD>{d.credits}</TD>
                <TD>{d.workloadHrs}h</TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(d);
                        setModalOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Remover ${d.name}?`)) deleteMut.mutate(d.id);
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
                  Nenhuma disciplina encontrada.
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

      {modalOpen && (
        <DisciplineFormDialog
          editing={editing}
          courses={coursesQ.data?.items ?? []}
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

function DisciplineFormDialog({
  editing,
  courses,
  onClose,
  onSubmit,
  saving,
}: {
  editing: DisciplineDTO | null;
  courses: { id: string; name: string; code: string }[];
  onClose: () => void;
  onSubmit: (v: {
    create?: Parameters<typeof createDiscipline>[0];
    update: Parameters<typeof updateDiscipline>[1];
  }) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(editing?.name ?? '');
  const [code, setCode] = useState(editing?.code ?? '');
  const [courseId, setCourseId] = useState(editing?.courseId ?? courses[0]?.id ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [credits, setCredits] = useState(editing?.credits ?? 4);
  const [workloadHrs, setWorkloadHrs] = useState(editing?.workloadHrs ?? 60);
  const [semester, setSemester] = useState(editing?.semester ?? 1);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (editing) {
      onSubmit({
        update: {
          name,
          code,
          description: description || undefined,
          credits,
          workloadHrs,
          semester,
        },
      });
    } else {
      onSubmit({
        create: {
          courseId,
          name,
          code,
          description: description || undefined,
          credits,
          workloadHrs,
          semester,
        },
        update: {},
      });
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={editing ? 'Editar disciplina' : 'Nova disciplina'}
      description={editing ? 'Atualize os dados.' : 'Crie uma nova disciplina.'}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="course">Curso</Label>
          <select
            id="course"
            required
            disabled={!!editing}
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
          >
            <option value="" disabled>
              Selecione…
            </option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="code">Código</Label>
          <Input id="code" required value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="semester">Semestre</Label>
            <Input
              id="semester"
              type="number"
              min={1}
              max={10}
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="credits">Créditos</Label>
            <Input
              id="credits"
              type="number"
              min={0}
              max={20}
              value={credits}
              onChange={(e) => setCredits(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="workload">Carga (h)</Label>
            <Input
              id="workload"
              type="number"
              min={0}
              max={600}
              value={workloadHrs}
              onChange={(e) => setWorkloadHrs(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="desc">Descrição (opcional)</Label>
          <textarea
            id="desc"
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
