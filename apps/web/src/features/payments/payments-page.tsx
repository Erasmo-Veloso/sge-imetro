import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { createPayment, processPayment, extractApiError, useMyPayments, usePayments } from '@/api';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/auth-provider';
import { TBody, TD, TH, THead, Table, TR } from '@/components/ui/table';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  PENDING: 'warning',
  COMPLETED: 'success',
  FAILED: 'destructive',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  COMPLETED: 'Concluído',
  FAILED: 'Falhou',
};

export function PaymentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pagamentos</h1>
        <p className="text-muted-foreground text-sm">
          {isAdmin ? 'Gerir pagamentos dos estudantes' : 'Gestão dos seus pagamentos'}
        </p>
      </div>

      {isAdmin ? <AdminPaymentsView /> : <StudentPaymentsView />}
    </div>
  );
}

function StudentPaymentsView() {
  const myQ = useMyPayments();
  const [modalOpen, setModalOpen] = useState(false);
  const [processPaymentId, setProcessPaymentId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="size-4" /> Novo pagamento
        </Button>
      </div>

      <div className="space-y-3">
        {myQ.isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
          </div>
        )}
        {myQ.data?.map((p) => (
          <div key={p.id} className="bg-card rounded-lg border p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{p.concept}</p>
                <p className="text-muted-foreground text-sm">
                  {p.amount.toLocaleString('pt-PT', { style: 'currency', currency: 'MZN' })}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {new Date(p.createdAt).toLocaleDateString('pt-PT')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[p.status] ?? 'secondary'}>
                  {STATUS_LABEL[p.status] ?? p.status}
                </Badge>
                {p.status === 'PENDING' && (
                  <Button variant="outline" size="sm" onClick={() => setProcessPaymentId(p.id)}>
                    <CreditCard className="size-4" /> Pagar
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
        {!myQ.isLoading && myQ.data && myQ.data.length === 0 && (
          <div className="bg-card text-muted-foreground rounded-lg border p-8 text-center shadow-sm">
            Ainda não tem pagamentos. Clique em "Novo pagamento" para começar.
          </div>
        )}
      </div>

      {modalOpen && <NewPaymentDialog onClose={() => setModalOpen(false)} />}
      {processPaymentId && (
        <ProcessPaymentDialog
          paymentId={processPaymentId}
          onClose={() => setProcessPaymentId(null)}
        />
      )}
    </div>
  );
}

function NewPaymentDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');

  const mut = useMutation({
    mutationFn: () => createPayment({ amount: parseFloat(amount), concept }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'mine'] });
      toast.success('Pagamento criado com sucesso');
      onClose();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title="Novo pagamento"
      description="Insira os dados do pagamento."
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Montante (MZN)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Conceito</label>
          <Input
            placeholder="Ex: Propina semestral"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={!amount || !concept || mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ? 'A criar…' : 'Criar pagamento'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function ProcessPaymentDialog({ paymentId, onClose }: { paymentId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');

  const mut = useMutation({
    mutationFn: () => processPayment({ paymentId, phone, pin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Pagamento processado com sucesso');
      onClose();
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title="Processar pagamento"
      description="Insira os dados do gateway de pagamento."
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Telefone</label>
          <Input
            type="tel"
            placeholder="840000000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">PIN</label>
          <Input
            type="password"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={!phone || !pin || mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CreditCard className="size-4" />
            )}{' '}
            Pagar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function AdminPaymentsView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = usePayments({
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
          {['PENDING', 'COMPLETED', 'FAILED'].map((s) => (
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
              <TH>Conceito</TH>
              <TH>Montante</TH>
              <TH>Gateway</TH>
              <TH>Estado</TH>
              <TH>Data</TH>
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
            {data?.items.map((p) => (
              <TR key={p.id}>
                <TD className="font-medium">{p.user?.name ?? '—'}</TD>
                <TD className="text-muted-foreground">{p.concept}</TD>
                <TD>{p.amount.toLocaleString('pt-PT', { style: 'currency', currency: 'MZN' })}</TD>
                <TD className="text-muted-foreground">{p.gateway}</TD>
                <TD>
                  <Badge variant={STATUS_VARIANT[p.status] ?? 'secondary'}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </Badge>
                </TD>
                <TD className="text-muted-foreground">
                  {new Date(p.createdAt).toLocaleDateString('pt-PT')}
                </TD>
              </TR>
            ))}
            {!isLoading && data && data.items.length === 0 && (
              <TR>
                <TD colSpan={6} className="text-muted-foreground text-center">
                  Nenhum pagamento encontrado.
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
    </div>
  );
}
