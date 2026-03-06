/**
 * SWR hooks for all BTC entities.
 * Each hook returns { data, error, isLoading, mutate } from SWR.
 * Uses the apiFetch helper which handles auth token refresh automatically.
 */
import useSWR, { mutate as globalMutate } from 'swr';
import { apiFetch } from '../lib/api';

// ─── SWR Fetcher ───
// Wraps apiFetch so SWR can use our authenticated fetcher
const fetcher = (path: string) => apiFetch(path);

// ─── Re-export mutate for manual cache invalidation ───
export { globalMutate };

// ──────────────────────────────────────
// DASHBOARD STATS
// ──────────────────────────────────────
export interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  totalCourses: number;
  totalPrograms: number;
  totalPayments: number;
  totalRevenue: number;
  pendingPayments: number;
  totalEnrollments: number;
  recentStudents: any[];
  recentPayments: any[];
}

export function useStats() {
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>('/stats', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
  return { stats: data, error, isLoading, mutate };
}

// ──────────────────────────────────────
// DEPARTMENTS
// ──────────────────────────────────────
export interface Department {
  id: string;
  name: string;
  name_fr: string;
  slug: string;
  description: string;
  description_fr: string;
  icon: string;
  color: string;
  head_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export function useDepartments() {
  const { data, error, isLoading, mutate } = useSWR<{ departments: Department[] }>(
    '/departments', fetcher, { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  return { departments: data?.departments || [], error, isLoading, mutate };
}

// ──────────────────────────────────────
// PROGRAMS
// ──────────────────────────────────────
export interface Program {
  id: string;
  name: string;
  name_fr: string;
  department_id: string;
  description: string;
  description_fr: string;
  duration: string;
  duration_months: number;
  level: string;
  max_students: number;
  status: string;
  fees: any[];
  total_fee_usd: number;
  image_url: string;
  sort_order: number;
  departments?: Department;
  created_at: string;
}

export function usePrograms() {
  const { data, error, isLoading, mutate } = useSWR<{ programs: Program[] }>(
    '/programs', fetcher, { revalidateOnFocus: false, dedupingInterval: 30000 }
  );
  return { programs: data?.programs || [], error, isLoading, mutate };
}

// ──────────────────────────────────────
// STUDENTS (profiles with role=student)
// ──────────────────────────────────────
export interface StudentProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  department_id: string | null;
  phone: string;
  avatar_url: string;
  is_active: boolean;
  student_id_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string;
  created_at: string;
  departments?: { name: string; name_fr: string; slug: string } | null;
}

export function useStudents() {
  const { data, error, isLoading, mutate } = useSWR<{ students: StudentProfile[] }>(
    '/students', fetcher, { revalidateOnFocus: false, dedupingInterval: 15000 }
  );
  return { students: data?.students || [], error, isLoading, mutate };
}

// ──────────────────────────────────────
// STAFF (profiles with role=admin/staff)
// ──────────────────────────────────────
export interface StaffProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  department_id: string | null;
  phone: string;
  avatar_url: string;
  is_active: boolean;
  specialization: string;
  hire_date: string | null;
  is_super_admin: boolean;
  created_at: string;
  departments?: { name: string; name_fr: string; slug: string } | null;
}

export function useStaff() {
  const { data, error, isLoading, mutate } = useSWR<{ staff: StaffProfile[] }>(
    '/staff', fetcher, { revalidateOnFocus: false, dedupingInterval: 15000 }
  );
  return { staff: data?.staff || [], error, isLoading, mutate };
}

// ──────────────────────────────────────
// PAYMENTS
// ──────────────────────────────────────
export interface Payment {
  id: string;
  student_id: string;
  program_id: string | null;
  enrollment_id: string | null;
  amount: number;
  currency: string;
  payment_mode: string;
  status: string;
  fee_item_id: string;
  fee_item_name: string;
  receipt_url: string;
  transaction_ref: string;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string;
  description: string;
  notes: string;
  paid_at: string;
  created_at: string;
  student?: { id: string; name: string; email: string; student_id_number: string | null };
  programs?: { id: string; name: string; name_fr: string; departments?: { name: string; slug: string; color: string } };
}

export function usePayments() {
  const { data, error, isLoading, mutate } = useSWR<{ payments: Payment[] }>(
    '/payments', fetcher, { revalidateOnFocus: false, dedupingInterval: 15000 }
  );
  return { payments: data?.payments || [], error, isLoading, mutate };
}

export function useMyPayments() {
  const { data, error, isLoading, mutate } = useSWR<{ payments: Payment[] }>(
    '/payments/my', fetcher, { revalidateOnFocus: false, dedupingInterval: 15000 }
  );
  return { payments: data?.payments || [], error, isLoading, mutate };
}

// ──────────────────────────────────────
// ENROLLMENTS
// ──────────────────────────────────────
export interface Enrollment {
  id: string;
  student_id: string;
  program_id: string | null;
  course_id: string | null;
  status: string;
  enrolled_at: string;
  completed_at: string | null;
  progress: number;
  grade: string;
  student?: { id: string; name: string; email: string; student_id_number: string | null };
  programs?: { id: string; name: string; name_fr: string };
  courses?: { id: string; name: string; name_fr: string };
}

export function useEnrollments() {
  const { data, error, isLoading, mutate } = useSWR<{ enrollments: Enrollment[] }>(
    '/enrollments', fetcher, { revalidateOnFocus: false, dedupingInterval: 15000 }
  );
  return { enrollments: data?.enrollments || [], error, isLoading, mutate };
}

export function useMyEnrollments() {
  const { data, error, isLoading, mutate } = useSWR<{ enrollments: Enrollment[] }>(
    '/enrollments/my', fetcher, { revalidateOnFocus: false, dedupingInterval: 15000 }
  );
  return { enrollments: data?.enrollments || [], error, isLoading, mutate };
}

// ──────────────────────────────────────
// COURSES
// ──────────────────────────────────────
export interface Course {
  id: string;
  name: string;
  name_fr: string;
  code: string | null;
  department_id: string;
  program_id: string | null;
  instructor_id: string | null;
  description: string;
  credits: number;
  max_students: number;
  schedule: any;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  is_published: boolean;
  created_at: string;
  departments?: { id: string; name: string; name_fr: string; slug: string; color: string };
  programs?: { id: string; name: string; name_fr: string };
  instructor?: { id: string; name: string; email: string };
}

export function useCourses() {
  const { data, error, isLoading, mutate } = useSWR<{ courses: Course[] }>(
    '/courses', fetcher, { revalidateOnFocus: false, dedupingInterval: 30000 }
  );
  return { courses: data?.courses || [], error, isLoading, mutate };
}

// ──────────────────────────────────────
// CERTIFICATES
// ──────────────────────────────────────
export interface Certificate {
  id: string;
  student_id: string;
  program_id: string | null;
  course_id: string | null;
  certificate_number: string;
  title: string;
  title_fr: string;
  description: string;
  grade: string;
  issue_date: string;
  expiry_date: string | null;
  pdf_url: string;
  is_valid: boolean;
  created_at: string;
  student?: { id: string; name: string; email: string; student_id_number: string | null };
  programs?: { id: string; name: string; name_fr: string };
  courses?: { id: string; name: string; name_fr: string };
}

export function useCertificates() {
  const { data, error, isLoading, mutate } = useSWR<{ certificates: Certificate[] }>(
    '/certificates', fetcher, { revalidateOnFocus: false, dedupingInterval: 30000 }
  );
  return { certificates: data?.certificates || [], error, isLoading, mutate };
}

export function useMyCertificates() {
  const { data, error, isLoading, mutate } = useSWR<{ certificates: Certificate[] }>(
    '/certificates/my', fetcher, { revalidateOnFocus: false, dedupingInterval: 30000 }
  );
  return { certificates: data?.certificates || [], error, isLoading, mutate };
}

// ──────────────────────────────────────
// ATTENDANCE
// ──────────────────────────────────────
export interface AttendanceRecord {
  id: string;
  student_id: string;
  course_id: string;
  date: string;
  status: string;
  check_in_time: string | null;
  notes: string;
  marked_by: string | null;
  student?: { id: string; name: string; email: string; student_id_number: string | null };
  courses?: { id: string; name: string; name_fr: string };
}

export function useAttendance() {
  const { data, error, isLoading, mutate } = useSWR<{ attendance: AttendanceRecord[] }>(
    '/attendance', fetcher, { revalidateOnFocus: false, dedupingInterval: 15000 }
  );
  return { attendance: data?.attendance || [], error, isLoading, mutate };
}

export function useMyAttendance() {
  const { data, error, isLoading, mutate } = useSWR<{ attendance: AttendanceRecord[] }>(
    '/attendance/my', fetcher, { revalidateOnFocus: false, dedupingInterval: 15000 }
  );
  return { attendance: data?.attendance || [], error, isLoading, mutate };
}

// ──────────────────────────────────────
// NOTIFICATIONS
// ──────────────────────────────────────
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string;
  created_at: string;
}

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR<{ notifications: Notification[] }>(
    '/notifications', fetcher, { revalidateOnFocus: true, refreshInterval: 60000 }
  );
  return { notifications: data?.notifications || [], error, isLoading, mutate };
}

// ──────────────────────────────────────
// CONTACT MESSAGES (admin)
// ──────────────────────────────────────
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  replied_at: string | null;
  reply_text: string;
  created_at: string;
}

export function useContactMessages() {
  const { data, error, isLoading, mutate } = useSWR<{ messages: ContactMessage[] }>(
    '/contact', fetcher, { revalidateOnFocus: false, dedupingInterval: 30000 }
  );
  return { messages: data?.messages || [], error, isLoading, mutate };
}

// ──────────────────────────────────────
// SETTINGS
// ──────────────────────────────────────
export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR<{ settings: any[] }>(
    '/settings', fetcher, { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  return { settings: data?.settings || [], error, isLoading, mutate };
}

// ──────────────────────────────────────
// VIEWS (aggregated reports)
// ──────────────────────────────────────
export function useStudentOverview() {
  const { data, error, isLoading, mutate } = useSWR<{ students: any[] }>(
    '/views/student-overview', fetcher, { revalidateOnFocus: false, dedupingInterval: 30000 }
  );
  return { students: data?.students || [], error, isLoading, mutate };
}

export function useDepartmentRevenue() {
  const { data, error, isLoading, mutate } = useSWR<{ departments: any[] }>(
    '/views/department-revenue', fetcher, { revalidateOnFocus: false, dedupingInterval: 30000 }
  );
  return { departments: data?.departments || [], error, isLoading, mutate };
}

export function useMonthlyRevenue() {
  const { data, error, isLoading, mutate } = useSWR<{ revenue: any[] }>(
    '/views/monthly-revenue', fetcher, { revalidateOnFocus: false, dedupingInterval: 30000 }
  );
  return { revenue: data?.revenue || [], error, isLoading, mutate };
}

// ─────────────────────────────────────
// MUTATION HELPERS
// ──────────────────────────────────────
// These call apiFetch for POST/PUT/DELETE and invalidate the relevant SWR cache.

export async function createDepartment(data: any) {
  const result = await apiFetch('/departments', { method: 'POST', body: JSON.stringify(data) });
  globalMutate('/departments');
  globalMutate('/stats');
  return result;
}

export async function updateDepartment(id: string, data: any) {
  const result = await apiFetch(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  globalMutate('/departments');
  return result;
}

export async function deleteDepartment(id: string) {
  const result = await apiFetch(`/departments/${id}`, { method: 'DELETE' });
  globalMutate('/departments');
  globalMutate('/stats');
  return result;
}

export async function createStudent(data: any) {
  const result = await apiFetch('/signup', { method: 'POST', body: JSON.stringify({ ...data, role: 'student' }) });
  globalMutate('/students');
  globalMutate('/stats');
  return result;
}

export async function updateStudent(id: string, data: any) {
  const result = await apiFetch(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  globalMutate('/students');
  return result;
}

export async function deleteStudent(id: string) {
  const result = await apiFetch(`/students/${id}`, { method: 'DELETE' });
  globalMutate('/students');
  globalMutate('/stats');
  return result;
}

export async function createStaffMember(data: any) {
  const result = await apiFetch('/signup', { method: 'POST', body: JSON.stringify({ ...data, role: data.role || 'staff' }) });
  globalMutate('/staff');
  globalMutate('/stats');
  return result;
}

export async function updateStaffMember(id: string, data: any) {
  const result = await apiFetch(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  globalMutate('/staff');
  return result;
}

export async function deleteStaffMember(id: string) {
  const result = await apiFetch(`/staff/${id}`, { method: 'DELETE' });
  globalMutate('/staff');
  globalMutate('/stats');
  return result;
}

export async function createProgram(data: any) {
  const result = await apiFetch('/programs', { method: 'POST', body: JSON.stringify(data) });
  globalMutate('/programs');
  return result;
}

export async function updateProgram(id: string, data: any) {
  const result = await apiFetch(`/programs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  globalMutate('/programs');
  return result;
}

export async function deleteProgram(id: string) {
  const result = await apiFetch(`/programs/${id}`, { method: 'DELETE' });
  globalMutate('/programs');
  return result;
}

export async function createPayment(data: any) {
  const result = await apiFetch('/payments', { method: 'POST', body: JSON.stringify(data) });
  globalMutate('/payments');
  globalMutate('/payments/my');
  globalMutate('/stats');
  return result;
}

export async function approvePayment(id: string) {
  const result = await apiFetch(`/payments/${id}/approve`, { method: 'PUT' });
  globalMutate('/payments');
  globalMutate('/stats');
  return result;
}

export async function rejectPayment(id: string, reason: string) {
  const result = await apiFetch(`/payments/${id}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) });
  globalMutate('/payments');
  return result;
}

export async function createEnrollment(data: any) {
  const result = await apiFetch('/enrollments', { method: 'POST', body: JSON.stringify(data) });
  globalMutate('/enrollments');
  globalMutate('/enrollments/my');
  globalMutate('/stats');
  return result;
}

export async function createCertificate(data: any) {
  const result = await apiFetch('/certificates', { method: 'POST', body: JSON.stringify(data) });
  globalMutate('/certificates');
  globalMutate('/certificates/my');
  return result;
}

export async function submitContactMessage(data: { name: string; email: string; phone?: string; subject?: string; message: string }) {
  return apiFetch('/contact', { method: 'POST', body: JSON.stringify(data) });
}

export async function markAttendance(records: any[]) {
  const result = await apiFetch('/attendance', { method: 'POST', body: JSON.stringify(records) });
  globalMutate('/attendance');
  globalMutate('/attendance/my');
  return result;
}

export async function markNotificationRead(id: string) {
  await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
  globalMutate('/notifications');
}