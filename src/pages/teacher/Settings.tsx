import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { Teacher } from '@/types'
import { initials, subjectColor, fmtDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Lock, User, BookOpen, Phone, Mail, Contact } from 'lucide-react'

export default function Settings() {
  const { teacher } = useOutletContext<{ teacher: Teacher }>()

  const [oldPwd,   setOldPwd]   = useState('')
  const [newPwd,   setNewPwd]   = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [changing, setChanging] = useState(false)
  const [phone,    setPhone]    = useState(teacher.phone ?? '')
  const [savingPh, setSavingPh] = useState(false)

  const changePassword = async () => {
    if (!oldPwd)          { toast.error('Enter your current password'); return }
    if (newPwd.length < 8){ toast.error('New password must be at least 8 characters'); return }
    if (newPwd !== confirm){ toast.error('Passwords do not match'); return }
    setChanging(true)
    try {
      const user = auth.currentUser
      if (!user?.email) throw new Error('Not logged in')
      const cred = EmailAuthProvider.credential(user.email, oldPwd)
      await reauthenticateWithCredential(user, cred)
      await updatePassword(user, newPwd)
      toast.success('Password changed successfully')
      setOldPwd(''); setNewPwd(''); setConfirm('')
    } catch (e: any) {
      const msg = e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'
        ? 'Current password is incorrect'
        : e.message
      toast.error(msg)
    } finally { setChanging(false) }
  }

  const savePhone = async () => {
    setSavingPh(true)
    try {
      await updateDoc(doc(db, 'teachers', teacher.id), { phone, updatedAt: new Date().toISOString() })
      toast.success('Phone number updated')
    } catch (e: any) { toast.error(e.message) }
    finally { setSavingPh(false) }
  }

  const color = subjectColor(teacher.subject ?? '')

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 580 }}>

      {/* Profile card */}
      <div className="card">
        <div className="card-header">
          <User size={14} color="var(--accent)" />
          <span className="card-title">My profile</span>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Avatar + name */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
            background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)',
          }}>
            <div className="av av-round" style={{ width: 52, height: 52, fontSize: 18, background: `${color}20`, color, flexShrink: 0 }}>
              {initials(teacher.name)}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.3px' }}>{teacher.name}</div>
              <div style={{ fontSize: 12, color: 'var(--txt2)', marginTop: 3 }}>{teacher.email}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                <span className="badge badge-violet">{teacher.subject}</span>
                <span className={`badge ${teacher.role === 'principal' ? 'badge-amber' : 'badge-gray'}`}>
                  {teacher.role === 'principal' ? '👑 Principal' : 'Teacher'}
                </span>
                <span className="badge badge-green">{teacher.status}</span>
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid2">
            {[
              { icon: Contact, label: 'Employee ID',   value: teacher.employeeId   || '—' },
              { icon: BookOpen, label: 'Qualification', value: teacher.qualification || '—' },
              { icon: Mail,   label: 'Email',          value: teacher.email         || '—' },
              { icon: null,   label: 'Join date',      value: teacher.joinDate ? fmtDate(teacher.joinDate) : '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)', padding: '10px 12px' }}>
                <div style={{ fontSize: 9, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: .5, fontFamily: 'DM Mono,monospace', marginBottom: 3 }}>
                  {label}
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Editable phone */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Phone number (editable)</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                onKeyDown={e => e.key === 'Enter' && savePhone()}
              />
            </div>
            <button className="btn btn-accent btn-sm" onClick={savePhone} disabled={savingPh || phone === teacher.phone}>
              {savingPh ? <><span className="spin" /> Saving…</> : 'Save'}
            </button>
          </div>

          <div style={{ fontSize: 11, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace' }}>
            To update name, subjects, or classes — contact your school admin or principal.
          </div>
        </div>
      </div>

      {/* Subjects & classes */}
      <div className="card">
        <div className="card-header">
          <BookOpen size={14} color="var(--accent)" />
          <span className="card-title">Teaching assignments</span>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--txt2)', fontFamily: 'DM Mono,monospace', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>
              Subjects
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(teacher.subjects?.length ? teacher.subjects : [teacher.subject]).filter(Boolean).map(s => (
                <span key={s} className="badge badge-violet">{s}</span>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--txt2)', fontFamily: 'DM Mono,monospace', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>
              Classes
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(teacher.classes ?? []).map(c => (
                <span key={c} className="badge badge-gray">Class {c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <div className="card-header">
          <Lock size={14} color="var(--accent)" />
          <span className="card-title">Change password</span>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field">
            <label>Current password</label>
            <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)}
              placeholder="Your current password" autoComplete="current-password" />
          </div>
          <div className="field">
            <label>New password</label>
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
              placeholder="At least 8 characters" autoComplete="new-password" />
          </div>
          <div className="field">
            <label>Confirm new password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat new password" autoComplete="new-password"
              onKeyDown={e => e.key === 'Enter' && changePassword()} />
          </div>
          {newPwd && confirm && newPwd !== confirm && (
            <div style={{ fontSize: 11, color: 'var(--red)', fontFamily: 'DM Mono,monospace' }}>
              Passwords do not match
            </div>
          )}
          <button
            className="btn btn-accent btn-sm"
            style={{ width: 'fit-content' }}
            onClick={changePassword}
            disabled={changing || !oldPwd || !newPwd || !confirm}
          >
            {changing ? <><span className="spin" /> Updating…</> : <><Lock size={12} /> Change password</>}
          </button>
        </div>
      </div>

      {/* Account info */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Account info</span>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Firebase UID', value: auth.currentUser?.uid ?? '—' },
            { label: 'School ID',    value: teacher.schoolId ?? '—' },
            { label: 'Teacher ID',   value: teacher.id ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', gap: 12, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace', textTransform: 'uppercase', letterSpacing: .5, minWidth: 100 }}>
                {label}
              </span>
              <span style={{ fontSize: 11, fontFamily: 'DM Mono,monospace', color: 'var(--txt2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
