import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAnnouncements } from '@/hooks/useComms'
import { Teacher } from '@/types'
import { fmtDateTime, initials } from '@/lib/utils'
import { Megaphone, Pin, X, Plus } from 'lucide-react'

export default function Announcements() {
  const { teacher } = useOutletContext<{ teacher: Teacher }>()
  const { announcements, loading, postAnnouncement, deleteAnnouncement } = useAnnouncements(teacher.schoolId)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', body: '',
    targetAudience: 'all' as 'all' | 'class' | 'teachers',
    targetClass: teacher.classes[0] ?? '',
    pinned: false,
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handlePost = async () => {
    if (!form.title.trim() || !form.body.trim()) return
    setSaving(true)
    try {
      await postAnnouncement({
        ...form,
        teacherId: teacher.id,
        teacherName: teacher.name,
        schoolId: teacher.schoolId,
      })
      setForm({ title: '', body: '', targetAudience: 'all', targetClass: teacher.classes[0] ?? '', pinned: false })
      setShowForm(false)
    } finally { setSaving(false) }
  }

  const visible = useMemo(() =>
    announcements.filter(a => !(a as any).deleted),
    [announcements]
  )
  const pinned = useMemo(() => visible.filter(a => a.pinned), [visible])
  const rest   = useMemo(() => visible.filter(a => !a.pinned), [visible])

  const Card = ({ a }: { a: any }) => (
    <div className="card" style={{ padding: 16, transition: 'border-color .15s' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div className="av av-round" style={{ width: 34, height: 34, fontSize: 12, background: 'rgba(167,139,250,.15)', color: 'var(--accent)', flexShrink: 0 }}>
          {initials(a.teacherName ?? '?')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            {a.pinned && <Pin size={11} color="var(--accent)" />}
            <span style={{ fontSize: 13, fontWeight: 600 }}>{a.title}</span>
            {a.targetAudience === 'class' && (
              <span className="badge badge-violet" style={{ fontSize: 9 }}>Class {a.targetClass}</span>
            )}
            {a.targetAudience === 'teachers' && (
              <span className="badge badge-gray" style={{ fontSize: 9 }}>Teachers only</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--txt2)', lineHeight: 1.6, marginBottom: 6, whiteSpace: 'pre-wrap' }}>
            {a.body}
          </div>
          <div style={{ fontSize: 10, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace' }}>
            {a.teacherName} · {fmtDateTime(a.createdAt)}
          </div>
        </div>
        {a.teacherId === teacher.id && (
          <button
            className="btn btn-danger btn-xs"
            onClick={() => { if (confirm('Remove this announcement?')) deleteAnnouncement(a.id) }}
            style={{ flexShrink: 0 }}
          >
            <X size={11} />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-accent" onClick={() => setShowForm(v => !v)}>
          <Plus size={13} /> Post announcement
        </button>
      </div>

      {/* Compose form */}
      {showForm && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">New announcement</span>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--txt2)', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="field">
              <label>Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Important notice for students…" autoFocus />
            </div>
            <div className="field">
              <label>Message *</label>
              <textarea
                value={form.body} onChange={e => set('body', e.target.value)}
                placeholder="Type your announcement here…"
                style={{ minHeight: 100 }}
              />
            </div>
            <div className="grid2">
              <div className="field">
                <label>Audience</label>
                <select value={form.targetAudience} onChange={e => set('targetAudience', e.target.value)}>
                  <option value="all">Everyone (students + staff)</option>
                  <option value="class">Specific class only</option>
                  <option value="teachers">Teachers only</option>
                </select>
              </div>
              {form.targetAudience === 'class' && (
                <div className="field">
                  <label>Class</label>
                  <select value={form.targetClass} onChange={e => set('targetClass', e.target.value)}>
                    {teacher.classes.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                className={`toggle ${form.pinned ? 'on' : ''}`}
                onClick={() => set('pinned', !form.pinned)}
              />
              <span style={{ fontSize: 12 }}>Pin to top of announcements board</span>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-accent btn-sm" onClick={handlePost} disabled={saving}>
                {saving ? <><span className="spin" /> Posting…</> : <><Megaphone size={12} /> Post</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pinned */}
      {pinned.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.8px', fontFamily: 'DM Mono,monospace' }}>
            📌 Pinned
          </div>
          {pinned.map(a => <Card key={a.id} a={a} />)}
        </>
      )}

      {/* Recent */}
      {rest.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.8px', fontFamily: 'DM Mono,monospace', marginTop: 4 }}>
            Recent
          </div>
          {rest.map(a => <Card key={a.id} a={a} />)}
        </>
      )}

      {!loading && visible.length === 0 && (
        <div className="empty">
          <Megaphone size={32} />
          <p>No announcements yet — be the first to post one!</p>
        </div>
      )}
    </div>
  )
}
