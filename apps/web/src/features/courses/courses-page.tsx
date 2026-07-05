import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createCourse,
  deleteCourse,
  extractApiError,
  updateCourse,
  type CourseDTO,
  useCourses,
} from '@/api';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TBody, TD, TH, THead, Table, TR } from '@/components/ui/table';

export function CoursesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CourseDTO | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useCourses({ page, pageSize: 10, search });

  const createMut = useMutation({
    mutationFn: (input: Parameters<typeof createCourse>[0]) => createCourse(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Curso criado');
      setModalOpen(false);
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateCourse>[1] }) =>
      updateCourse(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Curso atualizado');
      setModalOpen(false);
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Curso removido');
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cursos</h1>
          <p className="text-muted-foreground text-sm">Cursos disponíveis na instituição</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="size-4" /> Novo curso
        </Button>
      </div>

      <Input
        placeholder="Procurar curso…"
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
              <TH>Nome</TH>
              <TH>Código</TH>
              <TH>Duração</TH>
              <TH>Coordenador</TH>
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
            {data?.items.map((c) => (
              <TR key={c.id}>
                <TD className="font-medium">{c.name}</TD>
                <TD className="text-muted-foreground">{c.code}</TD>
                <TD>{c.durationYears} anos</TD>
                <TD className="text-muted-foreground">{c.coordinator?.name ?? '—'}</TD>
                <TD>
                  <Badge variant={c.status === 'ACTIVE' ? 'success' : 'secondary'}>
                    {c.status}
                  </Badge>
                </TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(c);
                        setModalOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Remover ${c.name}?`)) deleteMut.mutate(c.id);
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
                <TD colSpan={6} className="text-muted-foreground text-center">
                  Nenhum curso encontrado.
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
        <CourseFormDialog
          editing={editing}
          onClose={() => setModalOpen(false)}
          onSubmit={(values) => {
            if (editing) updateMut.mutate({ id: editing.id, input: values });
            else createMut.mutate(values as Parameters<typeof createCourse>[0]);
          }}
          saving={createMut.isPending || updateMut.isPending}
        />
      )}
    </div>
  );
}

function CourseFormDialog({
  editing,
  onClose,
  onSubmit,
  saving,
}: {
  editing: CourseDTO | null;
  onClose: () => void;
  onSubmit: (v: Parameters<typeof createCourse>[0]) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(editing?.name ?? '');
  const [code, setCode] = useState(editing?.code ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [durationYears, setDurationYears] = useState(editing?.durationYears ?? 3);

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ name, code, description: description || undefined, durationYears });
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={editing ? 'Editar curso' : 'Novo curso'}
      description={editing ? 'Atualize os dados do curso.' : 'Crie um novo curso.'}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="code">Código</Label>
          <Input id="code" required value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="durationYears">Duração (anos)</Label>
          <Input
            id="durationYears"
            type="number"
            min={1}
            max={10}
            value={durationYears}
            onChange={(e) => setDurationYears(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Descrição (opcional)</Label>
          <textarea
            id="description"
            rows={3}
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
