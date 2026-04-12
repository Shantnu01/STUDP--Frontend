import { useState, useEffect } from 'react'
import { School, Plan, SchoolStatus } from '@/types'
import { X, Trash2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  school?: School | null
  onSave: (data: Omit<School, 'id'>) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}

const emptyForm = (): Omit<School, 'id'> => ({
  name: '', city: '', plan: 'Institutional Starter', students: 0,
  email: '', phone: '', status: 'active',
  lastPayment: new Date().toISOString().split('T')[0], notes: '',
})

export default function SchoolModal({ school, onSave, onDelete, onClose }: Props) {
  const [form, setForm] = useState<Omit<School, 'id'>>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (school) {
      const { id, ...rest } = school
      setForm(rest)
    } else {
      setForm(emptyForm())
    }
  }, [school])

  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save school')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setDeleting(true)
    try {
      await onDelete()
      toast.success(`"${form.name}" deleted successfully`)
      onClose()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete school')
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      backdropFilter: 'blur(4px)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
          backdropFilter: 'blur(2px)',
        }}>
          <div style={{
            background: 'var(--bg2)', border: '1px solid rgba(239,68,68,.3)',
            borderRadius: 16, padding: 28, maxWidth: 380, width: '90%',
            textAlign: 'center',
          }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(239,68,68,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertTriangle size={24} color="var(--red)" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Delete School?</div>
            <div style={{ fontSize: 13, color: 'var(--txt2)', lineHeight: 1.6, marginBottom: 22 }}>
              This will permanently delete <strong style={{ color: 'var(--txt)' }}>"{form.name}"</strong> and all associated data. This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                className="btn btn-ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
                style={{ minWidth: 120 }}
              >
                {deleting ? <><span className="spin" /> Deleting…</> : <><Trash2 size={13} /> Yes, Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        width: 480, background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 18, padding: 28, display: 'flex', flexDirection: 'column', gap: 16,
        maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.3px' }}>
              {school ? 'Edit School' : 'Add New School'}
            </div>
            {school && <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 3, fontFamily: 'DM Mono, monospace' }}>ID: {school.id}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--txt2)', cursor: 'pointer', padding: 4, borderRadius: 6 }}>
            <X size={18} />
          </button>
        </div>

        <div className="grid2">
          <div className="field">
            <label>School name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="DPS Velachery" />
          </div>
          <div className="field">
            <label>City</label>
            <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Chennai" />
          </div>
        </div>

        <div className="grid2">
          <div className="field">
            <label>Plan</label>
            <select value={form.plan} onChange={e => set('plan', e.target.value as Plan)}>
              <option>Institutional Starter</option>
              <option>Academy Pro</option>
              <option>Enterprise Excellence</option>
            </select>
          </div>
          <div className="field">
            <label>Students</label>
            <input type="number" value={form.students || ''} onChange={e => set('students', parseInt(e.target.value) || 0)} placeholder="1200" />
          </div>
        </div>

        <div className="field">
          <label>Contact email</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="principal@school.edu" />
        </div>

        <div className="grid2">
          <div className="field">
            <label>Phone</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
          </div>
          <div className="field">
            <label>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value as SchoolStatus)}>
              <option value="active">Active</option>
              <option value="overdue">Overdue</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>Last payment date</label>
          <input type="date" value={form.lastPayment} onChange={e => set('lastPayment', e.target.value)} />
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Internal notes…" />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 4, alignItems: 'center' }}>
          <div>
            {school && onDelete && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving}
              >
                <Trash2 size={12} /> Delete School
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving || deleting}>Cancel</button>
            <button className="btn btn-accent btn-sm" onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? <><span className="spin" /> Saving…</> : school ? 'Save Changes' : 'Add School'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
