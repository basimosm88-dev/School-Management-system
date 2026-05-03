import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import ProfilePage from './pages/student/ProfilePage';
import StudentSettings from './pages/student/StudentSettings';
import Login from './pages/auth/Login';
import GenericModulePage from './pages/GenericModulePage';
import SettingsPage from './pages/admin/SettingsPage';
import { AppProvider } from './contexts/AppContext';
import { DataProvider } from './contexts/DataContext';
import { SettingsProvider } from './contexts/SettingsContext';

import StudentsPage from './pages/admin/StudentsPage';
import TeachersPage from './pages/admin/TeachersPage';
import ClassesPage from './pages/admin/ClassesPage';
import SubjectsPage from './pages/admin/SubjectsPage';
import AdminAttendancePage from './pages/admin/AttendancePage';
import AdminTimetablePage from './pages/admin/TimetablePage';
import TeacherAttendancePage from './pages/teacher/AttendancePage';
import TeacherTimetablePage from './pages/teacher/TimetablePage';
import StudentAttendancePage from './pages/student/AttendancePage';
import StudentTimetablePage from './pages/student/TimetablePage';
import TeacherSettings from './pages/teacher/TeacherSettings';
import MyClassesPage from './pages/teacher/MyClassesPage';
import TeacherStudentsPage from './pages/teacher/StudentsPage';
import AdminExamsPage from './pages/admin/ExamsPage';
import TeacherExamsPage from './pages/teacher/ExamsPage';
import StudentExamsPage from './pages/student/ExamsPage';
import ReportCardPrint from './pages/admin/ReportCardPrint';
import ClassExamReportPrint from './pages/admin/ClassExamReportPrint';
import ClassFullResultsPrint from './pages/admin/ClassFullResultsPrint';
import EventsPage from './pages/shared/EventsPage';
import AnnouncementsPage from './pages/shared/AnnouncementsPage';
import NotificationsPage from './pages/shared/NotificationsPage';
import ResultsPage from './pages/shared/ResultsPage';

function App() {
 return (
  <Router>
    <SettingsProvider>
      <DataProvider>
        <AppProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<StudentsPage />} />
            <Route path="/admin/teachers" element={<TeachersPage />} />
            <Route path="/admin/classes" element={<ClassesPage />} />
            <Route path="/admin/subjects" element={<SubjectsPage />} />
            <Route path="/admin/attendance" element={<AdminAttendancePage />} />
            <Route path="/admin/timetable" element={<AdminTimetablePage />} />
            <Route path="/admin/exams" element={<AdminExamsPage />} />
            <Route path="/admin/events" element={<EventsPage role="admin" />} />
            <Route path="/admin/announcements" element={<AnnouncementsPage role="admin" />} />
            <Route path="/admin/results" element={<ResultsPage role="admin" />} />
            <Route path="/admin/notifications" element={<NotificationsPage role="admin" />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
            <Route path="/print-report/:studentId" element={<ReportCardPrint />} />
            <Route path="/print-class-exam/:classId/:examType" element={<ClassExamReportPrint />} />
            <Route path="/print-class-full-results/:classId" element={<ClassFullResultsPrint />} />

            {/* Teacher Routes */}
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/classes" element={<MyClassesPage />} />
            <Route path="/teacher/students" element={<TeacherStudentsPage />} />
            <Route path="/teacher/attendance" element={<TeacherAttendancePage />} />
            <Route path="/teacher/exams" element={<TeacherExamsPage />} />
            <Route path="/teacher/timetable" element={<TeacherTimetablePage />} />
            <Route path="/teacher/results" element={<ResultsPage role="teacher" />} />
            <Route path="/teacher/events" element={<EventsPage role="teacher" />} />
            <Route path="/teacher/announcements" element={<AnnouncementsPage role="teacher" />} />
            <Route path="/teacher/notifications" element={<NotificationsPage role="teacher" />} />
            <Route path="/teacher/settings" element={<TeacherSettings />} />

            {/* Student Routes */}
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/profile" element={<ProfilePage />} />
            <Route path="/student/attendance" element={<StudentAttendancePage />} />
            <Route path="/student/timetable" element={<StudentTimetablePage />} />
            <Route path="/student/results" element={<ResultsPage role="student" />} />
            <Route path="/student/announcements" element={<AnnouncementsPage role="student" />} />
            <Route path="/student/events" element={<EventsPage role="student" />} />
            <Route path="/student/notifications" element={<NotificationsPage role="student" />} />
            <Route path="/student/settings" element={<StudentSettings />} />

            {/* Default route based on auth will go here. For now, redirect to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </AppProvider>
      </DataProvider>
    </SettingsProvider>
  </Router>
 );
}

export default App;
