import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSchools } from '@/hooks/useSchools'
import { useRegistrations } from '@/hooks/useRegistrations'
import { useAdminGlobalChat } from '@/hooks/useAdminGlobalChat'
import MessagingPanel from '@/components/MessagingPanel'
import SchoolModal from '@/components/modals/SchoolModal'
import {
  LayoutDashboard, School, BarChart2, CreditCard, FileText,
  ClipboardList, Settings, MessageSquare, LogOut, Plus, Download,
} from 'lucide-react'
import { initials, exportCSV } from '@/lib/utils'

const NAV = [
  { label: 'Dashboard',  path: '/dashboard',  icon: LayoutDashboard, group: 'Overview' },
  { label: 'Analytics',  path: '/analytics',  icon: BarChart2,       group: 'Overview' },
  { label: 'Schools',    path: '/schools',     icon: School,          group: 'Schools' },
  { label: 'Requests',   path: '/requests',    icon: ClipboardList,   group: 'Schools' },
  { label: 'Billing',    path: '/billing',     icon: CreditCard,      group: 'Finance' },
  { label: 'Pricing',    path: '/pricing',     icon: CreditCard,      group: 'Finance' },
  { label: 'Invoices',   path: '/invoices',    icon: FileText,        group: 'Finance' },
  { label: 'Settings',   path: '/settings',    icon: Settings,        group: 'System' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { schools, addSchool } = useSchools()
  const { registrations } = useRegistrations()
  const nav = useNavigate()
  const location = useLocation()
  const [msgOpen, setMsgOpen] = useState(false)
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null)
  const [addSchoolOpen, setAddSchoolOpen] = useState(false)

  const { totalUnread } = useAdminGlobalChat(schools)

  const pendingCount = registrations.filter(r => r.status === 'pending').length
  const userInitials = user?.displayName
    ? initials(user.displayName)
    : (user?.email ?? 'AD').slice(0, 2).toUpperCase()

  const currentSection = NAV.find(n => location.pathname === n.path)?.label ?? 'Dashboard'

  const handleExport = () => {
    exportCSV(
      schools.map(s => ({ Name: s.name, City: s.city, Plan: s.plan, Students: s.students, Status: s.status, Email: s.email })),
      `edusync_schools_${new Date().toISOString().split('T')[0]}.csv`
    )
  }

  // Expose openChat globally for table buttons
  ;(window as any).__openChat = (id: string, name: string) => {
    setSelectedSchoolId(id)
    setMsgOpen(true)
  }

  const groups = [...new Set(NAV.map(n => n.group))]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── RAIL ─────────────────────────────────────────────── */}
      <div style={{
        width: 52, flexShrink: 0, background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '12px 0', gap: 3,
      }}>
        <div style={{
          width: 30, height: 30, background: 'var(--accent)', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#000' }}>E</span>
        </div>

        {NAV.map(({ path, icon: Icon, label }) => (
          <NavLink key={path} to={path} title={label} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all .15s',
                background: isActive ? 'var(--bg3)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--txt3)',
              }}>
                <Icon size={16} />
              </div>
            )}
          </NavLink>
        ))}

        {/* Messages */}
        <div
          onClick={() => setMsgOpen(v => !v)}
          title="Messages"
          style={{
            width: 36, height: 36, borderRadius: 8, position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all .15s',
            background: msgOpen ? 'var(--bg3)' : 'transparent',
            color: msgOpen ? 'var(--accent)' : 'var(--txt3)',
          }}
        >
          <MessageSquare size={16} />
          {totalUnread > 0 && (
            <div style={{
              position: 'absolute', top: 5, right: 3, padding: '1px 3px', minWidth: 10,
              borderRadius: '99px', background: 'var(--red)', color: '#fff', fontSize: 8, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, border: '1.5px solid var(--bg2)'
            }}>{totalUnread}</div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        <div
          onClick={() => { logout(); nav('/login') }}
          title="Sign out"
          style={{
            width: 36, height: 36, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--txt3)', transition: 'all .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--txt3)')}
        >
          <LogOut size={15} />
        </div>

        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: '#000', marginTop: 4,
        }}>{userInitials}</div>
      </div>

      {/* ── SIDEBAR ──────────────────────────────────────────── */}
      <div style={{
        width: 200, flexShrink: 0, background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>EduSync</div>
          <div style={{ fontSize: 11, color: 'var(--txt2)', marginTop: 2, fontFamily: 'DM Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
        </div>

        <div style={{ padding: '10px 8px', flex: 1, overflowY: 'auto' }}>
          {groups.map(group => (
            <div key={group}>
              <div style={{
                fontSize: 9, textTransform: 'uppercase', letterSpacing: 1,
                color: 'var(--txt3)', padding: '14px 8px 5px',
                fontFamily: 'DM Mono, monospace',
              }}>{group}</div>
              {NAV.filter(n => n.group === group).map(({ path, icon: Icon, label }) => (
                <NavLink key={path} to={path} style={{ textDecoration: 'none' }}>
                  {({ isActive }) => (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '7px 9px', borderRadius: 7, marginBottom: 1,
                      cursor: 'pointer', fontSize: 12, transition: 'all .15s',
                      background: isActive ? 'var(--bg3)' : 'transparent',
                      color: isActive ? 'var(--accent)' : 'var(--txt2)',
                      fontWeight: isActive ? 500 : 400,
                    }}>
                      <Icon size={13} />
                      {label}
                      {label === 'Requests' && pendingCount > 0 && (
                        <span style={{
                          marginLeft: 'auto', background: 'var(--red)', color: '#fff',
                          fontSize: 9, borderRadius: 99, padding: '1px 5px',
                          fontFamily: 'DM Mono, monospace', fontWeight: 600,
                        }}>{pendingCount}</span>
                      )}
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          ))}

          {/* Messages shortcut */}
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--txt3)', padding: '14px 8px 5px', fontFamily: 'DM Mono, monospace' }}>Comms</div>
          <div
            onClick={() => setMsgOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '7px 9px', borderRadius: 7, marginBottom: 1,
              cursor: 'pointer', fontSize: 12, transition: 'all .15s',
              color: 'var(--txt2)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'; (e.currentTarget as HTMLElement).style.color = 'var(--txt)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--txt2)' }}
          >
            <MessageSquare size={13} />
            Messages
            {totalUnread > 0 && (
              <span style={{
                marginLeft: 'auto', background: 'var(--red)', color: '#fff',
                fontSize: 9, borderRadius: 99, padding: '1px 5px',
                fontFamily: 'DM Mono, monospace', fontWeight: 600,
              }}>{totalUnread} new</span>
            )}
          </div>
        </div>

        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <button
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', fontSize: 11 }}
            onClick={() => { logout(); nav('/login') }}
          >
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </div>

      {/* ── MAIN ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <div style={{
          height: 50, background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10, flexShrink: 0,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-.3px', flex: 1 }}>
            {currentSection}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleExport}>
            <Download size={12} /> Export CSV
          </button>
          <button className="btn btn-accent btn-sm" onClick={() => setAddSchoolOpen(true)}>
            <Plus size={12} /> Add school
          </button>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <Outlet context={{ setSelectedSchoolId, setMsgOpen }} />
        </div>
      </div>

      {/* ── MESSAGING PANEL ──────────────────────────────────── */}
      {msgOpen && (
        <MessagingPanel
          schools={schools}
          initialSchoolId={selectedSchoolId}
          onClose={() => { setMsgOpen(false); setSelectedSchoolId(null) }}
        />
      )}

      {/* ── ADD SCHOOL MODAL ─────────────────────────────────── */}
      {addSchoolOpen && (
        <SchoolModal
          school={null}
          onSave={addSchool}
          onClose={() => setAddSchoolOpen(false)}
        />
      )}
    </div>
  )
}
