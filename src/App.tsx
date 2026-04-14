import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import LandingPage from '@/pages/LandingPage'
import AdminLayout from '@/components/layout/AdminLayout'
import PrincipalLayout from '@/components/layout/PrincipalLayout'
import TeacherLayout from '@/components/layout/TeacherLayout'
import Dashboard from '@/pages/Dashboard'
import Schools from '@/pages/Schools'
import Analytics from '@/pages/Analytics'
import Billing from '@/pages/Billing'
import Invoices from '@/pages/Invoices'
import Requests from '@/pages/Requests'
import Settings from '@/pages/Settings'
import Pricing from '@/pages/Pricing'

// Principal Pages
import PrincipalDashboard from '@/pages/principal/Dashboard'
import PrincipalStudents from '@/pages/principal/Students'
import PrincipalStaff from '@/pages/principal/Staff'
import PrincipalAttendance from '@/pages/principal/Attendance'
import PrincipalFees from '@/pages/principal/Fees'
import PrincipalTeachers from '@/pages/principal/Teachers'
import PrincipalTimetable from '@/pages/principal/Timetable'
import PrincipalEvents from '@/pages/principal/Events'
import PrincipalBulkMessage from '@/pages/principal/BulkMessage'
import PrincipalNoticeBoard from '@/pages/principal/NoticeBoard'
import PrincipalChat from '@/pages/principal/Chat'
import PrincipalPayments from '@/pages/principal/Payments'
import PrincipalLeaveRequests from '@/pages/principal/LeaveRequests'

// Teacher Pages
import TeacherDashboard    from '@/pages/teacher/Dashboard'
import TeacherStudents     from '@/pages/teacher/Students'
import TeacherMarks        from '@/pages/teacher/Marks'
import TeacherAttendance   from '@/pages/teacher/Attendance'
import TeacherAssignments  from '@/pages/teacher/Assignments'
import TeacherAnnouncements from '@/pages/teacher/Announcements'
import TeacherTimetable    from '@/pages/teacher/Timetable'
import TeacherLeave        from '@/pages/teacher/Leave'
import TeacherChat         from '@/pages/teacher/Chat'
import TeacherSettings     from '@/pages/teacher/Settings'



/* ── Fullscreen spinner ─────────────────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 14,
      background: 'var(--bg)',
    }}>
      <span className="spin" style={{ width: 24, height: 24 }} />
      <p style={{ fontSize: 12, color: 'var(--txt3)', fontFamily: 'DM Mono, monospace' }}>
        Verifying session…
      </p>
    </div>
  )
}

/* ── Protected Route ────────────────────────────────────────────────────── */
function ProtectedRoute({
  children,
  reqRole,
}: {
  children: React.ReactNode
  reqRole: 'admin' | 'principal' | 'teacher'
}) {
  const { user, profile, loading } = useAuth()
  const [timeoutReached, setTimeoutReached] = useState(false)

  useEffect(() => {
    if (loading || (user && !profile)) {
      const timer = setTimeout(() => {
        setTimeoutReached(true)
        toast.error('Session verification timed out. Please sign in again.', {
          position: 'top-center', duration: 5000,
          style: { background: 'var(--bg2)', color: 'var(--txt)', border: '1px solid var(--border)', fontFamily: 'Sora, sans-serif', fontSize: '13px' }
        })
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [loading, user, profile])

  if (timeoutReached) return <Navigate to="/login" replace />
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <Spinner />

  // Role-based access control
  if (reqRole === 'admin') {
    if (profile.role === 'principal') return <Navigate to="/principal/dashboard" replace />
    if (profile.role === 'teacher')   return <Navigate to="/teacher/dashboard" replace />
    if (profile.role !== 'admin')     return <Navigate to="/login" replace />
  }

  if (reqRole === 'principal') {
    if (profile.role === 'admin')   return <Navigate to="/dashboard" replace />
    if (profile.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />
    if (profile.role !== 'principal') return <Navigate to="/login" replace />
    if (profile.status === 'suspended') return <Navigate to="/login?reason=suspended" replace />
  }

  if (reqRole === 'teacher') {
    if (profile.role === 'admin')     return <Navigate to="/dashboard" replace />
    if (profile.role === 'principal') return <Navigate to="/principal/dashboard" replace />
    if (profile.role !== 'teacher')   return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

/* ── App ────────────────────────────────────────────────────────────────── */
export default function App() {
  // Auth is initialised by AuthProvider in main.tsx — no listener needed here

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* ── Admin Routes ─────────────────────────────────────── */}
      <Route
        element={
          <ProtectedRoute reqRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard"  element={<Dashboard />} />
        <Route path="schools"    element={<Schools />} />
        <Route path="analytics"  element={<Analytics />} />
        <Route path="billing"    element={<Billing />} />
        <Route path="invoices"   element={<Invoices />} />
        <Route path="requests"   element={<Requests />} />
        <Route path="settings"   element={<Settings />} />
        <Route path="pricing"    element={<Pricing />} />
      </Route>

      {/* ── Principal Routes ─────────────────────────────────── */}
      <Route
        path="/principal"
        element={
          <ProtectedRoute reqRole="principal">
            <PrincipalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/principal/dashboard" replace />} />
        <Route path="dashboard"   element={<PrincipalDashboard />} />
        <Route path="students"    element={<PrincipalStudents />} />
        <Route path="teachers"    element={<PrincipalTeachers />} />
        <Route path="staff"       element={<PrincipalStaff />} />
        <Route path="attendance"  element={<PrincipalAttendance />} />
        <Route path="fees"        element={<PrincipalFees />} />
        <Route path="timetable"   element={<PrincipalTimetable />} />
        <Route path="events"      element={<PrincipalEvents />} />
        <Route path="messages"    element={<PrincipalBulkMessage />} />
        <Route path="noticeboard" element={<PrincipalNoticeBoard />} />
        <Route path="chat"        element={<PrincipalChat />} />
        <Route path="payments"    element={<PrincipalPayments />} />
        <Route path="leave-requests" element={<PrincipalLeaveRequests />} />
      </Route>

      {/* ── Teacher Routes ────────────────────────────────────── */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute reqRole="teacher">
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/teacher/dashboard" replace />} />
        <Route path="dashboard"    element={<TeacherDashboard />} />
        <Route path="students"     element={<TeacherStudents />} />
        <Route path="marks"        element={<TeacherMarks />} />
        <Route path="attendance"   element={<TeacherAttendance />} />
        <Route path="assignments"  element={<TeacherAssignments />} />
        <Route path="announcements" element={<TeacherAnnouncements />} />
        <Route path="timetable"    element={<TeacherTimetable />} />
        <Route path="leave"        element={<TeacherLeave />} />
        <Route path="chat"         element={<TeacherChat />} />
        <Route path="settings"     element={<TeacherSettings />} />
      </Route>

      {/* ── Catch-all → login ─────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
