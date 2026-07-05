import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  useMyRegistrations,
  useAssessmentPlan,
  useGradesByClass,
  getGradesByRegistration,
  getAverage,
  bulkRecordGrades,
  extractApiError,
} from '@/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/auth-provider';

export function GradesPage() {
  const { user } = useAuth();
  const myRegQ = useMyRegistrations();
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const classes = myRegQ.data?.filter((r) => r.status === 'ACTIVE').map((r) => r.class) ?? [];
  const uniqueClasses = classes.filter((c, i, arr) => arr.findIndex((x) => x?.id === c?.id) === i);

  const isStudent = user?.role === 'STUDENT';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notas</h1>
        <p className="text-muted-foreground text-sm">
          {isStudent ? 'As suas notas e média' : 'Registar e consultar notas dos alunos'}
        </p>
      </div>

      {isStudent ? (
        <StudentGradesView />
      ) : (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Turma</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
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
          {selectedClassId && <TeacherGradesView classId={selectedClassId} />}
        </>
      )}
    </div>
  );
}

function StudentGradesView() {
  const myRegQ = useMyRegistrations();
  const activeRegistrations = myRegQ.data?.filter((r) => r.status === 'ACTIVE') ?? [];

  return (
    <div className="space-y-4">
      {myRegQ.isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      )}
      {activeRegistrations.map((reg) => (
        <StudentRegistrationGrades
          key={reg.id}
          registrationId={reg.id}
          className={reg.class?.discipline.name ?? 'Turma'}
        />
      ))}
      {!myRegQ.isLoading && activeRegistrations.length === 0 && (
        <div className="bg-card text-muted-foreground rounded-lg border p-8 text-center shadow-sm">
          Não tem turmas ativas.
        </div>
      )}
    </div>
  );
}

function StudentRegistrationGrades({
  registrationId,
  className,
}: {
  registrationId: string;
  className: string;
}) {
  const gradesQ = useQuery({
    queryKey: ['grades', 'registration', registrationId],
    queryFn: () => getGradesByRegistration(registrationId),
  });

  const averageQ = useQuery({
    queryKey: ['average', registrationId],
    queryFn: () => getAverage(registrationId),
  });

  return (
    <Card className="p-4">
      <h3 className="mb-2 font-medium">{className}</h3>
      {gradesQ.isLoading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : gradesQ.data && gradesQ.data.length > 0 ? (
        <div className="space-y-2">
          <div className="space-y-1">
            {gradesQ.data.map((grade) => (
              <div key={grade.id} className="flex items-center justify-between text-sm">
                <span>{grade.assessmentItem?.name ?? 'Item'}</span>
                <span className="font-medium">{grade.score}</span>
              </div>
            ))}
          </div>
          {averageQ.data && (
            <div className="border-t pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Média</span>
                <span className={averageQ.data.passed ? 'text-green-600' : 'text-red-600'}>
                  {averageQ.data.average.toFixed(2)} / {averageQ.data.scaleMax}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                {averageQ.data.passed ? 'Aprovado' : 'Reprovado'} · Nota mínima:{' '}
                {averageQ.data.passingScore}
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Sem notas registadas.</p>
      )}
    </Card>
  );
}

function TeacherGradesView({ classId }: { classId: string }) {
  const queryClient = useQueryClient();
  const planQ = useAssessmentPlan(classId);
  const gradesQ = useGradesByClass(classId);

  const myRegQ = useMyRegistrations();
  const registrations =
    myRegQ.data?.filter((r) => r.classId === classId && r.status === 'ACTIVE') ?? [];

  const [grades, setGrades] = useState<Record<string, Record<string, number>>>({});

  const plan = planQ.data;
  const items = plan?.items ?? [];

  function updateGrade(registrationId: string, itemId: string, score: number) {
    setGrades((prev) => ({
      ...prev,
      [registrationId]: {
        ...prev[registrationId],
        [itemId]: score,
      },
    }));
  }

  const bulkMut = useMutation({
    mutationFn: () => {
      const gradesToSubmit = Object.entries(grades).flatMap(([regId, itemGrades]) =>
        Object.entries(itemGrades).map(([itemId, score]) => ({
          registrationId: regId,
          assessmentItemId: itemId,
          score,
        })),
      );
      return bulkRecordGrades(classId, 'current', gradesToSubmit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades', 'class', classId] });
      toast.success('Notas registadas com sucesso');
    },
    onError: (e) => toast.error(extractApiError(e).message),
  });

  const hasChanges = Object.keys(grades).length > 0;

  return (
    <div className="space-y-4">
      {planQ.isLoading || gradesQ.isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      ) : !plan ? (
        <div className="bg-card text-muted-foreground rounded-lg border p-8 text-center shadow-sm">
          Nenhum plano de avaliação definido para esta turma.
        </div>
      ) : (
        <>
          <Card className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 pr-4 text-left font-medium">Aluno</th>
                  {items.map((item) => (
                    <th key={item.id} className="px-2 pb-2 text-center font-medium">
                      {item.name}
                      <br />
                      <span className="text-muted-foreground text-xs">({item.weight}%)</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{reg.student?.name}</td>
                    {items.map((item) => {
                      const existingGrade = gradesQ.data?.find(
                        (g) => g.registrationId === reg.id && g.assessmentItemId === item.id,
                      );
                      return (
                        <td key={item.id} className="px-2 py-2">
                          <input
                            type="number"
                            min={0}
                            max={item.maxScore}
                            defaultValue={existingGrade?.score ?? ''}
                            onChange={(e) => updateGrade(reg.id, item.id, Number(e.target.value))}
                            className="border-input bg-background flex h-8 w-16 rounded-md border px-2 text-center text-sm"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {hasChanges && (
            <div className="flex justify-end">
              <Button onClick={() => bulkMut.mutate()} disabled={bulkMut.isPending}>
                {bulkMut.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}{' '}
                Guardar alterações
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
