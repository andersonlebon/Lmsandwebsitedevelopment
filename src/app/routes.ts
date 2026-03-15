import { createBrowserRouter } from 'react-router';
import { MainLayout } from './layouts/MainLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { PortalLayout } from './layouts/PortalLayout';
import { StaffLayout } from './layouts/StaffLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetail';
import { Contact } from './pages/Contact';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Setup } from './pages/Setup';
import { Debug } from './pages/Debug';
import { NotFound } from './pages/NotFound';
import { Overview } from './pages/dashboard/Overview';
import { Students } from './pages/dashboard/Students';
import { Staff } from './pages/dashboard/Staff';
import { StaffSchedules } from './pages/dashboard/StaffSchedules';
import { LecturerAttendanceReview } from './pages/dashboard/LecturerAttendanceReview';
import { LecturerRates } from './pages/dashboard/LecturerRates';
import { Financing } from './pages/dashboard/Financing';
import { OnlineStudies } from './pages/dashboard/OnlineStudies';
import { Settings } from './pages/dashboard/Settings';
import { Departments } from './pages/dashboard/Departments';
import { Reports } from './pages/dashboard/Reports';
import { CertificatesAdmin } from './pages/dashboard/CertificatesAdmin';
import { Programs } from './pages/dashboard/Programs';
import { Promotions } from './pages/dashboard/Promotions';
import { FeeStructures } from './pages/dashboard/FeeStructures';
import { ExchangeRates } from './pages/dashboard/ExchangeRates';
import { Enrollments } from './pages/dashboard/Enrollments';
import { LearningActivities } from './pages/dashboard/LearningActivities';
import { Lessons } from './pages/dashboard/Lessons';
import { Classes } from './pages/dashboard/Classes';
import { PeopleLayout, PeopleRedirect } from './pages/dashboard/PeopleLayout';
import { AcademicLayout, AcademicRedirect } from './pages/dashboard/AcademicLayout';
import { FinanceLayout, FinanceRedirect } from './pages/dashboard/FinanceLayout';
import { ReportsCertificatesLayout, ReportsCertificatesRedirect } from './pages/dashboard/ReportsCertificatesLayout';
import { PortalDashboard } from './pages/portal/Dashboard';
import { PortalMyCourses } from './pages/portal/MyCourses';
import { PortalCertificates } from './pages/portal/Certificates';
import { PortalJobBoard } from './pages/portal/JobBoard';
import { PortalAIAssistant } from './pages/portal/AIAssistant';
import { PortalCalendar } from './pages/portal/PortalCalendar';
import { PortalCommunity } from './pages/portal/Community';
import { PortalCoursePlayer } from './pages/portal/CoursePlayer';
import { PortalPayments } from './pages/portal/Payments';
import { PortalStudentID } from './pages/portal/StudentID';
import { PortalAttendance } from './pages/portal/Attendance';
import { RecordsLayout, RecordsRedirect } from './pages/portal/RecordsLayout';
import { ConnectLayout, ConnectRedirect } from './pages/portal/ConnectLayout';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { StaffClasses } from './pages/staff/StaffClasses';
import { StaffAttendancePage } from './pages/staff/StaffAttendancePage';
import { StaffMaterials } from './pages/staff/StaffMaterials';
import { StaffWallet } from './pages/staff/StaffWallet';
import { StaffActivities } from './pages/staff/StaffActivities';
import { StaffApproveAttendance } from './pages/staff/StaffApproveAttendance';
import { createElement } from 'react';
import { Navigate } from 'react-router';

// Helper to wrap a layout component with ProtectedRoute
function withProtection(allowedRoles: ('admin' | 'staff' | 'student')[], LayoutComponent: any) {
  return function ProtectedLayout() {
    return createElement(ProtectedRoute, { allowedRoles }, createElement(LayoutComponent));
  };
}

export const router = createBrowserRouter([
  // ─── Public pages ───
  {
    path: '/',
    Component: MainLayout,
    children: [
      { index: true, Component: Home },
      { path: 'about', Component: About },
      { path: 'courses', Component: Courses },
      { path: 'courses/:id', Component: CourseDetail },
      { path: 'contact', Component: Contact },
    ],
  },
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/register',
    Component: Register,
  },
  {
    path: '/setup',
    Component: Setup,
  },
  {
    path: '/debug',
    Component: Debug,
  },

  // ─── Admin Dashboard (role: admin only) ───
  {
    path: '/dashboard',
    Component: withProtection(['admin'], DashboardLayout),
    children: [
      { index: true, Component: Overview },
      {
        path: 'people',
        Component: PeopleLayout,
        children: [
          { index: true, Component: PeopleRedirect },
          { path: 'students', Component: Students },
          { path: 'staff', Component: Staff },
          { path: 'staff-schedules', Component: StaffSchedules },
          { path: 'lecturer-attendance', Component: LecturerAttendanceReview },
          { path: 'lecturer-rates', Component: LecturerRates },
        ],
      },
      {
        path: 'academic',
        Component: AcademicLayout,
        children: [
          { index: true, Component: AcademicRedirect },
          { path: 'departments', Component: Departments },
          { path: 'programs', Component: Programs },
          { path: 'promotions', Component: Promotions },
          { path: 'fee-structures', Component: FeeStructures },
          { path: 'enrollments', Component: Enrollments },
          { path: 'classes', Component: Classes },
          { path: 'lessons', Component: Lessons },
          { path: 'learning', Component: LearningActivities },
        ],
      },
      {
        path: 'finance',
        Component: FinanceLayout,
        children: [
          { index: true, Component: FinanceRedirect },
          { path: 'exchange-rates', Component: ExchangeRates },
          { path: 'financing', Component: Financing },
        ],
      },
      {
        path: 'reports-certificates',
        Component: ReportsCertificatesLayout,
        children: [
          { index: true, Component: ReportsCertificatesRedirect },
          { path: 'reports', Component: Reports },
          { path: 'certificates', Component: CertificatesAdmin },
        ],
      },
      { path: 'online-studies', Component: OnlineStudies },
      { path: 'settings', Component: Settings },
      // Redirects for old paths (backward compatibility)
      { path: 'students', Component: () => createElement(Navigate, { to: '/dashboard/people/students', replace: true }) },
      { path: 'staff', Component: () => createElement(Navigate, { to: '/dashboard/people/staff', replace: true }) },
      { path: 'departments', Component: () => createElement(Navigate, { to: '/dashboard/academic/departments', replace: true }) },
      { path: 'programs', Component: () => createElement(Navigate, { to: '/dashboard/academic/programs', replace: true }) },
      { path: 'promotions', Component: () => createElement(Navigate, { to: '/dashboard/academic/promotions', replace: true }) },
      { path: 'fee-structures', Component: () => createElement(Navigate, { to: '/dashboard/academic/fee-structures', replace: true }) },
      { path: 'enrollments', Component: () => createElement(Navigate, { to: '/dashboard/academic/enrollments', replace: true }) },
      { path: 'exchange-rates', Component: () => createElement(Navigate, { to: '/dashboard/finance/exchange-rates', replace: true }) },
      { path: 'financing', Component: () => createElement(Navigate, { to: '/dashboard/finance/financing', replace: true }) },
      { path: 'reports', Component: () => createElement(Navigate, { to: '/dashboard/reports-certificates/reports', replace: true }) },
      { path: 'certificates', Component: () => createElement(Navigate, { to: '/dashboard/reports-certificates/certificates', replace: true }) },
    ],
  },

  // ─── Student Portal (role: student only) ───
  {
    path: '/portal',
    Component: withProtection(['student'], PortalLayout),
    children: [
      { index: true, Component: PortalDashboard },
      { path: 'courses', Component: PortalMyCourses },
      { path: 'courses/:id', Component: PortalCoursePlayer },
      {
        path: 'records',
        Component: RecordsLayout,
        children: [
          { index: true, Component: RecordsRedirect },
          { path: 'student-id', Component: PortalStudentID },
          { path: 'attendance', Component: PortalAttendance },
          { path: 'certificates', Component: PortalCertificates },
        ],
      },
      { path: 'payments', Component: PortalPayments },
      {
        path: 'connect',
        Component: ConnectLayout,
        children: [
          { index: true, Component: ConnectRedirect },
          { path: 'jobs', Component: PortalJobBoard },
          { path: 'ai-assistant', Component: PortalAIAssistant },
          { path: 'calendar', Component: PortalCalendar },
          { path: 'community', Component: PortalCommunity },
        ],
      },
      // Redirects for old paths (backward compatibility)
      { path: 'student-id', Component: () => createElement(Navigate, { to: '/portal/records/student-id', replace: true }) },
      { path: 'attendance', Component: () => createElement(Navigate, { to: '/portal/records/attendance', replace: true }) },
      { path: 'certificates', Component: () => createElement(Navigate, { to: '/portal/records/certificates', replace: true }) },
      { path: 'jobs', Component: () => createElement(Navigate, { to: '/portal/connect/jobs', replace: true }) },
      { path: 'ai-assistant', Component: () => createElement(Navigate, { to: '/portal/connect/ai-assistant', replace: true }) },
      { path: 'calendar', Component: () => createElement(Navigate, { to: '/portal/connect/calendar', replace: true }) },
      { path: 'community', Component: () => createElement(Navigate, { to: '/portal/connect/community', replace: true }) },
    ],
  },

  // ─── Staff Dashboard (role: staff only) ───
  {
    path: '/staff',
    Component: withProtection(['staff'], StaffLayout),
    children: [
      { index: true, Component: StaffDashboard },
      { path: 'classes', Component: StaffClasses },
      { path: 'attendance', Component: StaffAttendancePage },
      { path: 'attendance-requests', Component: () => createElement(Navigate, { to: '/staff/attendance?tab=requests', replace: true }) },
      { path: 'approve-attendance', Component: StaffApproveAttendance },
      { path: 'materials', Component: StaffMaterials },
      { path: 'activities', Component: StaffActivities },
      { path: 'schedule', Component: () => createElement(Navigate, { to: '/staff/attendance', replace: true }) },
      { path: 'wallet', Component: StaffWallet },
    ],
  },

  // ─── Catch-all ───
  {
    path: '*',
    Component: NotFound,
  },
]);