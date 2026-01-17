import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './views/Home';
import About from './views/About';
import Admissions from './views/Admissions';
import Gallery from './views/Gallery';
import Contact from './views/Contact';
import AdminLogin from './views/AdminLogin';
import AdminSignup from './views/AdminSignup';
import AdminDashboard from './views/AdminDashboard';
import AcademicsLogin from './views/AcademicsLogin';
import AcademicsSignup from './views/AcademicsSignup';
import TeacherPortal from './views/TeacherPortal';
import StudentPortal from './views/StudentPortal';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-signup" element={<AdminSignup />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/academics" element={<AcademicsLogin />} />
          <Route path="/academics/signup" element={<AcademicsSignup />} />
          <Route path="/academics/teacher" element={<TeacherPortal />} />
          <Route path="/academics/student" element={<StudentPortal />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
