import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import RequireRole from './components/RequireRole';
import PageTransition from './components/ui/PageTransition';
import Home from './views/Home';
import About from './views/About';
import Admissions from './views/Admissions';
import Gallery from './views/Gallery';
import Contact from './views/Contact';
import FAQ from './views/FAQ';
import VirtualTour from './views/VirtualTour';
import NotFound from './views/NotFound';
import AdminLogin from './views/AdminLogin';

// New /admin/* console
import AdminLayout from './components/admin/AdminLayout';
import NewAdminDashboard from './views/admin/Dashboard';
import AdminStudents from './views/admin/Students';
import AdminStudentProfile from './views/admin/StudentProfile';
import AdminTeachers from './views/admin/Teachers';
import AdminGuardians from './views/admin/Guardians';
import AdminClasses from './views/admin/Classes';
import AdminSubjects from './views/admin/Subjects';
import AdminAdmissions from './views/admin/Admissions';
import AdminAttendance from './views/admin/Attendance';
import AdminGrades from './views/admin/Grades';
import AdminFinance from './views/admin/Finance';
import AdminAudit from './views/admin/Audit';
import AdminTrash from './views/admin/Trash';
import AdminAnnouncements from './views/admin/Announcements';
import AdminBulkImport from './views/admin/BulkImport';
import AdminPromotion from './views/admin/Promotion';
import AdminPickups from './views/admin/Pickups';
import ReportCardView from './views/shared/ReportCard';
import AdminTerms from './views/admin/Terms';

// New /teacher/* portal
import TeacherLayout from './components/teacher/TeacherLayout';
import TeacherDashboard from './views/teacher/Dashboard';
import TeacherClassRoster from './views/teacher/ClassRoster';
import TeacherAttendance from './views/teacher/Attendance';
import TeacherGrades from './views/teacher/Grades';
import TeacherStudentResults from './views/teacher/StudentResults';
import TeacherAssignments from './views/teacher/Assignments';

// New /parent/* portal
import ParentLayout from './components/parent/ParentLayout';
import ParentDashboard from './views/parent/Dashboard';
import ParentChild from './views/parent/Child';
import ParentFees from './views/parent/Fees';
import ParentCalendar from './views/parent/Calendar';
import ParentMessages from './views/parent/Messages';
import TeacherMessages from './views/teacher/Messages';
import AdminLatePickup from './views/admin/LatePickup';
import TourBooking from './views/TourBooking';
import ApplicationStatus from './views/ApplicationStatus';

const Public = ({ children }) => <Layout>{children}</Layout>;

const ADMIN_ROLES   = ['super_admin', 'school_admin'];
const STAFF_ROLES   = [...ADMIN_ROLES, 'teacher'];
const TEACHER_ROLES = [...ADMIN_ROLES, 'teacher'];
const PARENT_ROLES  = [...ADMIN_ROLES, 'parent'];

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public site */}
        <Route path="/"           element={<Public><PageTransition><Home /></PageTransition></Public>} />
        <Route path="/about"      element={<Public><PageTransition><About /></PageTransition></Public>} />
        <Route path="/admissions" element={<Public><PageTransition><Admissions /></PageTransition></Public>} />
        <Route path="/gallery"    element={<Public><PageTransition><Gallery /></PageTransition></Public>} />
        <Route path="/virtual-tour" element={<Public><PageTransition><VirtualTour /></PageTransition></Public>} />
        <Route path="/contact"    element={<Public><PageTransition><Contact /></PageTransition></Public>} />
        <Route path="/faq"        element={<Public><PageTransition><FAQ /></PageTransition></Public>} />
        <Route path="/book-tour"  element={<Public><PageTransition><TourBooking /></PageTransition></Public>} />
        <Route path="/application-status" element={<Public><PageTransition><ApplicationStatus /></PageTransition></Public>} />

        {/* Auth */}
        <Route path="/admin-login"  element={<Public><PageTransition><AdminLogin /></PageTransition></Public>} />
        {/* Self-service signup retired — it only ever wrote a plaintext password to
            localStorage and had no real backend behind it. Accounts are created
            server-side (Django admin / seed scripts) with a real role assigned. */}
        <Route path="/admin-signup" element={<Navigate to="/admin-login" replace />} />

        {/* Admin console */}
        <Route path="/admin" element={<RequireRole roles={STAFF_ROLES}><AdminLayout /></RequireRole>}>
          <Route index                          element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard"               element={<PageTransition><NewAdminDashboard /></PageTransition>} />
          <Route path="admissions"              element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminAdmissions /></PageTransition></RequireRole>} />
          <Route path="students"                element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminStudents /></PageTransition></RequireRole>} />
          <Route path="students/:studentId"     element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminStudentProfile /></PageTransition></RequireRole>} />
          <Route path="teachers"                element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminTeachers /></PageTransition></RequireRole>} />
          <Route path="guardians"               element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminGuardians /></PageTransition></RequireRole>} />
          <Route path="classes"                 element={<PageTransition><AdminClasses /></PageTransition>} />
          <Route path="subjects"                element={<PageTransition><AdminSubjects /></PageTransition>} />
          <Route path="attendance"              element={<PageTransition><AdminAttendance /></PageTransition>} />
          <Route path="pickups"                 element={<PageTransition><AdminPickups /></PageTransition>} />
          <Route path="late-pickup"             element={<PageTransition><AdminLatePickup /></PageTransition>} />
          <Route path="grades"                  element={<PageTransition><AdminGrades /></PageTransition>} />
          <Route path="finance"                 element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminFinance /></PageTransition></RequireRole>} />
          <Route path="audit"                   element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminAudit /></PageTransition></RequireRole>} />
          <Route path="trash"                   element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminTrash /></PageTransition></RequireRole>} />
          <Route path="announcements"           element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminAnnouncements /></PageTransition></RequireRole>} />
          <Route path="bulk-import"             element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminBulkImport /></PageTransition></RequireRole>} />
          <Route path="promotion"               element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminPromotion /></PageTransition></RequireRole>} />
          <Route path="terms"                   element={<RequireRole roles={ADMIN_ROLES}><PageTransition><AdminTerms /></PageTransition></RequireRole>} />
          <Route path="report-cards/:studentId" element={<PageTransition><ReportCardView /></PageTransition>} />
        </Route>

        {/* Teacher portal */}
        <Route path="/teacher" element={<RequireRole roles={TEACHER_ROLES}><TeacherLayout /></RequireRole>}>
          <Route index              element={<Navigate to="/teacher/dashboard" replace />} />
          <Route path="dashboard"   element={<PageTransition><TeacherDashboard /></PageTransition>} />
          <Route path="class"       element={<PageTransition><TeacherClassRoster /></PageTransition>} />
          <Route path="attendance"  element={<PageTransition><TeacherAttendance /></PageTransition>} />
          <Route path="grades"      element={<PageTransition><TeacherGrades /></PageTransition>} />
          <Route path="students/:studentId/results" element={<PageTransition><TeacherStudentResults /></PageTransition>} />
          <Route path="assignments" element={<PageTransition><TeacherAssignments /></PageTransition>} />
          <Route path="messages"    element={<PageTransition><TeacherMessages /></PageTransition>} />
          <Route path="report-cards/:studentId" element={<PageTransition><ReportCardView /></PageTransition>} />
        </Route>

        {/* Parent portal */}
        <Route path="/parent" element={<RequireRole roles={PARENT_ROLES}><ParentLayout /></RequireRole>}>
          <Route index              element={<Navigate to="/parent/dashboard" replace />} />
          <Route path="dashboard"   element={<PageTransition><ParentDashboard /></PageTransition>} />
          <Route path="child/:childId" element={<PageTransition><ParentChild /></PageTransition>} />
          <Route path="fees"        element={<PageTransition><ParentFees /></PageTransition>} />
          <Route path="calendar"    element={<PageTransition><ParentCalendar /></PageTransition>} />
          <Route path="messages"    element={<PageTransition><ParentMessages /></PageTransition>} />
          <Route path="report-cards/:studentId" element={<PageTransition><ReportCardView /></PageTransition>} />
        </Route>

        {/* Legacy /academics/* portals retired — plaintext localStorage auth,
            fully superseded by /teacher and /parent above. Old links redirect
            to the real login instead of 404ing or resolving to a dead page. */}
        <Route path="/academics"          element={<Navigate to="/admin-login" replace />} />
        <Route path="/academics/signup"   element={<Navigate to="/admin-login" replace />} />
        <Route path="/academics/teacher"  element={<Navigate to="/admin-login" replace />} />
        <Route path="/academics/student"  element={<Navigate to="/admin-login" replace />} />

        {/* 404 catch-all */}
        <Route path="*" element={<Public><PageTransition><NotFound /></PageTransition></Public>} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;
