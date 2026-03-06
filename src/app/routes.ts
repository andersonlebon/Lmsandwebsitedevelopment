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
import { Financing } from './pages/dashboard/Financing';
import { OnlineStudies } from './pages/dashboard/OnlineStudies';
import { Settings } from './pages/dashboard/Settings';
import { Departments } from './pages/dashboard/Departments';
import { Reports } from './pages/dashboard/Reports';
import { CertificatesAdmin } from './pages/dashboard/CertificatesAdmin';
import { Programs } from './pages/dashboard/Programs';
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
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { StaffClasses } from './pages/staff/StaffClasses';
import { StaffAttendance } from './pages/staff/StaffAttendance';
import { StaffMaterials } from './pages/staff/StaffMaterials';
import { StaffSchedule } from './pages/staff/StaffSchedule';
import { createElement } from 'react';

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
      { path: 'students', Component: Students },
      { path: 'staff', Component: Staff },
      { path: 'departments', Component: Departments },
      { path: 'financing', Component: Financing },
      { path: 'certificates', Component: CertificatesAdmin },
      { path: 'reports', Component: Reports },
      { path: 'online-studies', Component: OnlineStudies },
      { path: 'programs', Component: Programs },
      { path: 'settings', Component: Settings },
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
      { path: 'certificates', Component: PortalCertificates },
      { path: 'payments', Component: PortalPayments },
      { path: 'student-id', Component: PortalStudentID },
      { path: 'attendance', Component: PortalAttendance },
      { path: 'jobs', Component: PortalJobBoard },
      { path: 'ai-assistant', Component: PortalAIAssistant },
      { path: 'calendar', Component: PortalCalendar },
      { path: 'community', Component: PortalCommunity },
    ],
  },

  // ─── Staff Dashboard (role: staff only) ───
  {
    path: '/staff',
    Component: withProtection(['staff'], StaffLayout),
    children: [
      { index: true, Component: StaffDashboard },
      { path: 'classes', Component: StaffClasses },
      { path: 'attendance', Component: StaffAttendance },
      { path: 'materials', Component: StaffMaterials },
      { path: 'schedule', Component: StaffSchedule },
    ],
  },

  // ─── Catch-all ───
  {
    path: '*',
    Component: NotFound,
  },
]);