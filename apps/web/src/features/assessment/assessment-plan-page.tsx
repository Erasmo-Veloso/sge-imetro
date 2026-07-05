import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  useMyRegistrations,
  useAssessmentPlan,
  createAssessmentPlan,
  updateAssessmentPlan,
  extractApiError,
  type AssessmentItemDTO,
} from '@/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const ITEM_TYPES: { value: AssessmentItemDTO['type']; label: string }[] = [
  { value: 'FREQUENCY', label: 'Frequência' },
  { value: 'TEST', label: 'Teste' },
  { value: 'EXAM', label: 'Exame' },
  { value: 'PROJECT', label: 'Projeto' },
  { value: 'HOMEWORK', label: 'Trabalho de casa' },
];

const ROUNDING_OPTIONS: { value: string; label: string }[] = [
  { value: 'FLOOR', label: 'Arredondar para baixo' },
  { value: 'CEIL', label: 'Arredondar para cima' },
  { value: 'ROUND', label: 'Arredondar normal' },
  { value: 'NONE', label: 'Sem arredondamento' },
];

interface ItemForm {
  type: AssessmentItemDTO['type'];
  name: string;
  weight: number;
  maxScore: number;
}

export function AssessmentPlanPage() {
  const myRegQ = useMyRegistrations();
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const planQ = useAssessmentPlan(selectedClassId);
  const queryClient = useQueryClient();

  const classes = myRegQ.data?.filter((r) => r.status === 'ACTIVE').map((r) => r.class) ?? [];
  const uniqueClasses = classes.filter((c, i, arr) => arr.findIndex((x) => x?.id === c?.id) === i);

  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<ItemForm[]>([]);
  const [scaleMax, setScaleMax] = useState(20);
  const [passingScore, setPassingScore] = useState(10);
  const [minAttendancePct, setMinAttendancePct] = useState(75);
  const [roundingRule, setRoundingRule] = useState('NONE');

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

  function startCreate() {
    setItems([{ type: 'TEST', name: '', weight: 0, maxScore: 20 }]);
    setEditing(true);
  }

  function startEdit() {
    if (planQ.data) {
      setScaleMax(planQ.data.scaleMax);
      setPassingScore(planQ.data.passingScore);
      setMinAttendancePct(planQ.data.minAttendancePct);
      setRoundingRule(planQ.data.roundingRule);
      setItems(
        planQ.data.items.map((item) => ({
          type: item.type,
          name: item.name,
          weight: item.weight,
          maxScore: item.maxScore,
        })),
      );
      setEditing(true);
    }
  }

  function addItem() {
    setItems([...items, { type: 'TEST', name: '', weight: 0, maxScore: 20 }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof ItemForm, value: string | number) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  }

  const createMut = useMutation({
    mutationFn: () =>
      createAssessmentPlan(selectedClassId, {
        scaleMax,
        passingScore,
        minAttendancePct,
        roundingRule,
        items: items.map((item, i) => ({ ...item, order: i })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-plan', selectedClassId] });
      toast.success('Plano de avaliação criado');
      setEditing(false);
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const updateMut = useMutation({
    mutationFn: () =>
      updateAssessmentPlan(planQ.data!.id, {
        scaleMax,
        passingScore,
        minAttendancePct,
        roundingRule,
        items: items.map((item, i) => ({ ...item, order: i })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-plan', selectedClassId] });
      toast.success('Plano de avaliação atualizado');
      setEditing(false);
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plano de Avaliação</h1>
        <p className="text-muted-foreground text-sm">Defina os critérios de avaliação por turma</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Turma</label>
        <select
          value={selectedClassId}
          onChange={(e) => {
            setSelectedClassId(e.target.value);
            setEditing(false);
          }}
          className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
        >
          <option value="">Selecione uma turma</option>
          {uniqueClasses.map(
            (c) =>
              c && (
                <option key={c.id} value={c.id}>
                  {c.discipline.name} ({c.discipline.code})
                </option>
              ),
          )}
        </select>
      </div>

      {selectedClassId && (
        <div className="space-y-4">
          {planQ.isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="text-muted-foreground size-6 animate-spin" />
            </div>
          )}

          {!planQ.isLoading && !planQ.data && !editing && (
            <Card className="p-6">
              <p className="text-muted-foreground mb-4 text-center">
                Nenhum plano de avaliação definido para esta turma.
              </p>
              <div className="flex justify-center">
                <Button onClick={startCreate}>
                  <Plus className="size-4" /> Criar plano
                </Button>
              </div>
            </Card>
          )}

          {!planQ.isLoading && planQ.data && !editing && (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Escala:</span> {planQ.data.scaleMax}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Nota mínima:</span> {planQ.data.passingScore}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Presença mínima:</span>{' '}
                    {planQ.data.minAttendancePct}%
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Arredondamento:</span> {planQ.data.roundingRule}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Itens:</span> {planQ.data.items.length}
                  </p>
                </div>
                <Button variant="outline" onClick={startEdit}>
                  Editar
                </Button>
              </div>
            </Card>
          )}

          {editing && (
            <Card className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Escala máxima</label>
                  <input
                    type="number"
                    value={scaleMax}
                    onChange={(e) => setScaleMax(Number(e.target.value))}
                    className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nota mínima para aprovação</label>
                  <input
                    type="number"
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Presença mínima (%)</label>
                  <input
                    type="number"
                    value={minAttendancePct}
                    onChange={(e) => setMinAttendancePct(Number(e.target.value))}
                    className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Regra de arredondamento</label>
                  <select
                    value={roundingRule}
                    onChange={(e) => setRoundingRule(e.target.value)}
                    className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                  >
                    {ROUNDING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Itens de avaliação</label>
                  <span
                    className={`text-sm ${totalWeight === 100 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    Total: {totalWeight}%
                  </span>
                </div>

                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <select
                        value={item.type}
                        onChange={(e) => updateItem(index, 'type', e.target.value)}
                        className="border-input bg-background flex h-9 rounded-md border px-3 text-sm"
                      >
                        {ITEM_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Nome"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        className="border-input bg-background flex h-9 flex-1 rounded-md border px-3 text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Peso %"
                        value={item.weight}
                        onChange={(e) => updateItem(index, 'weight', Number(e.target.value))}
                        className="border-input bg-background flex h-9 w-20 rounded-md border px-3 text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={item.maxScore}
                        onChange={(e) => updateItem(index, 'maxScore', Number(e.target.value))}
                        className="border-input bg-background flex h-9 w-20 rounded-md border px-3 text-sm"
                      />
                      <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                        <Trash2 className="text-destructive size-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="size-4" /> Adicionar item
                </Button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
                <Button
                  disabled={
                    totalWeight !== 100 ||
                    items.some((i) => !i.name) ||
                    createMut.isPending ||
                    updateMut.isPending
                  }
                  onClick={() => (planQ.data ? updateMut.mutate() : createMut.mutate())}
                >
                  {createMut.isPending || updateMut.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}{' '}
                  {planQ.data ? 'Guardar' : 'Criar plano'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
