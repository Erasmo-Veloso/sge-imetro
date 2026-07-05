import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { RequireAuth, RequireRole } from '@/features/auth/route-guards';
import { LoginPage } from '@/features/auth/login-page';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { UsersPage } from '@/features/users/users-page';
import { CoursesPage } from '@/features/courses/courses-page';
import { DisciplinesPage } from '@/features/disciplines/disciplines-page';
import { SelectionProcessesPage } from '@/features/selection-processes/selection-processes-page';
import { EnrollmentsPage } from '@/features/enrollments/enrollments-page';
import { ReviewEnrollmentsPage } from '@/features/enrollments/review-page';
import { RegistrationsPage } from '@/features/registrations/registrations-page';
import { ClassesPage } from '@/features/classes/classes-page';
import { AssessmentPlanPage } from '@/features/assessment/assessment-plan-page';
import { GradesPage } from '@/features/grades/grades-page';
import { AttendancePage } from '@/features/attendance/attendance-page';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/users"
        element={
          <RequireRole roles={['ADMIN']}>
            <AppLayout>
              <UsersPage />
            </AppLayout>
          </RequireRole>
        }
      />
      <Route
        path="/courses"
        element={
          <RequireAuth>
            <AppLayout>
              <CoursesPage />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/disciplines"
        element={
          <RequireAuth>
            <AppLayout>
              <DisciplinesPage />
            </AppLayout>
          </RequireAuth>
        }
      />

      {/* Sprint 2 — Inscrição & Matrícula */}
      <Route
        path="/classes"
        element={
          <RequireRole roles={['ADMIN', 'TEACHER']}>
            <AppLayout>
              <ClassesPage />
            </AppLayout>
          </RequireRole>
        }
      />
      <Route
        path="/selection-processes"
        element={
          <RequireRole roles={['ADMIN']}>
            <AppLayout>
              <SelectionProcessesPage />
            </AppLayout>
          </RequireRole>
        }
      />
      <Route
        path="/enrollments"
        element={
          <RequireAuth>
            <AppLayout>
              <EnrollmentsPage />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/review-enrollments"
        element={
          <RequireRole roles={['ADMIN']}>
            <AppLayout>
              <ReviewEnrollmentsPage />
            </AppLayout>
          </RequireRole>
        }
      />
      <Route
        path="/registrations"
        element={
          <RequireAuth>
            <AppLayout>
              <RegistrationsPage />
            </AppLayout>
          </RequireAuth>
        }
      />

      {/* Sprint 3 — Avaliação, Notas, Presença */}
      <Route
        path="/assessment"
        element={
          <RequireRole roles={['TEACHER', 'ADMIN']}>
            <AppLayout>
              <AssessmentPlanPage />
            </AppLayout>
          </RequireRole>
        }
      />
      <Route
        path="/grades"
        element={
          <RequireAuth>
            <AppLayout>
              <GradesPage />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/attendance"
        element={
          <RequireAuth>
            <AppLayout>
              <AttendancePage />
            </AppLayout>
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
