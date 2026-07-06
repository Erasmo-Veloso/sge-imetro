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

// ── Classes ────────────────────────────────────────
export interface ClassDTO {
  id: string;
  disciplineId: string;
  teacherId: string | null;
  year: number;
  period: 'FIRST' | 'SECOND';
  capacity: number;
  schedule: string | null;
  room: string | null;
  createdAt: string;
  discipline?: { id: string; name: string; code: string };
  teacher?: { id: string; name: string; email: string } | null;
  _count?: { registrations: number };
}

export interface ClassInput {
  disciplineId: string;
  teacherId?: string;
  year: number;
  period?: string;
  capacity?: number;
  schedule?: string;
  room?: string;
}

export async function listClasses(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  year?: number;
}) {
  const res = await api.get<PageResult<ClassDTO>>('/classes', { params });
  return res.data;
}

export async function getClass(id: string): Promise<ClassDTO> {
  const res = await api.get<ClassDTO>(`/classes/${id}`);
  return res.data;
}

export async function createClass(input: ClassInput): Promise<ClassDTO> {
  const res = await api.post<ClassDTO>('/classes', input);
  return res.data;
}

export async function updateClass(id: string, input: Partial<ClassInput>): Promise<ClassDTO> {
  const res = await api.patch<ClassDTO>(`/classes/${id}`, input);
  return res.data;
}

export async function deleteClass(id: string): Promise<void> {
  await api.delete(`/classes/${id}`);
}

export function useClasses(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  year?: number;
}) {
  return useQuery({
    queryKey: ['classes', params],
    queryFn: () => listClasses(params),
    placeholderData: (prev) => prev,
  });
}

// ── Assessment Plans ───────────────────────────────
export interface AssessmentPlanDTO {
  id: string;
  classId: string;
  scaleMax: number;
  passingScore: number;
  minAttendancePct: number;
  roundingRule: 'FLOOR' | 'CEIL' | 'ROUND' | 'NONE';
  items: AssessmentItemDTO[];
  createdAt: string;
}

export interface AssessmentItemDTO {
  id: string;
  planId: string;
  type: 'FREQUENCY' | 'TEST' | 'EXAM' | 'PROJECT' | 'HOMEWORK';
  name: string;
  weight: number;
  maxScore: number;
  order: number;
}

export async function getAssessmentPlan(classId: string): Promise<AssessmentPlanDTO> {
  const res = await api.get<AssessmentPlanDTO>(`/classes/${classId}/assessment-plan`);
  return res.data;
}

export async function createAssessmentPlan(
  classId: string,
  input: {
    scaleMax?: number;
    passingScore?: number;
    minAttendancePct?: number;
    roundingRule?: string;
    items: { type: string; name: string; weight: number; order?: number }[];
  },
): Promise<AssessmentPlanDTO> {
  const res = await api.post<AssessmentPlanDTO>(`/classes/${classId}/assessment-plan`, input);
  return res.data;
}

export async function updateAssessmentPlan(
  id: string,
  input: Partial<{
    scaleMax: number;
    passingScore: number;
    minAttendancePct: number;
    roundingRule: string;
    items: { type: string; name: string; weight: number; order?: number }[];
  }>,
): Promise<AssessmentPlanDTO> {
  const res = await api.patch<AssessmentPlanDTO>(`/assessment-plans/${id}`, input);
  return res.data;
}

export function useAssessmentPlan(classId: string) {
  return useQuery({
    queryKey: ['assessment-plan', classId],
    queryFn: () => getAssessmentPlan(classId),
    enabled: !!classId,
  });
}

// ── Grades ─────────────────────────────────────────
export interface GradeDTO {
  id: string;
  registrationId: string;
  assessmentItemId: string;
  score: number;
  note: string | null;
  recordedById: string;
  createdAt: string;
  assessmentItem?: AssessmentItemDTO;
  registration?: RegistrationDTO;
}

export interface AverageDTO {
  registrationId: string;
  average: number;
  passed: boolean;
  passingScore: number;
  scaleMax: number;
  totalWeight: number;
}

export async function bulkRecordGrades(
  classId: string,
  grades: { registrationId: string; assessmentItemId: string; score: number; note?: string }[],
): Promise<GradeDTO[]> {
  const res = await api.post<GradeDTO[]>(`/classes/${classId}/grades`, {
    grades,
  });
  return res.data;
}

export async function getGradesByRegistration(registrationId: string): Promise<GradeDTO[]> {
  const res = await api.get<GradeDTO[]>(`/registrations/${registrationId}/grades`);
  return res.data;
}

export async function getAverage(registrationId: string): Promise<AverageDTO> {
  const res = await api.get<AverageDTO>(`/registrations/${registrationId}/average`);
  return res.data;
}

export async function getGradesByClass(classId: string): Promise<GradeDTO[]> {
  const res = await api.get<GradeDTO[]>(`/classes/${classId}/grades`);
  return res.data;
}

// ── Attendance ─────────────────────────────────────
export interface ClassSessionDTO {
  id: string;
  classId: string;
  date: string;
  qrToken: string | null;
  qrExpiresAt: string | null;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  closedAt: string | null;
  qrDataUrl?: string;
}

export interface AttendanceDTO {
  id: string;
  registrationId: string;
  classSessionId: string;
  status: 'PRESENT' | 'ABSENT' | 'JUSTIFIED' | 'LATE';
  method: 'MANUAL' | 'QR';
  markedAt: string;
  registration?: RegistrationDTO;
}

export async function createSession(classId: string): Promise<ClassSessionDTO> {
  const res = await api.post<ClassSessionDTO>(`/classes/${classId}/sessions`);
  return res.data;
}

export async function verifyQr(sessionId: string, qrToken: string): Promise<AttendanceDTO> {
  const res = await api.post<AttendanceDTO>(`/sessions/${sessionId}/verify-qr`, { qrToken });
  return res.data;
}

export async function recordManualAttendance(
  classId: string,
  sessionId: string,
  input: { registrationId: string; status: string },
): Promise<AttendanceDTO> {
  const res = await api.post<AttendanceDTO>(
    `/classes/${classId}/sessions/${sessionId}/attendances`,
    input,
  );
  return res.data;
}

export async function listSessions(classId: string): Promise<ClassSessionDTO[]> {
  const res = await api.get<ClassSessionDTO[]>(`/classes/${classId}/sessions`);
  return res.data;
}

export async function listAttendances(sessionId: string): Promise<AttendanceDTO[]> {
  const res = await api.get<AttendanceDTO[]>(`/sessions/${sessionId}/attendances`);
  return res.data;
}

export async function updateAttendance(id: string, status: string): Promise<AttendanceDTO> {
  const res = await api.patch<AttendanceDTO>(`/attendance/${id}`, { status });
  return res.data;
}

export async function closeSession(sessionId: string): Promise<ClassSessionDTO> {
  const res = await api.patch<ClassSessionDTO>(`/sessions/${sessionId}/close`, {});
  return res.data;
}

export async function getSession(sessionId: string): Promise<ClassSessionDTO> {
  const res = await api.get<ClassSessionDTO>(`/sessions/${sessionId}`);
  return res.data;
}

export function useClassSessions(classId: string) {
  return useQuery({
    queryKey: ['sessions', classId],
    queryFn: () => listSessions(classId),
    enabled: !!classId,
  });
}

export function useAttendances(sessionId: string) {
  return useQuery({
    queryKey: ['attendances', sessionId],
    queryFn: () => listAttendances(sessionId),
    enabled: !!sessionId,
  });
}

export function useGradesByClass(classId: string) {
  return useQuery({
    queryKey: ['grades', 'class', classId],
    queryFn: () => getGradesByClass(classId),
    enabled: !!classId,
  });
}

// ── Payments ───────────────────────────────────────
export interface PaymentDTO {
  id: string;
  userId: string;
  amount: number;
  concept: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  gateway: string;
  reference: string | null;
  rawResponse: Record<string, unknown> | null;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

export async function createPayment(input: {
  amount: number;
  concept: string;
}): Promise<PaymentDTO> {
  const res = await api.post<PaymentDTO>('/payments', input);
  return res.data;
}

export async function processPayment(input: {
  paymentId: string;
  phone: string;
  pin: string;
}): Promise<PaymentDTO> {
  const res = await api.post<PaymentDTO>('/payments/process', input);
  return res.data;
}

export async function myPayments(): Promise<PaymentDTO[]> {
  const res = await api.get<PaymentDTO[]>('/payments/mine');
  return res.data;
}

export async function listPayments(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}) {
  const res = await api.get<PageResult<PaymentDTO>>('/payments', { params });
  return res.data;
}

export function useMyPayments() {
  return useQuery({
    queryKey: ['payments', 'mine'],
    queryFn: () => myPayments(),
  });
}

export function usePayments(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => listPayments(params),
    placeholderData: (prev) => prev,
  });
}

// ── Audit Documents ────────────────────────────────
export interface AuditDocumentDTO {
  id: string;
  ownerId: string;
  type: string;
  fileUrl: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

export async function uploadAuditDocument(file: File, type: string): Promise<AuditDocumentDTO> {
  const form = new FormData();
  form.append('file', file);
  form.append('type', type);
  const res = await api.post<AuditDocumentDTO>('/audit/documents', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function myAuditDocuments(): Promise<AuditDocumentDTO[]> {
  const res = await api.get<AuditDocumentDTO[]>('/audit/documents/mine');
  return res.data;
}

export async function listAuditDocuments(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}) {
  const res = await api.get<PageResult<AuditDocumentDTO>>('/audit/documents', { params });
  return res.data;
}

export async function verifyAuditDocument(
  documentId: string,
  decision: 'VERIFIED' | 'REJECTED',
  note?: string,
): Promise<AuditDocumentDTO> {
  const res = await api.post<AuditDocumentDTO>(`/audit/documents/${documentId}/verify`, {
    decision,
    note,
  });
  return res.data;
}

export function useMyAuditDocuments() {
  return useQuery({
    queryKey: ['audit-documents', 'mine'],
    queryFn: () => myAuditDocuments(),
  });
}

export function useAuditDocuments(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['audit-documents', params],
    queryFn: () => listAuditDocuments(params),
    placeholderData: (prev) => prev,
  });
}

// ── Legacy Import ────────────────────────────────
export interface LegacyImportDTO {
  id: string;
  type: 'CSV' | 'SQL';
  filename: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalRecords: number;
  processedRecords: number;
  errorRecords: number;
  errors: unknown[] | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export async function uploadLegacyFile(
  file: File,
  type: 'CSV' | 'SQL',
  mapping?: Record<string, string>,
): Promise<LegacyImportDTO> {
  const form = new FormData();
  form.append('file', file);
  form.append('type', type);
  if (mapping) form.append('mapping', JSON.stringify(mapping));
  const res = await api.post<LegacyImportDTO>('/legacy/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function listLegacyImports(params: { page?: number; pageSize?: number }) {
  const res = await api.get<PageResult<LegacyImportDTO>>('/legacy/imports', { params });
  return res.data;
}

export async function getLegacyImportStatus(id: string): Promise<LegacyImportDTO> {
  const res = await api.get<LegacyImportDTO>(`/legacy/imports/${id}`);
  return res.data;
}

export function useLegacyImports(params: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['legacy-imports', params],
    queryFn: () => listLegacyImports(params),
    placeholderData: (prev) => prev,
  });
}
