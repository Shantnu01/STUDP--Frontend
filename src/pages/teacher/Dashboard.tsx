import { useMemo } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { useStudents } from '@/hooks/useStudents'
import { useAttendance, useAssignments } from '@/hooks/useAcademic'
import { useAnnouncements } from '@/hooks/useComms'
import { Teacher } from '@/types'
import { fmtDateShort, initials, todayISO } from '@/lib/utils'
import { Users, ClipboardCheck, BookOpen, Megaphone, ChevronRight, AlertCircle } from 'lucide-react'

export default function Dashboard() {
  const { teacher } = useOutletContext<{ teacher: Teacher }>()
  const nav = useNavigate()

  const { students } = useStudents(teacher?.schoolId, teacher?.classes || [])
  const { attendance } = useAttendance(teacher.schoolId, teacher.id)
  const { assignments } = useAssignments(teacher.schoolId, teacher.id)
  const { announcements } = useAnnouncements(teacher.schoolId)

  const today = todayISO()
  const hour  = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const todayAtt     = useMemo(() => attendance.filter(a => a.date === today), [attendance, today])
  const attTaken     = todayAtt.length > 0
  const presentToday = todayAtt.filter(a => a.status === 'present').length
  const absentToday  = todayAtt.filter(a => a.status === 'absent').length

  const activeStudents = useMemo(() => students.filter(s => s.status === 'active'), [students])

  const upcomingAssignments = useMemo(() =>
    assignments
      .filter(a => a.status === 'published' && a.dueDate >= today)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5),
    [assignments, today]
  )
  const overdueCount = useMemo(() =>
    assignments.filter(a => a.status === 'published' && a.dueDate < today).length,
    [assignments, today]
  )

  const attRate = useMemo(() => {
    if (!attendance.length) return null
    return Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
  }, [attendance])

  const classCounts = useMemo(() =>
    (teacher?.classes || []).map(cls => ({
      cls,
      total:   activeStudents.filter(s => s.classId === cls).length,
      present: todayAtt.filter(a => a.class === cls && a.status === 'present').length,
      taken:   todayAtt.some(a => a.class === cls),
    })), [teacher.classes, activeStudents, todayAtt]
  )

  const recentAnnouncements = useMemo(() =>
    announcements.filter(a => !(a as any).deleted).slice(0, 4),
    [announcements]
  )

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(167,139,250,.1),rgba(96,165,250,.05))',
        border: '1px solid rgba(167,139,250,.2)', borderRadius: 14,
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      }}>
        <div className="av av-round" style={{ width: 44, height: 44, fontSize: 16, background: 'var(--accent)', color: '#000', flexShrink: 0 }}>
          {initials(teacher?.name || 'Teacher')}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.3px' }}>
            {greeting}, {(teacher?.name || '').split(' ')[0]} 👋
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt2)', marginTop: 3 }}>
            {teacher?.subject} · Classes: {(teacher?.classes || []).join(', ')} ·{' '}
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
        {!attTaken && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.2)',
            borderRadius: 8, padding: '8px 12px',
          }}>
            <AlertCircle size={13} color="var(--amber)" />
            <span style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 500 }}>
              Attendance not taken today
            </span>
            <button className="btn btn-xs btn-accent" onClick={() => nav('/teacher/attendance')}>
              Take now
            </button>
          </div>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid4">
        {[
          {
            label: 'My students', value: activeStudents.length, icon: Users,
            color: 'var(--accent)', delta: `${(teacher?.classes || []).length} class${(teacher?.classes || []).length > 1 ? 'es' : ''}`,
            deltaClass: '', onClick: () => nav('/teacher/students'),
          },
          {
            label: 'Today present', value: attTaken ? String(presentToday) : '—', icon: ClipboardCheck,
            color: 'var(--green)',
            delta: attTaken ? `${absentToday} absent` : 'Not taken yet',
            deltaClass: attTaken && absentToday > 0 ? 'dn' : attTaken ? 'up' : 'neu',
            onClick: () => nav('/teacher/attendance'),
          },
          {
            label: 'Assignments due', value: upcomingAssignments.length, icon: BookOpen,
            color: 'var(--blue)',
            delta: overdueCount > 0 ? `${overdueCount} overdue` : 'All on track',
            deltaClass: overdueCount > 0 ? 'dn' : 'up',
            onClick: () => nav('/teacher/assignments'),
          },
          {
            label: 'Attendance rate', value: attRate !== null ? `${attRate}%` : '—', icon: ClipboardCheck,
            color: 'var(--amber)',
            delta: attRate !== null ? (attRate >= 75 ? 'Good standing' : 'Below 75%') : 'No data yet',
            deltaClass: attRate !== null ? (attRate >= 75 ? 'up' : 'dn') : '',
          },
        ].map(({ label, value, icon: Icon, color, delta, deltaClass, onClick }) => (
          <div
            key={label}
            className="mc"
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            onClick={onClick}
            onMouseEnter={e => onClick && ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)')}
            onMouseLeave={e => onClick && ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div className="mc-label">{label}</div>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={13} color={color} />
              </div>
            </div>
            <div className="mc-value">{value}</div>
            <div className={`mc-delta ${deltaClass}`}>{delta}</div>
          </div>
        ))}
      </div>

      <div className="row2">
        {/* Classes overview */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">My classes</span>
            <button className="btn btn-ghost btn-sm" onClick={() => nav('/teacher/students')}>
              View students <ChevronRight size={11} />
            </button>
          </div>
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {classCounts.length === 0 ? (
              <div className="empty" style={{ padding: 20 }}><p>No classes assigned yet</p></div>
            ) : classCounts.map(({ cls, total, present, taken }) => {
              const pct = total > 0 ? Math.round((present / total) * 100) : 0
              return (
                <div
                  key={cls}
                  onClick={() => nav('/teacher/attendance')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                    background: 'var(--bg3)', borderRadius: 9, border: '1px solid var(--border)',
                    cursor: 'pointer', transition: 'border-color .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div className="av" style={{ width: 36, height: 36, fontSize: 13, background: 'rgba(167,139,250,.15)', color: 'var(--accent)' }}>
                    {cls}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>Class {cls}</div>
                    <div style={{ fontSize: 11, color: 'var(--txt2)', marginTop: 1 }}>{total} students</div>
                  </div>
                  {taken ? (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: pct >= 75 ? 'var(--green)' : 'var(--red)' }}>
                        {pct}%
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--txt3)' }}>today</div>
                    </div>
                  ) : (
                    <span style={{ fontSize: 10, color: 'var(--amber)', fontFamily: 'DM Mono,monospace' }}>not taken</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Upcoming assignments */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Upcoming due dates</span>
              <button className="btn btn-ghost btn-sm" onClick={() => nav('/teacher/assignments')}>
                <ChevronRight size={11} />
              </button>
            </div>
            {upcomingAssignments.length === 0 ? (
              <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace' }}>
                No upcoming assignments
              </div>
            ) : upcomingAssignments.map(a => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 16px', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.title}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--txt2)', fontFamily: 'DM Mono,monospace', marginTop: 1 }}>
                    Class {a.class} · {a.subject}
                  </div>
                </div>
                <div style={{ fontSize: 11, fontFamily: 'DM Mono,monospace', flexShrink: 0, color: a.dueDate === today ? 'var(--red)' : 'var(--amber)' }}>
                  {a.dueDate === today ? 'Due today' : fmtDateShort(a.dueDate)}
                </div>
              </div>
            ))}
          </div>

          {/* Recent announcements */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Announcements</span>
              <button className="btn btn-ghost btn-sm" onClick={() => nav('/teacher/announcements')}>
                <ChevronRight size={11} />
              </button>
            </div>
            {recentAnnouncements.length === 0 ? (
              <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace' }}>
                No announcements
              </div>
            ) : recentAnnouncements.map(a => (
              <div key={a.id} style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                  {a.pinned && (
                    <span style={{ fontSize: 9, color: 'var(--accent)', background: 'rgba(167,139,250,.1)', padding: '1px 5px', borderRadius: 4, fontFamily: 'DM Mono,monospace' }}>
                      PINNED
                    </span>
                  )}
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{a.title}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--txt2)', lineHeight: 1.5 }}>
                  {a.body.length > 80 ? a.body.slice(0, 80) + '…' : a.body}
                </div>
                <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 3, fontFamily: 'DM Mono,monospace' }}>
                  {a.teacherName} · {fmtDateShort(a.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
