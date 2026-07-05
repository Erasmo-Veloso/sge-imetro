import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { api } from './client';

export { extractApiError, getAccessToken, getRefreshToken, setTokens, clearTokens } from './client';

// ── Types ──────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  status: string;
  phone: string | null;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Auth ────────────────────────────────────────────────
export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/auth/login', { email, password });
  return res.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await api.post('/auth/password/reset/request', { email });
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
  await api.post('/auth/password/reset/confirm', { token, newPassword });
}

// ── Users ───────────────────────────────────────────────
export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  status: string;
  phone: string | null;
  externalCode: string | null;
  createdAt: string;
}

export interface UserInput {
  name: string;
  email: string;
  password: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  phone?: string;
  externalCode?: string;
}

export async function listUsers(params: { page?: number; pageSize?: number; search?: string }) {
  const res = await api.get<PageResult<UserDTO>>('/users', { params });
  return res.data;
}

export async function createUser(input: UserInput): Promise<UserDTO> {
  const res = await api.post<UserDTO>('/users', input);
  return res.data;
}

export async function updateUser(
  id: string,
  input: Partial<Omit<UserInput, 'password'>> & { status?: string },
): Promise<UserDTO> {
  const res = await api.patch<UserDTO>(`/users/${id}`, input);
  return res.data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}

export function useUsers(params: { page?: number; pageSize?: number; search?: string }) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => listUsers(params),
    placeholderData: (prev) => prev,
  });
}

// ── Courses ─────────────────────────────────────────────
export interface CourseDTO {
  id: string;
  name: string;
  code: string;
  description: string | null;
  durationYears: number;
  status: 'ACTIVE' | 'ARCHIVED';
  coordinator: { id: string; name: string } | null;
  createdAt: string;
}

export interface CourseInput {
  name: string;
  code: string;
  description?: string;
  durationYears?: number;
  coordinatorId?: string;
}

export async function listCourses(params: { page?: number; pageSize?: number; search?: string }) {
  const res = await api.get<PageResult<CourseDTO>>('/courses', { params });
  return res.data;
}

export async function createCourse(input: CourseInput): Promise<CourseDTO> {
  const res = await api.post<CourseDTO>('/courses', input);
  return res.data;
}

export async function updateCourse(
  id: string,
  input: Partial<CourseInput> & { status?: 'ACTIVE' | 'ARCHIVED' },
): Promise<CourseDTO> {
  const res = await api.patch<CourseDTO>(`/courses/${id}`, input);
  return res.data;
}

export async function deleteCourse(id: string): Promise<void> {
  await api.delete(`/courses/${id}`);
}

export function useCourses(
  params: { page?: number; pageSize?: number; search?: string },
  options?: Partial<UseQueryOptions<PageResult<CourseDTO>>>,
) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => listCourses(params),
    placeholderData: (prev) => prev,
    ...options,
  });
}

// ── Disciplines ─────────────────────────────────────────
export interface DisciplineDTO {
  id: string;
  courseId: string;
  name: string;
  code: string;
  description: string | null;
  credits: number;
  workloadHrs: number;
  semester: number;
  course: { id: string; name: string; code: string };
}

export interface DisciplineInput {
  courseId: string;
  name: string;
  code: string;
  description?: string;
  credits?: number;
  workloadHrs?: number;
  semester?: number;
}

export async function listDisciplines(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  courseId?: string;
}) {
  const res = await api.get<PageResult<DisciplineDTO>>('/disciplines', { params });
  return res.data;
}

export async function createDiscipline(input: DisciplineInput): Promise<DisciplineDTO> {
  const res = await api.post<DisciplineDTO>('/disciplines', input);
  return res.data;
}

export async function updateDiscipline(
  id: string,
  input: Partial<Omit<DisciplineInput, 'courseId'>>,
): Promise<DisciplineDTO> {
  const res = await api.patch<DisciplineDTO>(`/disciplines/${id}`, input);
  return res.data;
}

export async function deleteDiscipline(id: string): Promise<void> {
  await api.delete(`/disciplines/${id}`);
}

export function useDisciplines(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  courseId?: string;
}) {
  return useQuery({
    queryKey: ['disciplines', params],
    queryFn: () => listDisciplines(params),
    placeholderData: (prev) => prev,
  });
}
