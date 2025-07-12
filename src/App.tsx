import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleRoute from './components/common/RoleRoute';

// Layouts
import MainLayout from './components/layouts/MainLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';
import StudentDashboard from './pages/student/StudentDashboard';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import ExamCreation from './pages/instructor/ExamCreation';
import ExamListStudent from './pages/student/ExamList';
import WhiteboardExam from './pages/student/WhiteboardExam';
import ExamResult from './pages/student/ExamResult';
import ExamReview from './pages/student/ExamReview';
import SubmissionList from './pages/instructor/SubmissionList';
import ExamListInstructor from './pages/instructor/ExamList';
import StudentList from './pages/instructor/StudentList';
import ExamStudents from './pages/instructor/ExamStudents';
import Profile from './pages/student/Profile';
import InstructorProfile from './pages/instructor/Profile';
import StudentProgressNew from './pages/instructor/StudentProgressNew';
import StudyMaterials from './pages/instructor/StudyMaterials';
import StudyResources from './pages/student/StudyResources';
import StudentResults from './pages/student/StudentResults';
import PracticeTest from './pages/student/PracticeTest';
import FlashcardStudy from './pages/student/FlashcardStudy';

// New Pages
import SettingsPage from './pages/settings/SettingsPage';
import HelpSupportPage from './pages/support/HelpSupportPage';

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              {/* Instructor Routes */}
              <Route element={<RoleRoute allowedRoles={['instructor']} />}>
                <Route path="/instructor/student-progress/:studentId" element={<StudentProgressNew />} />
              </Route>
              
              {/* Common Routes for Both Roles */}
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/help-support" element={<HelpSupportPage />} />
              
              {/* Student Routes */}
              <Route element={<RoleRoute allowedRoles={['student']} />}>
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/student/exams" element={<ExamListStudent />} />
                <Route path="/student/study-resources" element={<StudyResources />} />
                <Route path="/student/results" element={<StudentResults />} />
                <Route path="/student/profile" element={<Profile />} />
                <Route path="/student/exam/:examId" element={<WhiteboardExam />} />
                <Route path="/student/exam/:examId/result" element={<ExamResult />} />
                <Route path="/student/practice-test/:testId" element={<PracticeTest />} />
                <Route path="/student/flashcards/:setId" element={<FlashcardStudy />} />
                <Route path="/student/exam/:examId/review" element={<ExamReview />} />
              </Route>

              {/* Instructor Routes */}
              <Route element={<RoleRoute allowedRoles={['instructor']} />}>
                <Route path="/instructor" element={<InstructorDashboard />} />
                <Route path="/instructor/profile" element={<InstructorProfile />} />
                <Route path="/instructor/exams/create" element={<ExamCreation />} />
                <Route path="/instructor/exams/:examId/edit" element={<ExamCreation />} />
                <Route path="/instructor/exam/:examId/submissions" element={<SubmissionList />} />
                <Route path="/instructor/exams/:examId/students" element={<ExamStudents />} />
                <Route path="/instructor/submissions" element={<SubmissionList />} />
                <Route path="/instructor/exams" element={<ExamListInstructor />} />
                <Route path="/instructor/students" element={<StudentList />} />
                <Route path="/instructor/students/:studentId" element={<StudentProgressNew />} />
                <Route path="/instructor/study-materials" element={<StudyMaterials />} />
              </Route>

            </Route>
          </Route>

          {/* Default Redirect */}
          <Route path="/" element={<LoginPage />} />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
