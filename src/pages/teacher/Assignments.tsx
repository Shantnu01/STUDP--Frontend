import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAssignments } from '@/hooks/useAcademic'
import { Teacher, Assignment } from '@/types'
import { fmtDate, statusBadgeClass, todayISO } from '@/lib/utils'
import { Plus, X, Pencil, BookOpen } from 'lucide-react'

const EXAM_TYPES = ['Unit Test 1', 'Unit Test 2', 'Midterm', 'Final Exam', 'Assignment', 'Project', 'Quiz'] as const

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: 500, maxHeight: '86vh', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--txt2)', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>{children}</div>
      </div>
    </div>
  )
}

type FormData = {
  title: string; description: string; subject: string; class: string
  dueDate: string; maxMarks: number; status: 'draft' | 'published' | 'closed'
}

export default function Assignments() {
  const { teacher } = useOutletContext<{ teacher: Teacher }>()
  const { assignments, loading, addAssignment, updateAssignment, deleteAssignment } = useAssignments(teacher.schoolId, teacher.id)

  const [showModal, setShowModal] = useState(false)
  const [editing,   setEditing]   = useState<Assignment | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [filterCls, setFilterCls] = useState('')

  const defaultForm = (): FormData => ({
    title: '', description: '', subject: teacher.subjects?.[0] ?? teacher.subject ?? '',
    class: teacher.classes[0] ?? '', dueDate: '', maxMarks: 100, status: 'draft',
  })
  const [form, setForm] = useState<FormData>(defaultForm())
  const set = (k: keyof FormData, v: any) => setForm(f => ({ ...f, [k]: v }))

  const subjects = useMemo(() =>
    (teacher.subjects?.length ? teacher.subjects : [teacher.subject]).filter(Boolean),
    [teacher.subjects, teacher.subject]
  )

  const openAdd = () => { setEditing(null); setForm(defaultForm()); setShowModal(true) }
  const openEdit = (a: Assignment) => {
    setEditing(a)
    setForm({
      title: a.title, description: a.description, subject: a.subject,
      class: a.class, dueDate: a.dueDate, maxMarks: a.maxMarks, status: a.status,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await updateAssignment(editing.id, form)
      } else {
        await addAssignment({ ...form, teacherId: teacher.id, schoolId: teacher.schoolId })
      }
      setShowModal(false)
    } finally { setSaving(false) }
  }

  const today = todayISO()

  const visibleAssignments = useMemo(() =>
    assignments.filter(a => !filterCls || a.class === filterCls),
    [assignments, filterCls]
  )

  const grouped = useMemo(() => ({
    published: visibleAssignments.filter(a => a.status === 'published'),
    draft:     visibleAssignments.filter(a => a.status === 'draft'),
    closed:    visibleAssignments.filter(a => a.status === 'closed'),
  }), [visibleAssignments])

  const AssignmentCard = ({ a }: { a: Assignment }) => {
    const isOverdue = a.status === 'published' && a.dueDate < today
    return (
      <div
        className="card"
        style={{ padding: 14, transition: 'border-color .15s' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 5 }}>
              <span className={`badge ${statusBadgeClass(a.status)}`}>{a.status}</span>
              <span className="badge badge-violet">Class {a.class}</span>
              <span className="badge badge-gray">{a.subject}</span>
              {isOverdue && <span className="badge badge-red">Overdue</span>}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{a.title}</div>
            {a.description && (
              <div style={{ fontSize: 11, color: 'var(--txt2)', marginBottom: 6, lineHeight: 1.5 }}>
                {a.description.length > 120 ? a.description.slice(0, 120) + '…' : a.description}
              </div>
            )}
            <div style={{ fontSize: 10, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace' }}>
              Max marks: {a.maxMarks} · Due: {a.dueDate ? fmtDate(a.dueDate) : 'No due date'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {a.status === 'draft' && (
              <button className="btn btn-green btn-xs" onClick={() => updateAssignment(a.id, { status: 'published' })}>
                Publish
              </button>
            )}
            {a.status === 'published' && (
              <button className="btn btn-ghost btn-xs" onClick={() => updateAssignment(a.id, { status: 'closed' })}>
                Close
              </button>
            )}
            <button className="btn btn-blue btn-xs" onClick={() => openEdit(a)}><Pencil size={10} /></button>
            <button className="btn btn-danger btn-xs" onClick={() => { if (confirm(`Delete "${a.title}"?`)) deleteAssignment(a.id) }}><X size={10} /></button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Stats + toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="grid4" style={{ flex: 1 }}>
          {[
            { l: 'Total',     v: assignments.length },
            { l: 'Published', v: grouped.published.length },
            { l: 'Drafts',    v: grouped.draft.length },
            { l: 'Closed',    v: grouped.closed.length },
          ].map(({ l, v }) => (
            <div key={l} className="mc" style={{ padding: '10px 14px' }}>
              <div className="mc-label">{l}</div>
              <div className="mc-value" style={{ fontSize: 20 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <select
          value={filterCls} onChange={e => setFilterCls(e.target.value)}
          style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 7, padding: '7px 10px', fontSize: 12, color: 'var(--txt)', outline: 'none' }}
        >
          <option value="">All classes</option>
          {teacher.classes.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn btn-accent" onClick={openAdd}>
          <Plus size={13} /> New assignment
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', color: 'var(--txt3)', fontFamily: 'DM Mono,monospace', padding: 28 }}>Loading…</div>}

      {!loading && visibleAssignments.length === 0 && (
        <div className="empty">
          <BookOpen size={32} />
          <p>No assignments yet — create your first one!</p>
        </div>
      )}

      {(['published', 'draft', 'closed'] as const).map(status => {
        const list = grouped[status]
        if (!list.length) return null
        return (
          <div key={status}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 8, fontFamily: 'DM Mono,monospace' }}>
              {status}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map(a => <AssignmentCard key={a.id} a={a} />)}
            </div>
          </div>
        )
      })}

      {showModal && (
        <Modal title={editing ? 'Edit assignment' : 'New assignment'} onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="field">
              <label>Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Chapter 5 — Quadratic Equations" autoFocus />
            </div>
            <div className="field">
              <label>Description / Instructions</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Solve problems 1–20 from your textbook…" />
            </div>
            <div className="grid2">
              <div className="field">
                <label>Class *</label>
                <select value={form.class} onChange={e => set('class', e.target.value)}>
                  {teacher.classes.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Subject</label>
                <select value={form.subject} onChange={e => set('subject', e.target.value)}>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid2">
              <div className="field">
                <label>Due date</label>
                <input type="date" value={form.dueDate} min={todayISO()} onChange={e => set('dueDate', e.target.value)} />
              </div>
              <div className="field">
                <label>Max marks</label>
                <input type="number" value={form.maxMarks} min={0} onChange={e => set('maxMarks', parseInt(e.target.value) || 0)} />
              </div>
            </div>
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value as any)}>
                <option value="draft">Draft — only visible to you</option>
                <option value="published">Published — visible to students</option>
                <option value="closed">Closed — no more submissions</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-accent btn-sm" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spin" /> Saving…</> : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
