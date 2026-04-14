import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { initials } from '@/lib/utils'
import {
  LayoutDashboard, Users, BarChart2, ClipboardCheck, BookOpen,
  Megaphone, Calendar, PlaneTakeoff, MessageSquare, Settings, LogOut, ChevronRight,
} from 'lucide-react'
import { Teacher } from '@/types'

const NAV = [
  { label: 'Dashboard',     path: '/teacher/dashboard',    icon: LayoutDashboard, group: 'Overview' },
  { label: 'Students',      path: '/teacher/students',     icon: Users,           group: 'Academic' },
  { label: 'Marks',         path: '/teacher/marks',        icon: BarChart2,       group: 'Academic' },
  { label: 'Attendance',    path: '/teacher/attendance',   icon: ClipboardCheck,  group: 'Academic' },
  { label: 'Assignments',   path: '/teacher/assignments',  icon: BookOpen,        group: 'Academic' },
  { label: 'Timetable',     path: '/teacher/timetable',    icon: Calendar,        group: 'Academic' },
  { label: 'Announcements', path: '/teacher/announcements',icon: Megaphone,       group: 'School' },
  { label: 'Leave',         path: '/teacher/leave',        icon: PlaneTakeoff,    group: 'School' },
  { label: 'Chat',          path: '/teacher/chat',         icon: MessageSquare,   group: 'School' },
  { label: 'Settings',      path: '/teacher/settings',     icon: Settings,        group: 'Account' },
]

const GROUPS = ['Overview', 'Academic', 'School', 'Account']

export default function TeacherLayout() {
  const { profile, logout } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  // Cast profile to Teacher shape — backend /api/auth/me returns teacher fields
  const teacher = profile as unknown as Teacher

  const current = NAV.find(n => loc.pathname.startsWith(n.path))?.label ?? 'Dashboard'
  const handleLogout = async () => { await logout(); nav('/login') }
  const W = collapsed ? 52 : 200

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── SIDEBAR ───────────────────────────────────────────── */}
      <div style={{
        width: W, flexShrink: 0, background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transition: 'width .2s cubic-bezier(.4,0,.2,1)', overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '14px 0' : '14px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: 30, height: 30, background: 'var(--accent)', borderRadius: 8, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BookOpen size={14} color="#000" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-.3px', whiteSpace: 'nowrap' }}>EduSync</div>
              <div style={{ fontSize: 10, color: 'var(--txt2)', fontFamily: 'DM Mono,monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
                {teacher?.name || 'Teacher Portal'}
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '8px 0' : '8px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {GROUPS.map(group => {
            const items = NAV.filter(n => n.group === group)
            return (
              <div key={group}>
                {!collapsed && (
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--txt3)', padding: '12px 10px 4px', fontFamily: 'DM Mono,monospace' }}>
                    {group}
                  </div>
                )}
                {items.map(({ path, icon: Icon, label }) => (
                  <NavLink key={path} to={path} style={{ textDecoration: 'none', display: 'block' }}>
                    {({ isActive }) => (
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        gap: collapsed ? 0 : 9,
                        padding: collapsed ? '9px 0' : '7px 10px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        borderRadius: collapsed ? 0 : 7,
                        marginBottom: 1, cursor: 'pointer', fontSize: 12,
                        transition: 'all .15s',
                        background: isActive ? 'rgba(167,139,250,.1)' : 'transparent',
                        color: isActive ? 'var(--accent)' : 'var(--txt2)',
                        fontWeight: isActive ? 500 : 400,
                        borderLeft: isActive && collapsed ? '2px solid var(--accent)' : '2px solid transparent',
                      }}>
                        <Icon size={14} />
                        {!collapsed && <span>{label}</span>}
                      </div>
                    )}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: collapsed ? '10px 0' : '10px 8px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          {!collapsed && teacher && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 9, padding: '8px 8px',
              background: 'var(--bg3)', borderRadius: 8, marginBottom: 8, border: '1px solid var(--border)',
            }}>
              <div className="av av-round" style={{ width: 28, height: 28, fontSize: 10, background: 'var(--accent)', color: '#000', flexShrink: 0 }}>
                {initials(teacher?.name || 'T')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teacher?.name || 'Teacher'}</div>
                <div style={{ fontSize: 10, color: 'var(--txt2)', fontFamily: 'DM Mono,monospace' }}>{teacher?.subject || 'Staff'}</div>
              </div>
            </div>
          )}
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start' }}
            onClick={handleLogout}
          >
            <LogOut size={13} />
            {!collapsed && 'Sign out'}
          </button>
        </div>
      </div>

      {/* ── MAIN ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <div style={{
          height: 50, background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, flexShrink: 0,
        }}>
          <button
            onClick={() => setCollapsed(v => !v)}
            style={{ background: 'none', border: 'none', color: 'var(--txt2)', cursor: 'pointer', display: 'flex', padding: 4 }}
          >
            <ChevronRight size={16} style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform .2s' }} />
          </button>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-.3px', flex: 1 }}>{current}</div>
          {teacher && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{teacher?.name || 'Teacher'}</div>
                <div style={{ fontSize: 10, color: 'var(--txt2)', fontFamily: 'DM Mono,monospace' }}>
                  {teacher?.subject || 'Staff'} · {(teacher?.classes || []).join(', ')}
                </div>
              </div>
              <div className="av av-round" style={{ width: 30, height: 30, fontSize: 11, background: 'var(--accent)', color: '#000' }}>
                {initials(teacher?.name || 'T')}
              </div>
            </div>
          )}
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <Outlet context={{ teacher }} />
        </div>
      </div>
    </div>
  )
}
