import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createUser, deleteUser, extractApiError, updateUser, type UserDTO, useUsers } from '@/api';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TBody, TD, TH, THead, Table, TR } from '@/components/ui/table';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  SUSPENDED: 'destructive',
  INACTIVE: 'secondary',
};

const ROLES = ['STUDENT', 'TEACHER', 'ADMIN'] as const;

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserDTO | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useUsers({ page, pageSize: 10, search });

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(u: UserDTO) {
    setEditing(u);
    setModalOpen(true);
  }

  const createMut = useMutation({
    mutationFn: (input: Parameters<typeof createUser>[0]) => createUser(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilizador criado');
      setModalOpen(false);
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateUser>[1] }) =>
      updateUser(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilizador atualizado');
      setModalOpen(false);
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilizador removido');
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Utilizadores</h1>
          <p className="text-muted-foreground text-sm">Gestão de contas (admin)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Novo utilizador
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Procurar por nome, email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <Table>
          <THead>
            <TR>
              <TH>Nome</TH>
              <TH>Email</TH>
              <TH>Perfil</TH>
              <TH>Estado</TH>
              <TH className="text-right">Ações</TH>
            </TR>
          </THead>
          <TBody>
            {isLoading && (
              <TR>
                <TD colSpan={5} className="text-muted-foreground text-center">
                  <Loader2 className="mx-auto size-5 animate-spin" />
                </TD>
              </TR>
            )}
            {data?.items.map((u) => (
              <TR key={u.id}>
                <TD className="font-medium">{u.name}</TD>
                <TD className="text-muted-foreground">{u.email}</TD>
                <TD>{u.role}</TD>
                <TD>
                  <Badge variant={STATUS_VARIANT[u.status] ?? 'secondary'}>{u.status}</Badge>
                </TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Remover ${u.name}?`)) deleteMut.mutate(u.id);
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
                <TD colSpan={5} className="text-muted-foreground text-center">
                  Nenhum utilizador encontrado.
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
        <UserFormDialog
          editing={editing}
          onClose={() => setModalOpen(false)}
          onSubmit={(values) => {
            if (editing) {
              updateMut.mutate({ id: editing.id, input: values.update });
            } else {
              createMut.mutate(values.create!);
            }
          }}
          saving={createMut.isPending || updateMut.isPending}
        />
      )}
    </div>
  );
}

function UserFormDialog({
  editing,
  onClose,
  onSubmit,
  saving,
}: {
  editing: UserDTO | null;
  onClose: () => void;
  onSubmit: (v: {
    create?: Parameters<typeof createUser>[0];
    update: Parameters<typeof updateUser>[1];
  }) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(editing?.name ?? '');
  const [email, setEmail] = useState(editing?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserDTO['role']>(editing?.role ?? 'STUDENT');
  const [phone, setPhone] = useState(editing?.phone ?? '');
  const [status, setStatus] = useState<string>(editing?.status ?? 'ACTIVE');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (editing) {
      onSubmit({
        update: { name, role, phone: phone || undefined, status: status as never },
      });
    } else {
      onSubmit({
        create: { name, email, password, role, phone: phone || undefined },
        update: {},
      });
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={editing ? 'Editar utilizador' : 'Novo utilizador'}
      description={editing ? 'Atualize os dados do utilizador.' : 'Crie uma nova conta.'}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            disabled={!!editing}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {!editing && (
          <div className="space-y-1.5">
            <Label htmlFor="password">Palavra-passe</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="role">Perfil</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserDTO['role'])}
              className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          {editing && (
            <div className="space-y-1.5">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
              >
                {['ACTIVE', 'PENDING', 'SUSPENDED', 'INACTIVE'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefone (opcional)</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
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
