import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createClass,
  deleteClass,
  extractApiError,
  updateClass,
  useClasses,
  useDisciplines,
  type ClassInput,
} from '@/api';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export function ClassesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const q = useClasses({ page, pageSize: 15, search: search || undefined });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Turmas</h1>
          <p className="text-muted-foreground text-sm">Gerir turmas por disciplina e ano letivo</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="size-4" /> Nova turma
        </Button>
      </div>

      <Input
        placeholder="Pesquisar turma..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="max-w-sm"
      />

      <div className="bg-card rounded-lg border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 font-medium">Disciplina</th>
                <th className="p-3 font-medium">Docente</th>
                <th className="p-3 font-medium">Ano</th>
                <th className="p-3 font-medium">Período</th>
                <th className="p-3 font-medium">Vagas</th>
                <th className="p-3 font-medium">Inscritos</th>
                <th className="p-3 font-medium">Sala</th>
                <th className="p-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {q.isLoading && (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <Loader2 className="text-muted-foreground mx-auto size-5 animate-spin" />
                  </td>
                </tr>
              )}
              {q.data?.items.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="p-3">
                    <span className="font-medium">{c.discipline?.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      ({c.discipline?.code})
                    </span>
                  </td>
                  <td className="p-3">
                    {c.teacher?.name ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="p-3">{c.year}</td>
                  <td className="p-3">
                    <Badge variant="outline">{c.period === 'FIRST' ? '1º' : '2º'}</Badge>
                  </td>
                  <td className="p-3">{c.capacity}</td>
                  <td className="p-3">{c._count?.registrations ?? 0}</td>
                  <td className="p-3">
                    {c.room ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditId(c.id)}>
                        <Pencil className="size-4" />
                      </Button>
                      <DeleteButton id={c.id} />
                    </div>
                  </td>
                </tr>
              ))}
              {!q.isLoading && q.data?.items.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-muted-foreground p-8 text-center">
                    Nenhuma turma encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {q.data && q.data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t p-3">
            <span className="text-muted-foreground text-sm">
              {q.data.total} turma(s) · Página {page} de {q.data.totalPages}
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

      {modalOpen && <ClassDialog onClose={() => setModalOpen(false)} />}
      {editId && <ClassDialog classId={editId} onClose={() => setEditId(null)} />}
    </div>
  );
}

function ClassDialog({ classId, onClose }: { classId?: string; onClose: () => void }) {
  const isEdit = !!classId;
  const queryClient = useQueryClient();
  const disciplinesQ = useDisciplines({ page: 1, pageSize: 200 });

  const [form, setForm] = useState<ClassInput>({
    disciplineId: '',
    year: new Date().getFullYear(),
    period: 'FIRST',
    capacity: 60,
    schedule: '',
    room: '',
  });

  const mut = useMutation({
    mutationFn: isEdit
      ? (data: ClassInput) => updateClass(classId, data)
      : (data: ClassInput) => createClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success(isEdit ? 'Turma atualizada' : 'Turma criada');
      onClose();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mut.mutate(form);
  }

  return (
    <Dialog open onClose={onClose} title={isEdit ? 'Editar turma' : 'Nova turma'}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Disciplina *</label>
          <select
            required
            value={form.disciplineId}
            onChange={(e) => setForm({ ...form, disciplineId: e.target.value })}
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Selecionar disciplina...</option>
            {disciplinesQ.data?.items.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Ano *</label>
            <Input
              type="number"
              required
              min={2020}
              value={form.year}
              onChange={(e) => setForm({ ...form, year: +e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Período</label>
            <select
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="FIRST">1º Semestre</option>
              <option value="SECOND">2º Semestre</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Vagas</label>
            <Input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: +e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Sala</label>
            <Input
              value={form.room ?? ''}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
              placeholder="Ex: B301"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Horário</label>
          <Input
            value={form.schedule ?? ''}
            onChange={(e) => setForm({ ...form, schedule: e.target.value })}
            placeholder="Ex: Seg/Qua 10:00-12:00"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mut.isPending}>
            {mut.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isEdit ? (
              'Guardar'
            ) : (
              'Criar'
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function DeleteButton({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const mut = useMutation({
    mutationFn: () => deleteClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Turma eliminada');
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  return (
    <Button variant="ghost" size="icon" onClick={() => mut.mutate()}>
      <Trash2 className="text-destructive size-4" />
    </Button>
  );
}
