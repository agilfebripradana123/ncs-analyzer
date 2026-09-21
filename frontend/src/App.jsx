import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import AdminLayout from './layouts/AdminLayout'
import AssessorLayout from './layouts/AssessorLayout'
import AdminDashboard from './pages/admin/Dashboard'
import Employees from './pages/admin/Employees'
import Users from './pages/admin/Users'
import Rules from './pages/admin/Rules'
import AuditLogs from './pages/admin/AuditLogs'
import Assessments from './pages/assessor/Assessments'
import AssessmentCreate from './pages/assessor/AssessmentCreate'
import AssessmentDetail from './pages/assessor/AssessmentDetail'
import SessionView from './pages/assessor/SessionView'
import AssessorEmployees from './pages/assessor/Employees'
import AssessorSessions from './pages/assessor/Sessions'
import AssessorFindings from './pages/assessor/Findings'
import AssessorReports from './pages/assessor/Reports'
import AssessorDashboard from './pages/assessor/Dashboard'
import Login from './pages/auth/Login'
import ConsentPage from './pages/consent/ConsentPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/consent/:token" element={<ConsentPage />} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="users" element={<Users />} />
            <Route path="rules" element={<Rules />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>
          <Route path="/assessor" element={<ProtectedRoute role="assessor"><AssessorLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AssessorDashboard />} />
            <Route path="assessments" element={<Assessments />} />
            <Route path="assessments/create" element={<AssessmentCreate />} />
            <Route path="assessments/:id" element={<AssessmentDetail />} />
            <Route path="employees" element={<AssessorEmployees />} />
            <Route path="sessions" element={<AssessorSessions />} />
            <Route path="sessions/:id" element={<SessionView />} />
            <Route path="findings" element={<AssessorFindings />} />
            <Route path="reports" element={<AssessorReports />} />
          </Route>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </AuthProvider>
  )
}