import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import LandingPage from '@/pages/LandingPage'
import AdminLayout from '@/components/layout/AdminLayout'
import PrincipalLayout from '@/components/layout/PrincipalLayout'
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
// SECURITY: We wait for BOTH the Firebase auth state AND the profile fetch to
// resolve before making any routing decision. If profile is null while user is
// set, we keep showing the spinner — never exposing content prematurely.
function ProtectedRoute({
  children,
  reqRole,
}: {
  children: React.ReactNode
  reqRole: 'admin' | 'principal'
}) {
  const { user, profile, loading } = useAuth()
  const [timeoutReached, setTimeoutReached] = useState(false)

  useEffect(() => {
    // If the system is stuck trying to verify the session or fetch the profile
    if (loading || (user && !profile)) {
      const timer = setTimeout(() => {
        setTimeoutReached(true)
        toast.error('Session verification timed out due to network instability. Please sign in again to continue.', { 
          position: 'top-center',
          duration: 5000,
          style: {
            background: 'var(--bg2)',
            color: 'var(--txt)',
            border: '1px solid var(--border)',
            fontFamily: 'Sora, sans-serif',
            fontSize: '13px'
          }
        })
      }, 10000) // 10 seconds
      return () => clearTimeout(timer)
    }
  }, [loading, user, profile])

  if (timeoutReached) {
    return <Navigate to="/login" replace />
  }

  // 1. Still initialising Firebase auth — wait
  if (loading) return <Spinner />

  // 2. No authenticated user at all — redirect to login
  if (!user) return <Navigate to="/login" replace />

  // 3. User is authenticated but profile hasn't loaded yet.
  //    This can happen briefly while /api/auth/me is in-flight.
  //    NEVER render content without a confirmed role.
  if (!profile) return <Spinner />

  // 4. ── Role-based access control (RBAC) ──────────────────────────────
  if (reqRole === 'admin') {
    // Only users with the 'admin' role may access admin routes
    if (profile.role !== 'admin') {
      // If they are a principal, redirect them to their own portal
      if (profile.role === 'principal') return <Navigate to="/principal/dashboard" replace />
      // Everyone else goes back to login
      return <Navigate to="/login" replace />
    }
  }

  if (reqRole === 'principal') {
    // Admin should not be on principal routes
    if (profile.role === 'admin') {
      return <Navigate to="/dashboard" replace />
    }
    // Must be a confirmed principal with an active school
    if (profile.role !== 'principal') return <Navigate to="/login" replace />
    if (profile.status === 'suspended') return <Navigate to="/login?reason=suspended" replace />
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
      </Route>

      {/* ── Catch-all → login, never dashboard ───────────────── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
