import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStudents } from '@/hooks/useStudents'
import { useAttendance } from '@/hooks/useAcademic'
import { useMarks } from '@/hooks/useAcademic'
import { Teacher, Student } from '@/types'
import { initials, fmtDate, statusBadgeClass, exportCSV, todayISO } from '@/lib/utils'
import { Search, Plus, X, Pencil, Download, Phone, Mail, User, BarChart2, ClipboardCheck } from 'lucide-react'

const BLOOD = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

function emptyForm(schoolId: string, teacherId: string, firstClass: string): Omit<Student, 'id'> {
  return {
    schoolId, teacherId,
    name: '', rollNo: '', classId: firstClass, section: 'A',
    dob: '', gender: 'male',
    parentName: '', parentPhone: '', parentEmail: '',
    address: '', bloodGroup: '', admissionNo: '',
    status: 'active',
  }
}

export default function Students() {
  const { teacher } = useOutletContext<{ teacher: Teacher }>()
  const { students, loading, addStudent, updateStudent, removeStudent } = useStudents(teacher?.schoolId, teacher?.classes || [])
  const { attendance } = useAttendance(teacher.schoolId, teacher.id)
  const { marks } = useMarks(teacher.schoolId, teacher.id)

  const [search,   setSearch]   = useState('')
  const [clsFilter, setClsFilter] = useState('')
  const [drawer,   setDrawer]   = useState<Student | null>(null)
  const [mode,     setMode]     = useState<'view' | 'add' | 'edit'>('view')
  const [form,     setForm]     = useState<Omit<Student, 'id'>>(emptyForm(teacher?.schoolId || '', teacher?.id || '', (teacher?.classes || [])[0] ?? ''))
  const [saving,   setSaving]   = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return students.filter(s => {
      const matchQ = !q || s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q) || (s.admissionNo ?? '').toLowerCase().includes(q)
      const matchC = !clsFilter || s.classId === clsFilter
      return matchQ && matchC
    })
  }, [students, search, clsFilter])

  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }))

  const openAdd = () => {
    setForm(emptyForm(teacher?.schoolId || '', teacher?.id || '', (teacher?.classes || [])[0] ?? ''))
    setMode('add')
    setDrawer(null)
  }

  const openEdit = (s: Student) => {
    const { id, ...rest } = s
    setForm(rest)
    setMode('edit')
    setDrawer(s)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.classId) { return }
    setSaving(true)
    try {
      if (mode === 'edit' && drawer) {
        await updateStudent(drawer.id, form)
      } else {
        await addStudent(form)
      }
      setMode('view')
      if (mode !== 'edit') setDrawer(null)
    } finally { setSaving(false) }
  }

  const handleRemove = async (s: Student) => {
    if (!confirm(`Remove ${s.name} from class? Their data will be preserved.`)) return
    await removeStudent(s.id)
    setDrawer(null)
    setMode('view')
  }

  // Per-student stats
  const getStudentStats = (studentId: string) => {
    const attRecs = attendance.filter(a => a.studentId === studentId)
    const total   = attRecs.length
    const present = attRecs.filter(a => a.status === 'present').length
    const attPct  = total > 0 ? Math.round((present / total) * 100) : null

    const markRecs = marks.filter(m => m.studentId === studentId)
    const avgPct   = markRecs.length > 0
      ? Math.round(markRecs.reduce((a, m) => a + (m.obtainedMarks / m.maxMarks * 100), 0) / markRecs.length)
      : null

    return { attPct, markCount: markRecs.length, attTotal: total }
  }

  const FormPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="grid2">
        <div className="field"><label>Full name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Aarav Kumar" autoFocus />
        </div>
        <div className="field"><label>Roll number</label>
          <input value={form.rollNo} onChange={e => set('rollNo', e.target.value)} placeholder="01" />
        </div>
      </div>
      <div className="grid2">
        <div className="field"><label>Class *</label>
          <select value={form.classId} onChange={e => set('classId', e.target.value)}>
            <option value="">— Select —</option>
            {(teacher?.classes || []).map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </div>
        <div className="field"><label>Section</label>
          <input value={form.section} onChange={e => set('section', e.target.value.toUpperCase())} placeholder="A" maxLength={2} />
        </div>
      </div>
      <div className="grid2">
        <div className="field"><label>Admission no</label>
          <input value={form.admissionNo} onChange={e => set('admissionNo', e.target.value)} placeholder="2024001" />
        </div>
        <div className="field"><label>Date of birth</label>
          <input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
        </div>
      </div>
      <div className="grid2">
        <div className="field"><label>Gender</label>
          <select value={form.gender} onChange={e => set('gender', e.target.value as any)}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="field"><label>Blood group</label>
          <select value={form.bloodGroup ?? ''} onChange={e => set('bloodGroup', e.target.value)}>
            <option value="">—</option>
            {BLOOD.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>
      <div className="field"><label>Parent / Guardian name</label>
        <input value={form.parentName} onChange={e => set('parentName', e.target.value)} placeholder="Mr. Ramesh Kumar" />
      </div>
      <div className="grid2">
        <div className="field"><label>Parent phone</label>
          <input value={form.parentPhone} onChange={e => set('parentPhone', e.target.value)} placeholder="+91 98765 43210" />
        </div>
        <div className="field"><label>Parent email</label>
          <input type="email" value={form.parentEmail} onChange={e => set('parentEmail', e.target.value)} placeholder="parent@email.com" />
        </div>
      </div>
      <div className="field"><label>Address</label>
        <textarea value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main Street, Chennai - 600001" />
      </div>
      <div className="field"><label>Status</label>
        <select value={form.status} onChange={e => set('status', e.target.value as any)}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="transferred">Transferred</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => { setMode('view'); if (mode !== 'edit') setDrawer(null) }}>
          Cancel
        </button>
        <button className="btn btn-accent btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? <><span className="spin" /> Saving…</> : mode === 'edit' ? 'Update student' : 'Add student'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 340 }}>
          <Search size={14} />
          <input className="search-input" placeholder="Search name, roll no, admission…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          value={clsFilter} onChange={e => setClsFilter(e.target.value)}
          style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 7, padding: '7px 10px', fontSize: 12, color: 'var(--txt)', outline: 'none' }}
        >
          <option value="">All classes</option>
          {(teacher?.classes || []).map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <span style={{ fontSize: 11, color: 'var(--txt2)', fontFamily: 'DM Mono,monospace' }}>
          {filtered.length} of {students.length}
        </span>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" onClick={() =>
          exportCSV(filtered.map(s => ({
            Name: s.name, Roll: s.rollNo, Class: s.classId + ' ' + s.section,
            Admission: s.admissionNo, Parent: s.parentName, Phone: s.parentPhone,
          })), 'students.csv')
        }>
          <Download size={12} /> Export
        </button>
        <button className="btn btn-accent btn-sm" onClick={openAdd}>
          <Plus size={12} /> Add student
        </button>
      </div>

      {/* Add form */}
      {mode === 'add' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Add new student</span>
            <button onClick={() => setMode('view')} style={{ background: 'none', border: 'none', color: 'var(--txt2)', cursor: 'pointer' }}><X size={16} /></button>
          </div>
          <div className="card-body"><FormPanel /></div>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '28%' }}>Student</th>
                <th style={{ width: '7%' }}>Roll</th>
                <th style={{ width: '10%' }}>Class</th>
                <th style={{ width: '16%' }}>Parent</th>
                <th style={{ width: '14%' }}>Phone</th>
                <th style={{ width: '9%' }}>Attendance</th>
                <th style={{ width: '16%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 28, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace' }}>Loading…</td></tr>}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 28, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace' }}>
                  {students.length === 0 ? 'No students yet — click Add student above' : 'No students match your filter'}
                </td></tr>
              )}
              {filtered.map(s => {
                const stats = getStudentStats(s.id)
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div className="av" style={{ width: 26, height: 26, fontSize: 9, flexShrink: 0, background: 'rgba(167,139,250,.15)', color: 'var(--accent)' }}>
                          {initials(s.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 12 }}>{s.name}</div>
                          {s.admissionNo && <div style={{ fontSize: 10, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace' }}>{s.admissionNo}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'DM Mono,monospace' }}>{s.rollNo}</td>
                    <td><span className="badge badge-violet">{s.classId}{s.section}</span></td>
                    <td style={{ fontSize: 11 }}>{s.parentName}</td>
                    <td style={{ fontFamily: 'DM Mono,monospace', fontSize: 11 }}>{s.parentPhone}</td>
                    <td>
                      {stats.attPct !== null ? (
                        <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 11, color: stats.attPct >= 75 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                          {stats.attPct}%
                        </span>
                      ) : (
                        <span style={{ color: 'var(--txt3)', fontSize: 11 }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-ghost btn-xs" onClick={() => { setDrawer(s); setMode('view') }}>
                          <User size={10} /> Profile
                        </button>
                        <button className="btn btn-blue btn-xs" onClick={() => openEdit(s)}>
                          <Pencil size={10} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile drawer */}
      {drawer && mode === 'view' && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}
          onClick={e => { if (e.target === e.currentTarget) setDrawer(null) }}
        >
          <div style={{ width: 380, height: '100%', background: 'var(--bg2)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slideIn .2s ease' }}>
            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="av av-round" style={{ width: 44, height: 44, fontSize: 16, background: 'rgba(167,139,250,.2)', color: 'var(--accent)' }}>
                {initials(drawer.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{drawer.name}</div>
                <div style={{ fontSize: 11, color: 'var(--txt2)', fontFamily: 'DM Mono,monospace', marginTop: 2 }}>
                  {drawer.classId}{drawer.section} · Roll {drawer.rollNo}
                </div>
              </div>
              <button onClick={() => setDrawer(null)} style={{ background: 'none', border: 'none', color: 'var(--txt2)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Badges */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className={`badge ${statusBadgeClass(drawer.status)}`}>{drawer.status}</span>
                {drawer.bloodGroup && <span className="badge badge-red">{drawer.bloodGroup}</span>}
                <span className="badge badge-gray">{drawer.gender}</span>
              </div>

              {/* Quick stats */}
              {(() => {
                const stats = getStudentStats(drawer.id)
                return (
                  <div className="grid2">
                    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>
                        <ClipboardCheck size={10} style={{ display: 'inline', marginRight: 4 }} />Attendance
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: stats.attPct !== null ? (stats.attPct >= 75 ? 'var(--green)' : 'var(--red)') : 'var(--txt3)' }}>
                        {stats.attPct !== null ? `${stats.attPct}%` : '—'}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{stats.attTotal} days recorded</div>
                    </div>
                    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>
                        <BarChart2 size={10} style={{ display: 'inline', marginRight: 4 }} />Marks entries
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{stats.markCount}</div>
                      <div style={{ fontSize: 10, color: 'var(--txt3)' }}>assessments</div>
                    </div>
                  </div>
                )
              })()}

              {/* Info fields */}
              {[
                { label: 'Admission no', value: drawer.admissionNo },
                { label: 'Date of birth', value: fmtDate(drawer.dob) },
                { label: 'Address', value: drawer.address },
              ].filter(i => i.value && i.value !== '—').map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)', padding: '10px 14px' }}>
                  <div style={{ fontSize: 9, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 12 }}>{value}</div>
                </div>
              ))}

              {/* Parent info */}
              <div style={{ background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)', padding: '12px 14px' }}>
                <div style={{ fontSize: 9, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10 }}>Parent / Guardian</div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{drawer.parentName || '—'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={12} color="var(--txt3)" />
                    <span style={{ fontSize: 12, fontFamily: 'DM Mono,monospace' }}>{drawer.parentPhone || '—'}</span>
                  </div>
                  {drawer.parentEmail && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Mail size={12} color="var(--txt3)" />
                      <span style={{ fontSize: 12 }}>{drawer.parentEmail}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <button className="btn btn-accent btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => openEdit(drawer)}>
                <Pencil size={12} /> Edit
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => handleRemove(drawer)}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit drawer */}
      {drawer && mode === 'edit' && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}
          onClick={e => { if (e.target === e.currentTarget) { setMode('view') } }}
        >
          <div style={{ width: 420, height: '100%', background: 'var(--bg2)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>Edit — {drawer.name}</div>
              <button onClick={() => setMode('view')} style={{ background: 'none', border: 'none', color: 'var(--txt2)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}><FormPanel /></div>
          </div>
        </div>
      )}
    </div>
  )
}
