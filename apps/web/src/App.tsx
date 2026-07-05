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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
