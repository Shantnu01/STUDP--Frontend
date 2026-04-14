import { useState, useMemo, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useMarks } from '@/hooks/useAcademic'
import { useStudents } from '@/hooks/useStudents'
import { Teacher } from '@/types'
import { gradeFromMarks, gradeColor, fmtDate, exportCSV, initials, todayISO } from '@/lib/utils'
import { Plus, Download, BookOpen, X, Pencil, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const EXAM_TYPES = ['Unit Test 1', 'Unit Test 2', 'Midterm', 'Final', 'Assignment', 'Project', 'Quiz'] as const
type ExamType = typeof EXAM_TYPES[number]

export default function Marks() {
  const { teacher } = useOutletContext<{ teacher: Teacher }>()
  const { marks, loading, addMark, bulkAddMarks, updateMark, deleteMark } = useMarks(teacher.schoolId, teacher.id)
  const { students } = useStudents(teacher.schoolId, teacher.classes || [])

  const [tab,        setTab]        = useState<'entry' | 'list' | 'report'>('entry')
  const [bulkCls,    setBulkCls]    = useState((teacher.classes || [])[0] ?? '')
  const [bulkSubj,   setBulkSubj]   = useState(teacher.subjects?.[0] ?? teacher.subject ?? '')
  const [bulkExam,   setBulkExam]   = useState<ExamType>('Unit Test 1')
  const [bulkMax,    setBulkMax]    = useState(100)
  const [bulkDate,   setBulkDate]   = useState(todayISO())
  const [bulkScores, setBulkScores] = useState<Record<string, string>>({})
  const [saving,     setSaving]     = useState(false)
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [editVal,    setEditVal]    = useState('')
  const [reportCls,  setReportCls]  = useState((teacher.classes || [])[0] ?? '')
  const [reportStu,  setReportStu]  = useState('')
  const firstInputRef = useRef<HTMLInputElement>(null)

  const subjects = useMemo(() =>
    (teacher.subjects?.length ? teacher.subjects : [teacher.subject]).filter(Boolean),
    [teacher.subjects, teacher.subject]
  )

  const classStudents = useMemo(() =>
    students
      .filter(s => s.classId === bulkCls && s.status === 'active')
      .sort((a, b) => a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true })),
    [students, bulkCls]
  )

  // ── BULK SAVE ──
  const handleBulkSave = async () => {
    const entries = classStudents
      .filter(s => bulkScores[s.id] !== undefined && bulkScores[s.id].trim() !== '')
      .map(s => {
        const raw = parseFloat(bulkScores[s.id]) || 0
        const capped = Math.min(raw, bulkMax)
        return {
          studentId: s.id, studentName: s.name,
          teacherId: teacher.id, schoolId: teacher.schoolId,
          subject: bulkSubj, examType: bulkExam,
          maxMarks: bulkMax, obtainedMarks: capped,
          grade: gradeFromMarks(capped, bulkMax),
          date: bulkDate, class: bulkCls,
        }
      })
    if (!entries.length) { toast.error('Enter at least one score'); return }
    setSaving(true)
    try {
      await bulkAddMarks(entries)
      setBulkScores({})
    } finally { setSaving(false) }
  }

  const fillAll = (val: number) => {
    const m: Record<string, string> = {}
    classStudents.forEach(s => { m[s.id] = String(val) })
    setBulkScores(m)
  }

  // ── INLINE EDIT ──
  const startEdit = (id: string, current: number) => {
    setEditingId(id)
    setEditVal(String(current))
  }

  const commitEdit = async (id: string, maxMarks: number) => {
    const val = parseFloat(editVal)
    if (isNaN(val) || val < 0) { toast.error('Invalid marks'); return }
    await updateMark(id, Math.min(val, maxMarks), maxMarks)
    setEditingId(null)
  }

  // ── REPORT CARD ──
  const reportStudents = useMemo(() =>
    students.filter(s => s.classId === reportCls && s.status === 'active'),
    [students, reportCls]
  )
  const selectedStudent = reportStudents.find(s => s.id === reportStu)
  const studentMarks = useMemo(() => marks.filter(m => m.studentId === reportStu), [marks, reportStu])

  const subjectSummary = useMemo(() => {
    const map: Record<string, typeof studentMarks> = {}
    studentMarks.forEach(m => { if (!map[m.subject]) map[m.subject] = []; map[m.subject].push(m) })
    return Object.entries(map).map(([subject, ms]) => {
      const total = ms.reduce((a, m) => a + m.obtainedMarks, 0)
      const maxT  = ms.reduce((a, m) => a + m.maxMarks, 0)
      return { subject, exams: ms, total, maxTotal: maxT, pct: maxT > 0 ? Math.round(total / maxT * 100) : 0, grade: gradeFromMarks(total, maxT) }
    })
  }, [studentMarks])

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Tabs */}
      <div className="tabs">
        {([['entry', 'Enter Marks'], ['list', 'All Marks'], ['report', 'Report Card']] as const).map(([t, label]) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {label}
          </button>
        ))}
      </div>

      {/* ── MARK ENTRY ── */}
      {tab === 'entry' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Config row */}
          <div className="card">
            <div className="card-header"><span className="card-title">Exam configuration</span></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
                <div className="field">
                  <label>Class</label>
                  <select value={bulkCls} onChange={e => { setBulkCls(e.target.value); setBulkScores({}) }}>
                    {(teacher.classes || []).map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Subject</label>
                  <select value={bulkSubj} onChange={e => setBulkSubj(e.target.value)}>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Exam type</label>
                  <select value={bulkExam} onChange={e => setBulkExam(e.target.value as ExamType)}>
                    {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Max marks</label>
                  <input type="number" value={bulkMax} min={1} max={1000}
                    onChange={e => setBulkMax(parseInt(e.target.value) || 100)} />
                </div>
                <div className="field">
                  <label>Date</label>
                  <input type="date" value={bulkDate} max={todayISO()}
                    onChange={e => setBulkDate(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Student marks table */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                Class {bulkCls} · {classStudents.length} students
              </span>
              <span className="card-sub" style={{ color: 'var(--txt2)' }}>
                {Object.values(bulkScores).filter(v => v.trim() !== '').length} entered
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => fillAll(bulkMax)}>
                Fill all {bulkMax}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setBulkScores({})}>
                Clear
              </button>
              <button
                className="btn btn-accent btn-sm"
                onClick={handleBulkSave}
                disabled={saving}
              >
                {saving ? <><span className="spin" /> Saving…</> : <><BookOpen size={12} /> Save marks</>}
              </button>
            </div>

            {classStudents.length === 0 ? (
              <div className="empty" style={{ padding: 32 }}>
                <p>No active students in Class {bulkCls}. Add students first.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '7%' }}>Roll</th>
                      <th style={{ width: '30%' }}>Student</th>
                      <th style={{ width: '20%' }}>Score (out of {bulkMax})</th>
                      <th style={{ width: '12%' }}>%</th>
                      <th style={{ width: '10%' }}>Grade</th>
                      <th style={{ width: '21%' }}>Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map(s => {
                      const raw = bulkScores[s.id] ?? ''
                      const num = parseFloat(raw) || 0
                      const capped = Math.min(num, bulkMax)
                      const pct = bulkMax > 0 && raw !== '' ? Math.round((capped / bulkMax) * 100) : 0
                      const grade = raw !== '' ? gradeFromMarks(capped, bulkMax) : '—'
                      const over = raw !== '' && num > bulkMax
                      return (
                        <tr key={s.id}>
                          <td style={{ fontFamily: 'DM Mono,monospace', fontSize: 11 }}>{s.rollNo}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="av" style={{ width: 22, height: 22, fontSize: 8, background: 'rgba(167,139,250,.15)', color: 'var(--accent)', flexShrink: 0 }}>
                                {initials(s.name)}
                              </div>
                              <span style={{ fontSize: 12 }}>{s.name}</span>
                            </div>
                          </td>
                          <td>
                            <input
                              ref={s.id === classStudents[0]?.id ? firstInputRef : undefined}
                              type="number" min={0} max={bulkMax}
                              placeholder="—" value={raw}
                              onChange={e => setBulkScores(prev => ({ ...prev, [s.id]: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  const idx = classStudents.findIndex(x => x.id === s.id)
                                  const next = classStudents[idx + 1]
                                  if (next) {
                                    const el = document.getElementById(`score-${next.id}`) as HTMLInputElement
                                    el?.focus()
                                  }
                                }
                              }}
                              id={`score-${s.id}`}
                              style={{
                                width: 80, background: 'var(--bg3)',
                                border: `1px solid ${over ? 'var(--red)' : 'var(--border)'}`,
                                borderRadius: 6, padding: '5px 8px', fontSize: 12,
                                color: over ? 'var(--red)' : 'var(--txt)',
                                outline: 'none', fontFamily: 'DM Mono,monospace',
                                transition: 'border-color .15s',
                              }}
                              onFocus={e => { if (!over) e.target.style.borderColor = 'var(--accent)' }}
                              onBlur={e => { e.target.style.borderColor = over ? 'var(--red)' : 'var(--border)' }}
                            />
                            {over && <div style={{ fontSize: 9, color: 'var(--red)', fontFamily: 'DM Mono,monospace', marginTop: 2 }}>max {bulkMax}</div>}
                          </td>
                          <td style={{ fontFamily: 'DM Mono,monospace', fontSize: 11, color: pct >= 75 ? 'var(--green)' : pct >= 35 ? 'var(--amber)' : pct > 0 ? 'var(--red)' : 'var(--txt3)' }}>
                            {raw !== '' ? `${pct}%` : '—'}
                          </td>
                          <td>
                            <span style={{ fontSize: 13, fontWeight: 700, color: raw !== '' ? gradeColor(grade) : 'var(--txt3)' }}>
                              {grade}
                            </span>
                          </td>
                          <td>
                            <div className="pbar" style={{ width: 80 }}>
                              <div className="pbf" style={{
                                width: `${Math.min(pct, 100)}%`,
                                background: pct >= 75 ? 'var(--green)' : pct >= 35 ? 'var(--amber)' : 'var(--red)',
                              }} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ALL MARKS LIST ── */}
      {tab === 'list' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Marks register</span>
            <span className="card-sub">{marks.length} entries</span>
            <button className="btn btn-ghost btn-sm" onClick={() =>
              exportCSV(marks.map(m => ({
                Student: m.studentName, Class: m.class, Subject: m.subject,
                Exam: m.examType, Obtained: m.obtainedMarks, Max: m.maxMarks,
                Grade: m.grade, Date: m.date,
              })), 'marks.csv')
            }>
              <Download size={12} /> Export
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Student</th>
                  <th style={{ width: '9%' }}>Class</th>
                  <th style={{ width: '14%' }}>Subject</th>
                  <th style={{ width: '14%' }}>Exam</th>
                  <th style={{ width: '15%' }}>Marks</th>
                  <th style={{ width: '8%' }}>Grade</th>
                  <th style={{ width: '11%' }}>Date</th>
                  <th style={{ width: '7%' }}></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace' }}>Loading…</td></tr>
                )}
                {!loading && marks.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace' }}>
                    No marks yet — use the Enter Marks tab
                  </td></tr>
                )}
                {marks.map(m => (
                  <tr key={m.id}>
                    <td>{m.studentName}</td>
                    <td><span className="badge badge-violet">Cls {m.class}</span></td>
                    <td>{m.subject}</td>
                    <td style={{ fontSize: 11, color: 'var(--txt2)' }}>{m.examType}</td>
                    <td>
                      {editingId === m.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="number" value={editVal} min={0} max={m.maxMarks}
                            onChange={e => setEditVal(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') commitEdit(m.id, m.maxMarks); if (e.key === 'Escape') setEditingId(null) }}
                            autoFocus
                            style={{ width: 60, background: 'var(--bg3)', border: '1px solid var(--accent)', borderRadius: 5, padding: '3px 6px', fontSize: 11, color: 'var(--txt)', outline: 'none', fontFamily: 'DM Mono,monospace' }}
                          />
                          <span style={{ fontSize: 11, color: 'var(--txt3)' }}>/{m.maxMarks}</span>
                          <button className="btn btn-green btn-xs" onClick={() => commitEdit(m.id, m.maxMarks)}><Check size={10} /></button>
                          <button className="btn btn-ghost btn-xs" onClick={() => setEditingId(null)}><X size={10} /></button>
                        </div>
                      ) : (
                        <span style={{ fontFamily: 'DM Mono,monospace', cursor: 'pointer' }}
                          onDoubleClick={() => startEdit(m.id, m.obtainedMarks)}
                          title="Double-click to edit">
                          {m.obtainedMarks}/{m.maxMarks}
                        </span>
                      )}
                    </td>
                    <td><span style={{ fontSize: 13, fontWeight: 700, color: gradeColor(m.grade) }}>{m.grade}</span></td>
                    <td style={{ fontFamily: 'DM Mono,monospace', fontSize: 11 }}>{fmtDate(m.date)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-blue btn-xs" onClick={() => startEdit(m.id, m.obtainedMarks)}><Pencil size={10} /></button>
                        <button className="btn btn-danger btn-xs" onClick={() => deleteMark(m.id)}><X size={10} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── REPORT CARD ── */}
      {tab === 'report' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div className="field" style={{ width: 180 }}>
              <label>Class</label>
              <select value={reportCls} onChange={e => { setReportCls(e.target.value); setReportStu('') }}>
                {(teacher.classes || []).map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            <div className="field" style={{ width: 260 }}>
              <label>Student</label>
              <select value={reportStu} onChange={e => setReportStu(e.target.value)}>
                <option value="">— Select student —</option>
                {reportStudents
                  .sort((a, b) => a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true }))
                  .map(s => <option key={s.id} value={s.id}>{s.rollNo}. {s.name}</option>)}
              </select>
            </div>
            {reportStu && (
              <button className="btn btn-ghost btn-sm" onClick={() =>
                exportCSV(subjectSummary.map(s => ({
                  Subject: s.subject, Total: `${s.total}/${s.maxTotal}`, Pct: `${s.pct}%`, Grade: s.grade,
                })), `report_${selectedStudent?.name ?? 'student'}.csv`)
              }>
                <Download size={12} /> Export
              </button>
            )}
          </div>

          {reportStu && selectedStudent ? (
            <>
              {/* Student header */}
              <div style={{
                background: 'linear-gradient(135deg,rgba(167,139,250,.08),rgba(96,165,250,.05))',
                border: '1px solid rgba(167,139,250,.2)', borderRadius: 14, padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div className="av av-round" style={{ width: 48, height: 48, fontSize: 18, background: 'var(--accent)', color: '#000', flexShrink: 0 }}>
                  {initials(selectedStudent.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedStudent.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--txt2)', marginTop: 3, fontFamily: 'DM Mono,monospace' }}>
                    Class {selectedStudent.classId}{selectedStudent.section} · Roll {selectedStudent.rollNo} · {selectedStudent.admissionNo}
                  </div>
                </div>
                {subjectSummary.length > 0 && (() => {
                  const tot = subjectSummary.reduce((a, s) => a + s.total, 0)
                  const max = subjectSummary.reduce((a, s) => a + s.maxTotal, 0)
                  const pct = max > 0 ? Math.round(tot / max * 100) : 0
                  const g   = gradeFromMarks(tot, max)
                  return (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 32, fontWeight: 700, color: gradeColor(g), letterSpacing: '-2px' }}>{g}</div>
                      <div style={{ fontSize: 12, color: 'var(--txt2)', fontFamily: 'DM Mono,monospace' }}>{tot}/{max} · {pct}%</div>
                    </div>
                  )
                })()}
              </div>

              {subjectSummary.length === 0 ? (
                <div className="empty"><p>No marks recorded for this student yet.</p></div>
              ) : (
                <div className="card">
                  <div className="card-header"><span className="card-title">Subject-wise performance</span></div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: '20%' }}>Subject</th>
                          <th style={{ width: '14%' }}>Total</th>
                          <th style={{ width: '10%' }}>%</th>
                          <th style={{ width: '10%' }}>Grade</th>
                          <th style={{ width: '46%' }}>Exam breakdown</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjectSummary.map(({ subject, exams, total, maxTotal, pct, grade }) => (
                          <tr key={subject}>
                            <td style={{ fontWeight: 500 }}>{subject}</td>
                            <td style={{ fontFamily: 'DM Mono,monospace' }}>{total}/{maxTotal}</td>
                            <td style={{ fontFamily: 'DM Mono,monospace', color: pct >= 75 ? 'var(--green)' : pct >= 35 ? 'var(--amber)' : 'var(--red)' }}>
                              {pct}%
                            </td>
                            <td><span style={{ fontSize: 14, fontWeight: 700, color: gradeColor(grade) }}>{grade}</span></td>
                            <td>
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {exams.map(e => (
                                  <div key={e.id} title={`${e.examType}: ${e.obtainedMarks}/${e.maxMarks} · ${e.grade}`}
                                    style={{
                                      fontSize: 10, background: 'var(--bg3)', border: `1px solid ${gradeColor(e.grade)}40`,
                                      borderRadius: 5, padding: '2px 7px', fontFamily: 'DM Mono,monospace', color: gradeColor(e.grade),
                                    }}>
                                    {e.examType.replace('Unit Test ', 'UT').replace(' Exam', '')}: {e.obtainedMarks}
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty">
              <BookOpen size={32} />
              <p>Select a student to view their report card</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
