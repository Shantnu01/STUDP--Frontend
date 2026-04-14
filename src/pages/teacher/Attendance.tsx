import { useState, useMemo, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAttendance } from '@/hooks/useAcademic'
import { useStudents } from '@/hooks/useStudents'
import { Teacher, AttendanceStatus } from '@/types'
import { todayISO, fmtDate, initials, attendanceColor, exportCSV } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, AlertCircle, Download, ChevronDown, ChevronUp } from 'lucide-react'

const STATUSES: { key: AttendanceStatus; label: string; icon: any; color: string; short: string }[] = [
  { key: 'present', label: 'Present', short: 'P', icon: CheckCircle, color: 'var(--green)' },
  { key: 'absent',  label: 'Absent',  short: 'A', icon: XCircle,     color: 'var(--red)'   },
  { key: 'late',    label: 'Late',    short: 'L', icon: Clock,        color: 'var(--amber)' },
  { key: 'excused', label: 'Excused', short: 'E', icon: AlertCircle,  color: 'var(--blue)'  },
]

export default function Attendance() {
  const { teacher } = useOutletContext<{ teacher: Teacher }>()
  const { attendance, loading: attLoading, submitAttendance } = useAttendance(teacher.schoolId, teacher.id)
  const { students, loading: stuLoading } = useStudents(teacher.schoolId, teacher.classes)

  const [tab,          setTab]          = useState<'take' | 'history'>('take')
  const [selectedCls,  setSelectedCls]  = useState(teacher.classes[0] ?? '')
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [marks,        setMarks]        = useState<Record<string, AttendanceStatus>>({})
  const [submitting,   setSubmitting]   = useState(false)
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  const classStudents = useMemo(() =>
    students
      .filter(s => s.classId === selectedCls && s.status === 'active')
      .sort((a, b) => a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true })),
    [students, selectedCls]
  )

  // Pre-fill marks whenever date/class/attendance changes
  useEffect(() => {
    const existing = attendance.filter(a => a.date === selectedDate && a.class === selectedCls)
    if (existing.length > 0) {
      const m: Record<string, AttendanceStatus> = {}
      existing.forEach(a => { m[a.studentId] = a.status })
      setMarks(m)
    } else {
      setMarks({})
    }
  }, [attendance, selectedDate, selectedCls])

  const markAll = (status: AttendanceStatus) => {
    const m: Record<string, AttendanceStatus> = {}
    classStudents.forEach(s => { m[s.id] = status })
    setMarks(m)
  }

  const handleSubmit = async () => {
    if (!classStudents.length) return
    const records = classStudents.map(s => ({
      studentId: s.id,
      studentName: s.name,
      teacherId: teacher.id,
      schoolId: teacher.schoolId,
      class: selectedCls,
      date: selectedDate,
      status: marks[s.id] ?? 'absent',
    }))
    setSubmitting(true)
    try { await submitAttendance(records) } finally { setSubmitting(false) }
  }

  const markedCount = Object.keys(marks).length

  const summary = useMemo(() => {
    const r = { present: 0, absent: 0, late: 0, excused: 0 }
    Object.values(marks).forEach(s => { r[s as keyof typeof r]++ })
    return r
  }, [marks])

  // History: group by date
  const historyDates = useMemo(() => {
    const dates = [...new Set(
      attendance.filter(a => a.class === selectedCls).map(a => a.date)
    )].sort().reverse().slice(0, 30)
    return dates
  }, [attendance, selectedCls])

  const loading = attLoading || stuLoading

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Tabs + controls */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="tabs">
          {(['take', 'history'] as const).map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t === 'take' ? 'Take Attendance' : 'History'}
            </button>
          ))}
        </div>
        <div className="field" style={{ width: 160 }}>
          <label>Class</label>
          <select value={selectedCls} onChange={e => setSelectedCls(e.target.value)}>
            {teacher.classes.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </div>
        {tab === 'take' && (
          <div className="field" style={{ width: 180 }}>
            <label>Date</label>
            <input type="date" value={selectedDate} max={todayISO()}
              onChange={e => setSelectedDate(e.target.value)} />
          </div>
        )}
        <div style={{ flex: 1 }} />
        {tab === 'history' && (
          <button className="btn btn-ghost btn-sm" onClick={() =>
            exportCSV(
              attendance.filter(a => a.class === selectedCls).map(a => ({
                Date: a.date, Student: a.studentName, Status: a.status
              })),
              `attendance_class${selectedCls}.csv`
            )
          }>
            <Download size={12} /> Export CSV
          </button>
        )}
      </div>

      {/* ── TAKE ATTENDANCE ── */}
      {tab === 'take' && (
        <>
          {/* Summary pills */}
          {classStudents.length > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              {STATUSES.map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => markAll(key)}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: 9,
                    background: 'var(--bg2)', border: `1px solid ${color}30`,
                    cursor: 'pointer', transition: 'border-color .15s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = `${color}30`)}
                  title={`Mark all as ${label}`}
                >
                  <div style={{ fontSize: 16, fontWeight: 700, color }}>
                    {summary[key as keyof typeof summary]}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--txt2)' }}>{label}</div>
                  <div style={{ fontSize: 9, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace' }}>
                    tap to mark all
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <span className="card-title">
                Class {selectedCls} · {fmtDate(selectedDate)}
              </span>
              <span className="card-sub">{markedCount}/{classStudents.length} marked</span>
              <button
                className="btn btn-accent btn-sm"
                onClick={handleSubmit}
                disabled={submitting || classStudents.length === 0}
              >
                {submitting ? <><span className="spin" /> Saving…</> : 'Save Attendance'}
              </button>
            </div>

            {loading ? (
              <div style={{ padding: 28, textAlign: 'center', color: 'var(--txt3)', fontFamily: 'DM Mono,monospace' }}>
                Loading…
              </div>
            ) : classStudents.length === 0 ? (
              <div className="empty" style={{ padding: 32 }}>
                <p>No active students in Class {selectedCls}. Add students first.</p>
              </div>
            ) : (
              <div>
                {classStudents.map((s, i) => {
                  const status = marks[s.id]
                  return (
                    <div
                      key={s.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '9px 16px',
                        borderBottom: i < classStudents.length - 1 ? '1px solid var(--border)' : 'none',
                        background: status ? `${attendanceColor(status)}08` : 'transparent',
                        transition: 'background .1s',
                      }}
                    >
                      <span style={{ fontSize: 11, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace', width: 28, flexShrink: 0, textAlign: 'right' }}>
                        {s.rollNo}
                      </span>
                      <div className="av" style={{ width: 28, height: 28, fontSize: 10, flexShrink: 0, background: 'rgba(167,139,250,.15)', color: 'var(--accent)' }}>
                        {initials(s.name)}
                      </div>
                      <div style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{s.name}</div>
                      {/* Status buttons */}
                      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                        {STATUSES.map(({ key, short, icon: Icon, color }) => (
                          <button
                            key={key}
                            title={key}
                            onClick={() => setMarks(m => ({ ...m, [s.id]: key }))}
                            style={{
                              width: 34, height: 34, borderRadius: 8,
                              background: status === key ? `${color}22` : 'var(--bg3)',
                              border: `1.5px solid ${status === key ? color : 'var(--border)'}`,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all .12s',
                            }}
                          >
                            <Icon size={14} color={status === key ? color : 'var(--txt3)'} />
                          </button>
                        ))}
                      </div>
                      {status && (
                        <span style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: attendanceColor(status), minWidth: 50, textAlign: 'right', flexShrink: 0 }}>
                          {status}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── HISTORY ── */}
      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {historyDates.length === 0 ? (
            <div className="empty"><p>No attendance records for Class {selectedCls} yet.</p></div>
          ) : historyDates.map(date => {
            const recs    = attendance.filter(a => a.date === date && a.class === selectedCls)
            const present = recs.filter(a => a.status === 'present').length
            const total   = recs.length
            const pct     = total > 0 ? Math.round((present / total) * 100) : 0
            const expanded = expandedDate === date
            return (
              <div key={date} className="card">
                <div
                  className="card-header"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setExpandedDate(expanded ? null : date)}
                >
                  <span className="card-title">{fmtDate(date)}</span>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {STATUSES.map(({ key, color }) => {
                      const cnt = recs.filter(a => a.status === key).length
                      return cnt > 0 ? (
                        <span key={key} style={{ fontSize: 11, fontFamily: 'DM Mono,monospace', color }}>
                          {cnt} {key}
                        </span>
                      ) : null
                    })}
                    <span className="card-sub"
                      style={{ color: pct >= 75 ? 'var(--green)' : 'var(--red)' }}>
                      {pct}% present
                    </span>
                    {expanded ? <ChevronUp size={14} color="var(--txt3)" /> : <ChevronDown size={14} color="var(--txt3)" />}
                  </div>
                </div>
                {expanded && (
                  <div style={{ padding: '10px 16px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {recs
                      .sort((a, b) => a.studentName.localeCompare(b.studentName))
                      .map(a => (
                        <div
                          key={a.studentId}
                          style={{
                            fontSize: 11, padding: '3px 9px', borderRadius: 6,
                            background: `${attendanceColor(a.status)}15`,
                            border: `1px solid ${attendanceColor(a.status)}30`,
                            color: attendanceColor(a.status),
                            fontFamily: 'DM Mono,monospace',
                          }}
                          title={`${a.studentName} — ${a.status}`}
                        >
                          {a.studentName.split(' ')[0]} · {a.status[0].toUpperCase()}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
