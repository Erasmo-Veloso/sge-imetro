import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { RequireAuth, RequireRole } from '@/features/auth/route-guards';
import { LoginPage } from '@/features/auth/login-page';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { UsersPage } from '@/features/users/users-page';
import { CoursesPage } from '@/features/courses/courses-page';
import { DisciplinesPage } from '@/features/disciplines/disciplines-page';

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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
