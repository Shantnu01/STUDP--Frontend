import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useLeave } from '@/hooks/useComms'
import { Teacher } from '@/types'
import { fmtDate, statusBadgeClass, daysBetween, todayISO } from '@/lib/utils'
import { PlaneTakeoff, Plus, X, Calendar } from 'lucide-react'

const LEAVE_TYPES = ['sick', 'casual', 'earned', 'emergency', 'other'] as const
type LeaveType = typeof LEAVE_TYPES[number]

const LEAVE_LABELS: Record<LeaveType, string> = {
  sick:      'Sick Leave',
  casual:    'Casual Leave',
  earned:    'Earned Leave',
  emergency: 'Emergency Leave',
  other:     'Other',
}

export default function Leave() {
  const { teacher } = useOutletContext<{ teacher: Teacher }>()
  const { leaves, loading, applyLeave, cancelLeave } = useLeave(teacher.schoolId, teacher.id)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<{
    type: LeaveType; from: string; to: string; reason: string
  }>({ type: 'sick', from: '', to: '', reason: '' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const computedDays = useMemo(() => {
    if (!form.from || !form.to || form.to < form.from) return 0
    return daysBetween(form.from, form.to)
  }, [form.from, form.to])

  const handleApply = async () => {
    if (!form.from || !form.to || !form.reason.trim()) return
    if (form.to < form.from) return
    setSaving(true)
    try {
      await applyLeave({
        teacherId:   teacher.id,
        teacherName: teacher.name,
        schoolId:    teacher.schoolId,
        type:        form.type,
        from:        form.from,
        to:          form.to,
        days:        computedDays,
        reason:      form.reason,
      })
      setForm({ type: 'sick', from: '', to: '', reason: '' })
      setShowForm(false)
    } finally { setSaving(false) }
  }

  const today = todayISO()

  const stats = useMemo(() => ({
    pending:  leaves.filter(l => l.status === 'Pending').length,
    approved: leaves.filter(l => l.status === 'Approved').length,
    rejected: leaves.filter(l => l.status === 'Rejected').length,
    totalDays: leaves
      .filter(l => l.status === 'Approved')
      .reduce((a, l) => a + (daysBetween(l.start_date, l.end_date)), 0),
  }), [leaves])

  const groups = useMemo(() => ({
    pending:  leaves.filter(l => l.status === 'Pending'),
    approved: leaves.filter(l => l.status === 'Approved'),
    rejected: leaves.filter(l => l.status === 'Rejected'),
  }), [leaves])

  const LeaveCard = ({ l }: { l: any }) => {
    const days = daysBetween(l.start_date, l.end_date)
    const status = l.status.toLowerCase()
    
    return (
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: status === 'approved' ? 'rgba(52,211,153,.12)' : status === 'rejected' ? 'rgba(248,113,113,.12)' : 'rgba(251,191,36,.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Calendar size={16} color={status === 'approved' ? 'var(--green)' : status === 'rejected' ? 'var(--red)' : 'var(--amber)'} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 5 }}>
              <span className={`badge ${statusBadgeClass(status)}`}>{l.status}</span>
              <span className="badge badge-gray">{LEAVE_LABELS[l.leave_type as LeaveType] ?? l.leave_type}</span>
              <span style={{ fontSize: 11, fontFamily: 'DM Mono,monospace', color: 'var(--txt2)' }}>
                {days} day{days !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              {fmtDate(l.start_date)} — {fmtDate(l.end_date)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt2)', lineHeight: 1.5 }}>{l.reason}</div>
            {l.principalNote && (
              <div style={{
                marginTop: 8, fontSize: 11, color: 'var(--accent)',
                background: 'rgba(167,139,250,.08)', border: '1px solid rgba(167,139,250,.2)',
                borderRadius: 7, padding: '7px 11px', lineHeight: 1.5,
              }}>
                <span style={{ fontWeight: 600, fontFamily: 'DM Mono,monospace', fontSize: 10 }}>PRINCIPAL: </span>
                {l.principalNote}
              </div>
            )}
          </div>
          {l.status === 'Pending' && (
            <button
              className="btn btn-danger btn-xs"
              style={{ flexShrink: 0 }}
              onClick={() => { if (confirm('Withdraw this leave application?')) cancelLeave(l.id) }}
            >
              <X size={10} /> Withdraw
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Stats + action */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="grid4" style={{ flex: 1 }}>
          {[
            { l: 'Pending',       v: stats.pending,  cls: stats.pending > 0 ? 'neu' : '' },
            { l: 'Approved',      v: stats.approved, cls: stats.approved > 0 ? 'up' : '' },
            { l: 'Rejected',      v: stats.rejected, cls: stats.rejected > 0 ? 'dn' : '' },
            { l: 'Approved days', v: stats.totalDays, cls: '' },
          ].map(({ l, v, cls }) => (
            <div key={l} className="mc" style={{ padding: '10px 14px' }}>
              <div className="mc-label">{l}</div>
              <div className={`mc-value ${cls}`} style={{ fontSize: 20 }}>{v}</div>
            </div>
          ))}
        </div>
        <button className="btn btn-accent" onClick={() => setShowForm(v => !v)}>
          <Plus size={13} /> Apply for leave
        </button>
      </div>

      {/* Application form */}
      {showForm && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Leave application</span>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--txt2)', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="field">
              <label>Leave type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}>
                {LEAVE_TYPES.map(t => <option key={t} value={t}>{LEAVE_LABELS[t]}</option>)}
              </select>
            </div>
            <div className="grid2">
              <div className="field">
                <label>From date *</label>
                <input type="date" value={form.from} min={today}
                  onChange={e => set('from', e.target.value)} />
              </div>
              <div className="field">
                <label>To date *</label>
                <input type="date" value={form.to} min={form.from || today}
                  onChange={e => set('to', e.target.value)} />
              </div>
            </div>

            {computedDays > 0 && (
              <div style={{
                fontSize: 11, color: 'var(--accent)', fontFamily: 'DM Mono,monospace',
                background: 'rgba(167,139,250,.08)', border: '1px solid rgba(167,139,250,.2)',
                borderRadius: 7, padding: '6px 11px',
              }}>
                Duration: {computedDays} day{computedDays !== 1 ? 's' : ''}
              </div>
            )}

            <div className="field">
              <label>Reason *</label>
              <textarea
                value={form.reason} onChange={e => set('reason', e.target.value)}
                placeholder="Please provide a brief reason for your leave…"
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
              <button
                className="btn btn-accent btn-sm"
                onClick={handleApply}
                disabled={saving || !form.from || !form.to || !form.reason.trim() || computedDays === 0}
              >
                {saving ? <><span className="spin" /> Submitting…</> : <><PlaneTakeoff size={12} /> Submit application</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sections */}
      {loading && (
        <div style={{ textAlign: 'center', color: 'var(--txt3)', fontFamily: 'DM Mono,monospace', padding: 28 }}>Loading…</div>
      )}

      {!loading && leaves.length === 0 && (
        <div className="empty">
          <PlaneTakeoff size={32} />
          <p>No leave applications yet</p>
        </div>
      )}

      {(['pending', 'approved', 'rejected'] as const).map(status => {
        const list = groups[status]
        if (!list.length) return null
        return (
          <div key={status}>
            <div style={{ fontSize: 11, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 8, fontFamily: 'DM Mono,monospace' }}>
              {status}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map(l => <LeaveCard key={l.id} l={l} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
