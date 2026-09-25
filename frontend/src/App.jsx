import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import AdminLayout from './layouts/AdminLayout'
import AssessorLayout from './layouts/AssessorLayout'
import AdminDashboard from './pages/admin/Dashboard'
import Users from './pages/admin/Users'
import Rules from './pages/admin/Rules'
import AuditLogs from './pages/admin/AuditLogs'
import Assessments from './pages/assessor/Assessments'
import AssessmentCreate from './pages/assessor/AssessmentCreate'
import AssessmentDetail from './pages/assessor/AssessmentDetail'
import SessionView from './pages/assessor/SessionView'
import AssessorSessions from './pages/assessor/Sessions'
import AssessorFindings from './pages/assessor/Findings'
import AssessorReports from './pages/assessor/Reports'
import ReportDetail from './pages/assessor/ReportDetail'
import AssessorDashboard from './pages/assessor/Dashboard'
import Login from './pages/auth/Login'
import ConsentUpload from './pages/consent/ConsentUpload'
import ConsentPage from './pages/consent/ConsentPage'
import Card from './components/Card'

function ConsentResult({ type }) {
  const ok = type === 'success'
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <h1 className="text-xl font-bold text-text-primary mb-2">{ok ? 'Persetujuan Diterima' : 'Persetujuan Ditolak'}</h1>
        <p className="text-sm text-text-secondary">{ok ? 'Terima kasih. Assessment dapat dimulai.' : 'Assessment dibatalkan.'}</p>
      </Card>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/consent/success" element={<ConsentResult type="success" />} />
          <Route path="/consent/declined" element={<ConsentResult type="declined" />} />
          <Route path="/consent/:token/upload" element={<ConsentUpload />} />
          <Route path="/consent/:token" element={<ConsentPage />} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
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
            <Route path="sessions" element={<AssessorSessions />} />
            <Route path="sessions/:id" element={<SessionView />} />
            <Route path="findings" element={<AssessorFindings />} />
            <Route path="reports" element={<AssessorReports />} />
            <Route path="reports/:id" element={<ReportDetail />} />
          </Route>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </AuthProvider>
  )
}