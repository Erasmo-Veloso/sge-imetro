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

// ── Selection Processes ─────────────────────────────────
export interface SelectionProcessDTO {
  id: string;
  courseId: string;
  academicYear: number;
  period: 'FIRST' | 'SECOND';
  title: string;
  description: string | null;
  openDate: string;
  closeDate: string;
  vacancies: number;
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED';
  course: { id: string; name: string; code: string };
  enrolledCount?: number;
  createdAt: string;
}

export interface SelectionProcessInput {
  courseId: string;
  academicYear: number;
  period: 'FIRST' | 'SECOND';
  title: string;
  description?: string;
  openDate: string;
  closeDate: string;
  vacancies: number;
}

export async function listSelectionProcesses(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  courseId?: string;
}) {
  const res = await api.get<PageResult<SelectionProcessDTO>>('/selection-processes', { params });
  return res.data;
}

export async function createSelectionProcess(
  input: SelectionProcessInput,
): Promise<SelectionProcessDTO> {
  const res = await api.post<SelectionProcessDTO>('/selection-processes', input);
  return res.data;
}

export async function updateSelectionProcess(
  id: string,
  input: Partial<SelectionProcessInput> & { status?: string },
): Promise<SelectionProcessDTO> {
  const res = await api.patch<SelectionProcessDTO>(`/selection-processes/${id}`, input);
  return res.data;
}

export async function deleteSelectionProcess(id: string): Promise<void> {
  await api.delete(`/selection-processes/${id}`);
}

export function useSelectionProcesses(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  courseId?: string;
}) {
  return useQuery({
    queryKey: ['selection-processes', params],
    queryFn: () => listSelectionProcesses(params),
    placeholderData: (prev) => prev,
  });
}

// ── Enrollments ─────────────────────────────────────────
export interface EnrollmentDTO {
  id: string;
  userId: string;
  selectionProcessId: string;
  status: 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'WAITLIST';
  reviewNote: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string };
  selectionProcess?: {
    id: string;
    title: string;
    course: { id: string; name: string; code: string };
  };
  reviewedBy?: { id: string; name: string } | null;
  documents?: EnrollmentDocumentDTO[];
}

export interface EnrollmentDocumentDTO {
  id: string;
  enrollmentId: string;
  type: 'ID_DOCUMENT' | 'PAYMENT_PROOF' | 'TRANSCRIPT' | 'PHOTO' | 'OTHER';
  fileUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export async function listEnrollments(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  selectionProcessId?: string;
}) {
  const res = await api.get<PageResult<EnrollmentDTO>>('/enrollments', { params });
  return res.data;
}

export async function myEnrollments(): Promise<EnrollmentDTO[]> {
  const res = await api.get<EnrollmentDTO[]>('/enrollments/mine');
  return res.data;
}

export async function createEnrollment(selectionProcessId: string): Promise<EnrollmentDTO> {
  const res = await api.post<EnrollmentDTO>('/enrollments', { selectionProcessId });
  return res.data;
}

export async function getEnrollment(id: string): Promise<EnrollmentDTO> {
  const res = await api.get<EnrollmentDTO>(`/enrollments/${id}`);
  return res.data;
}

export async function listEnrollmentDocuments(id: string): Promise<EnrollmentDocumentDTO[]> {
  const res = await api.get<EnrollmentDocumentDTO[]>(`/enrollments/${id}/documents`);
  return res.data;
}

export async function uploadEnrollmentDocument(
  enrollmentId: string,
  file: File,
  type: EnrollmentDocumentDTO['type'],
): Promise<EnrollmentDocumentDTO> {
  const form = new FormData();
  form.append('file', file);
  form.append('type', type);
  const res = await api.post<EnrollmentDocumentDTO>(
    `/enrollments/${enrollmentId}/documents`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return res.data;
}

export async function reviewEnrollment(
  id: string,
  decision: 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'WAITLIST',
  reviewNote?: string,
  rejectionReason?: string,
): Promise<EnrollmentDTO> {
  const res = await api.post<EnrollmentDTO>(`/enrollments/${id}/review`, {
    decision,
    reviewNote,
    rejectionReason,
  });
  return res.data;
}

export function useEnrollments(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  selectionProcessId?: string;
}) {
  return useQuery({
    queryKey: ['enrollments', params],
    queryFn: () => listEnrollments(params),
    placeholderData: (prev) => prev,
  });
}

export function useMyEnrollments() {
  return useQuery({
    queryKey: ['enrollments', 'mine'],
    queryFn: () => myEnrollments(),
  });
}

// ── Registrations ───────────────────────────────────────
export interface RegistrationDTO {
  id: string;
  studentId: string;
  classId: string;
  academicYear: number;
  enrollmentId: string | null;
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
  enrolledAt: string;
  cancelledAt: string | null;
  student?: { id: string; name: string; email: string };
  class?: {
    id: string;
    discipline: { id: string; name: string; code: string };
  };
}

export async function listRegistrations(params: {
  page?: number;
  pageSize?: number;
  classId?: string;
  studentId?: string;
  status?: string;
}) {
  const res = await api.get<PageResult<RegistrationDTO>>('/registrations', { params });
  return res.data;
}

export async function myRegistrations(): Promise<RegistrationDTO[]> {
  const res = await api.get<RegistrationDTO[]>('/registrations/mine');
  return res.data;
}

export async function createRegistration(input: {
  classId: string;
  academicYear: number;
  enrollmentId?: string;
}): Promise<RegistrationDTO> {
  const res = await api.post<RegistrationDTO>('/registrations', input);
  return res.data;
}

export async function cancelRegistration(id: string): Promise<void> {
  await api.delete(`/registrations/${id}`);
}

export function useMyRegistrations() {
  return useQuery({
    queryKey: ['registrations', 'mine'],
    queryFn: () => myRegistrations(),
  });
}
