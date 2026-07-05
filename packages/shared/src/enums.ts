export const UserRole = {
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
  SUSPENDED: 'SUSPENDED',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const CourseStatus = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;
export type CourseStatus = (typeof CourseStatus)[keyof typeof CourseStatus];

export const SemesterPeriod = {
  FIRST: 'FIRST',
  SECOND: 'SECOND',
} as const;
export type SemesterPeriod = (typeof SemesterPeriod)[keyof typeof SemesterPeriod];

export const EnrollmentStatus = {
  SUBMITTED: 'SUBMITTED',
  IN_REVIEW: 'IN_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  WAITLIST: 'WAITLIST',
} as const;
export type EnrollmentStatus = (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus];

export const RegistrationStatus = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;
export type RegistrationStatus = (typeof RegistrationStatus)[keyof typeof RegistrationStatus];

export const AssessmentType = {
  FREQUENCY: 'FREQUENCY',
  TEST: 'TEST',
  EXAM: 'EXAM',
  PROJECT: 'PROJECT',
  HOMEWORK: 'HOMEWORK',
} as const;
export type AssessmentType = (typeof AssessmentType)[keyof typeof AssessmentType];

export const RoundingRule = {
  FLOOR: 'FLOOR',
  CEIL: 'CEIL',
  ROUND: 'ROUND',
  NONE: 'NONE',
} as const;
export type RoundingRule = (typeof RoundingRule)[keyof typeof RoundingRule];

export const AttendanceMethod = {
  MANUAL: 'MANUAL',
  QR: 'QR',
} as const;
export type AttendanceMethod = (typeof AttendanceMethod)[keyof typeof AttendanceMethod];

export const AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  JUSTIFIED: 'JUSTIFIED',
  LATE: 'LATE',
} as const;
export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const PaymentStatus = {
  PENDING: 'PENDING',
  AUTHORIZED: 'AUTHORIZED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentGateway = {
  MULTICAIXA_MOCK: 'MULTICAIXA_MOCK',
  MULTICAIXA_EXPRESS: 'MULTICAIXA_EXPRESS',
} as const;
export type PaymentGateway = (typeof PaymentGateway)[keyof typeof PaymentGateway];

export const AuditDocStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;
export type AuditDocStatus = (typeof AuditDocStatus)[keyof typeof AuditDocStatus];

export const AuditDocType = {
  PAYMENT_PROOF: 'PAYMENT_PROOF',
  ENROLLMENT_DOC: 'ENROLLMENT_DOC',
  ID_DOCUMENT: 'ID_DOCUMENT',
  OTHER: 'OTHER',
} as const;
export type AuditDocType = (typeof AuditDocType)[keyof typeof AuditDocType];
