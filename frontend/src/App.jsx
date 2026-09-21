import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import RequireRole from './components/RequireRole';
import PageTransition from './components/ui/PageTransition';
import { ThemeProvider } from './context/ThemeContext';

// Public pages (small, load eagerly)
import Home from './views/Home';
import About from './views/About';
import Admissions from './views/Admissions';
import Gallery from './views/Gallery';
import Contact from './views/Contact';
import FAQ from './views/FAQ';
import VirtualTour from './views/VirtualTour';
import NotFound from './views/NotFound';
import AdminLogin from './views/AdminLogin';
import ParentLogin from './views/ParentLogin';
import AcceptInvite from './views/AcceptInvite';
import TourBooking from './views/TourBooking';
import ApplicationStatus from './views/ApplicationStatus';

// Lazy-loaded portal chunks
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const TeacherLayout = lazy(() => import('./components/teacher/TeacherLayout'));
const ParentLayout = lazy(() => import('./components/parent/ParentLayout'));

// Shared
const ReportCardView = lazy(() => import('./views/shared/ReportCard'));

// Admin portal chunk
const NewAdminDashboard = lazy(() => import('./views/admin/Dashboard'));
const AdminStudents = lazy(() => import('./views/admin/Students'));
const AdminStudentProfile = lazy(() => import('./views/admin/StudentProfile'));
const AdminTeachers = lazy(() => import('./views/admin/Teachers'));
const AdminGuardians = lazy(() => import('./views/admin/Guardians'));
const AdminClasses = lazy(() => import('./views/admin/Classes'));
const AdminSubjects = lazy(() => import('./views/admin/Subjects'));
const AdminAdmissions = lazy(() => import('./views/admin/Admissions'));
const AdminAttendance = lazy(() => import('./views/admin/Attendance'));
const AdminGrades = lazy(() => import('./views/admin/Grades'));
const AdminFinance = lazy(() => import('./views/admin/Finance'));
const AdminAudit = lazy(() => import('./views/admin/Audit'));
const AdminTrash = lazy(() => import('./views/admin/Trash'));
const AdminAnnouncements = lazy(() => import('./views/admin/Announcements'));
const AdminBulkImport = lazy(() => import('./views/admin/BulkImport'));
const AdminPromotion = lazy(() => import('./views/admin/Promotion'));
const AdminPastStudents = lazy(() => import('./views/admin/PastStudents'));
const AdminPickups = lazy(() => import('./views/admin/Pickups'));
const AdminSms = lazy(() => import('./views/admin/Sms'));
const AdminTerms = lazy(() => import('./views/admin/Terms'));
const AdminProfile = lazy(() => import('./views/admin/Profile'));
const AdminLatePickup = lazy(() => import('./views/admin/LatePickup'));
const AdminMore = lazy(() => import('./views/admin/More'));

// Teacher portal chunk
const TeacherDashboard = lazy(() => import('./views/teacher/Dashboard'));
const TeacherClassRoster = lazy(() => import('./views/teacher/ClassRoster'));
const TeacherAttendance = lazy(() => import('./views/teacher/Attendance'));
const TeacherGrades = lazy(() => import('./views/teacher/Grades'));
const TeacherStudentResults = lazy(() => import('./views/teacher/StudentResults'));
const TeacherAssignments = lazy(() => import('./views/teacher/Assignments'));
const TeacherMessages = lazy(() => import('./views/teacher/Messages'));
const TeacherMore = lazy(() => import('./views/teacher/More'));

// Parent portal chunk
const ParentDashboard = lazy(() => import('./views/parent/Dashboard'));
const ParentChild = lazy(() => import('./views/parent/Child'));
const ParentFees = lazy(() => import('./views/parent/Fees'));
const ParentSchoolBill = lazy(() => import('./views/parent/SchoolBill'));
const ParentCalendar = lazy(() => import('./views/parent/Calendar'));
const ParentMessages = lazy(() => import('./views/parent/Messages'));
const ParentProfile = lazy(() => import('./views/parent/Profile'));
const ParentMore = lazy(() => import('./views/parent/More'));

const Public = ({ children }) => <Layout>{children}</Layout>;

const ADMIN_ROLES   = ['super_admin', 'school_admin'];
const STAFF_ROLES   = [...ADMIN_ROLES, 'teacher'];
const TEACHER_ROLES = [...ADMIN_ROLES, 'teacher'];
const PARENT_ROLES  = [...ADMIN_ROLES, 'parent'];

const PortalLoader = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PortalLoader />}>
        <Routes location={location} key={location.pathname}>
          {/* ---- Public / marketing ---- */}
          <Route path="/" element={<Public><Home /></Public>} />
          <Route path="/about" element={<Public><About /></Public>} />
          <Route path="/admissions" element={<Public><Admissions /></Public>} />
          <Route path="/gallery" element={<Public><Gallery /></Public>} />
          <Route path="/contact" element={<Public><Contact /></Public>} />
          <Route path="/faq" element={<Public><FAQ /></Public>} />
          <Route path="/virtual-tour" element={<Public><VirtualTour /></Public>} />
          <Route path="/tour-booking" element={<TourBooking />} />
          <Route path="/application-status" element={<ApplicationStatus />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/parent-login" element={<ParentLogin />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />

          {/* ---- Admin console ---- */}
          <Route path="/admin" element={<RequireRole roles={STAFF_ROLES}><AdminLayout /></RequireRole>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard"   element={<PageTransition><NewAdminDashboard /></PageTransition>} />
            <Route path="profile"     element={<PageTransition><AdminProfile /></PageTransition>} />
            <Route path="admissions"  element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminAdmissions /></PageTransition></RequireRole>} />
            <Route path="students"    element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminStudents /></PageTransition></RequireRole>} />
            <Route path="students/:studentId" element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminStudentProfile /></PageTransition></RequireRole>} />
            <Route path="teachers"    element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminTeachers /></PageTransition></RequireRole>} />
            <Route path="guardians"   element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminGuardians /></PageTransition></RequireRole>} />
            <Route path="classes"     element={<PageTransition><AdminClasses /></PageTransition>} />
            <Route path="subjects"    element={<PageTransition><AdminSubjects /></PageTransition>} />
            <Route path="attendance"  element={<PageTransition><AdminAttendance /></PageTransition>} />
            <Route path="pickups"     element={<PageTransition><AdminPickups /></PageTransition>} />
            <Route path="late-pickup" element={<PageTransition><AdminLatePickup /></PageTransition>} />
            <Route path="grades"      element={<PageTransition><AdminGrades /></PageTransition>} />
            <Route path="finance"     element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminFinance /></PageTransition></RequireRole>} />
            <Route path="audit"       element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminAudit /></PageTransition></RequireRole>} />
            <Route path="trash"       element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminTrash /></PageTransition></RequireRole>} />
            <Route path="announcements" element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminAnnouncements /></PageTransition></RequireRole>} />
            <Route path="bulk-import" element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminBulkImport /></PageTransition></RequireRole>} />
            <Route path="promotion"   element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminPromotion /></PageTransition></RequireRole>} />
            <Route path="past-students" element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminPastStudents /></PageTransition></RequireRole>} />
            <Route path="terms"       element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminTerms /></PageTransition></RequireRole>} />
            <Route path="sms"         element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminSms /></PageTransition></RequireRole>} />
            <Route path="more"        element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminMore /></PageTransition></RequireRole>} />
            <Route path="report-cards/:studentId" element={<PageTransition><ReportCardView /></PageTransition>} />
          </Route>

          {/* Teacher portal */}
          <Route path="/admin/teacher" element={<RequireRole roles={TEACHER_ROLES}><TeacherLayout /></RequireRole>}>
            <Route index              element={<Navigate to="/admin/teacher/dashboard" replace />} />
            <Route path="dashboard"   element={<PageTransition><TeacherDashboard /></PageTransition>} />
            <Route path="class"       element={<PageTransition><TeacherClassRoster /></PageTransition>} />
            <Route path="attendance"  element={<PageTransition><TeacherAttendance /></PageTransition>} />
            <Route path="grades"      element={<PageTransition><TeacherGrades /></PageTransition>} />
            <Route path="students/:studentId/results" element={<PageTransition><TeacherStudentResults /></PageTransition>} />
            <Route path="assignments" element={<PageTransition><TeacherAssignments /></PageTransition>} />
            <Route path="messages"    element={<PageTransition><TeacherMessages /></PageTransition>} />
            <Route path="more"        element={<PageTransition><TeacherMore /></PageTransition>} />
            <Route path="report-cards/:studentId" element={<PageTransition><ReportCardView /></PageTransition>} />
          </Route>

          {/* Parent portal */}
          <Route path="/portal" element={<RequireRole roles={PARENT_ROLES}><ParentLayout /></RequireRole>}>
            <Route index              element={<Navigate to="/portal/dashboard" replace />} />
            <Route path="dashboard"   element={<PageTransition><ParentDashboard /></PageTransition>} />
            <Route path="child/:childId" element={<PageTransition><ParentChild /></PageTransition>} />
            <Route path="fees"        element={<PageTransition><ParentFees /></PageTransition>} />
            <Route path="bill"        element={<PageTransition><ParentSchoolBill /></PageTransition>} />
            <Route path="calendar"    element={<PageTransition><ParentCalendar /></PageTransition>} />
            <Route path="messages"    element={<PageTransition><ParentMessages /></PageTransition>} />
            <Route path="profile"     element={<PageTransition><ParentProfile /></PageTransition>} />
            <Route path="more"        element={<PageTransition><ParentMore /></PageTransition>} />
            <Route path="report-cards/:studentId" element={<PageTransition><ReportCardView /></PageTransition>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
    </ThemeProvider>
  );
}

export default App;
