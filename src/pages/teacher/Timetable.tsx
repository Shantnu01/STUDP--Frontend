import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  collection, query, where, onSnapshot,
  setDoc, deleteDoc, doc
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Teacher, Timetable } from '@/types'
import { subjectColor } from '@/lib/utils'
import { Plus, X, Printer } from 'lucide-react'
import toast from 'react-hot-toast'

const DAYS    = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8]
const START_TIMES = ['8:00 AM', '8:45 AM', '9:30 AM', '10:30 AM', '11:15 AM', '12:00 PM', '1:00 PM', '2:00 PM']
const END_TIMES   = ['8:45 AM', '9:30 AM', '10:15 AM', '11:15 AM', '12:00 PM', '12:45 PM', '1:45 PM', '2:45 PM']

// Deterministic slot ID so setDoc never creates duplicates
function slotId(schoolId: string, teacherId: string, cls: string, day: string, period: number) {
  return `${schoolId}_${teacherId}_${cls}_${day}_${period}`
}

export default function TimetablePage() {
  const { teacher } = useOutletContext<{ teacher: Teacher }>()
  const [slots,    setSlots]    = useState<Timetable[]>([])
  const [selCls,   setSelCls]   = useState((teacher.classes || [])[0] ?? '')
  const [editCell, setEditCell] = useState<{ day: string; period: number } | null>(null)
  const [editSubj, setEditSubj] = useState('')
  const [saving,   setSaving]   = useState(false)

  const subjects = (teacher.subjects?.length ? teacher.subjects : [teacher.subject]).filter(Boolean)

  useEffect(() => {
    if (!teacher.schoolId || !teacher.id) return
    const q = query(
      collection(db, 'timetable'),
      where('schoolId', '==', teacher.schoolId),
      where('teacherId', '==', teacher.id)
    )
    const unsub = onSnapshot(q,
      snap => setSlots(snap.docs.map(d => ({ id: d.id, ...d.data() } as Timetable))),
      err => console.error('timetable:', err)
    )
    return unsub
  }, [teacher.schoolId, teacher.id])

  const getSlot = useCallback((day: string, period: number, cls: string) =>
    slots.find(s => s.day === day && s.period === period && s.class === cls),
    [slots]
  )

  const openCell = (day: string, period: number) => {
    const existing = getSlot(day, period, selCls)
    setEditSubj(existing?.subject ?? subjects[0] ?? '')
    setEditCell({ day, period })
  }

  const saveSlot = async () => {
    if (!editCell || !editSubj.trim()) return
    setSaving(true)
    try {
      const id  = slotId(teacher.schoolId, teacher.id, selCls, editCell.day, editCell.period)
      const ref = doc(db, 'timetable', id)
      await setDoc(ref, {
        schoolId:    teacher.schoolId,
        teacherId:   teacher.id,
        teacherName: teacher.name,
        class:       selCls,
        day:         editCell.day,
        period:      editCell.period,
        subject:     editSubj,
        startTime:   START_TIMES[editCell.period - 1] ?? '',
        endTime:     END_TIMES[editCell.period - 1]   ?? '',
      })
      setEditCell(null)
      toast.success('Slot saved')
    } catch (e: any) {
      toast.error('Failed to save: ' + e.message)
    } finally { setSaving(false) }
  }

  const deleteSlot = async (day: string, period: number) => {
    const id  = slotId(teacher.schoolId, teacher.id, selCls, day, period)
    await deleteDoc(doc(db, 'timetable', id))
    toast.success('Slot removed')
  }

  // Count how many periods this teacher has today
  const todayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()]
  const todaySlots = slots.filter(s => s.day === todayName)

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="field" style={{ width: 170 }}>
          <label>View class</label>
          <select value={selCls} onChange={e => { setSelCls(e.target.value); setEditCell(null) }}>
            {(teacher.classes || []).map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }} />
        {todaySlots.length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--txt2)', fontFamily: 'DM Mono,monospace' }}>
            Today: {todaySlots.length} period{todaySlots.length > 1 ? 's' : ''}
          </div>
        )}
        <div style={{ fontSize: 11, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace' }}>
          Click any cell to edit
        </div>
      </div>

      {/* Grid */}
      <div className="card" style={{ overflow: 'auto' }}>
        <div className="card-header">
          <span className="card-title">Weekly timetable · Class {selCls}</span>
          <span className="card-sub">{slots.filter(s => s.class === selCls).length} slots filled</span>
        </div>
        <div style={{ padding: 16, minWidth: 620 }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '90px repeat(6, 1fr)', gap: 4, marginBottom: 4 }}>
            <div style={{ fontSize: 10, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Period
            </div>
            {DAYS.map(d => (
              <div key={d} style={{
                background: d === todayName ? 'rgba(167,139,250,.12)' : 'var(--bg3)',
                border: `1px solid ${d === todayName ? 'rgba(167,139,250,.3)' : 'var(--border)'}`,
                borderRadius: 7, padding: '7px 0', textAlign: 'center',
                fontSize: 11, fontWeight: 600, color: d === todayName ? 'var(--accent)' : 'var(--txt2)',
                fontFamily: 'DM Mono,monospace',
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Rows */}
          {PERIODS.map((p, i) => (
            <div key={p} style={{ display: 'grid', gridTemplateColumns: '90px repeat(6, 1fr)', gap: 4, marginBottom: 4 }}>
              {/* Period label */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 0' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace' }}>P{p}</div>
                <div style={{ fontSize: 9, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace' }}>{START_TIMES[i]}</div>
              </div>

              {DAYS.map(day => {
                const slot      = getSlot(day, p, selCls)
                const isEditing = editCell?.day === day && editCell?.period === p
                const color     = slot ? subjectColor(slot.subject) : undefined

                return (
                  <div
                    key={day}
                    onClick={() => { if (!isEditing) openCell(day, p) }}
                    style={{
                      minHeight: 56, borderRadius: 7, padding: 6, cursor: 'pointer',
                      background: slot ? `${color}12` : 'var(--bg3)',
                      border: `1px solid ${isEditing ? 'var(--accent)' : slot ? `${color}35` : 'var(--border)'}`,
                      transition: 'all .12s', position: 'relative',
                    }}
                    onMouseEnter={e => { if (!isEditing && !slot) (e.currentTarget.style.borderColor = 'var(--border2)') }}
                    onMouseLeave={e => { if (!isEditing && !slot) (e.currentTarget.style.borderColor = 'var(--border)') }}
                  >
                    {isEditing ? (
                      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <select
                          value={editSubj}
                          onChange={e => setEditSubj(e.target.value)}
                          autoFocus
                          style={{
                            fontSize: 10, background: 'var(--bg4)', border: '1px solid var(--accent)',
                            borderRadius: 5, padding: '3px 5px', color: 'var(--txt)', outline: 'none', width: '100%',
                          }}
                        >
                          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div style={{ display: 'flex', gap: 3 }}>
                          <button
                            className="btn btn-accent btn-xs"
                            style={{ flex: 1, justifyContent: 'center' }}
                            onClick={saveSlot}
                            disabled={saving}
                          >
                            {saving ? '…' : '✓'}
                          </button>
                          {slot && (
                            <button className="btn btn-danger btn-xs" onClick={() => deleteSlot(day, p)}>
                              <X size={9} />
                            </button>
                          )}
                          <button className="btn btn-ghost btn-xs" onClick={() => setEditCell(null)}>✕</button>
                        </div>
                      </div>
                    ) : slot ? (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color, lineHeight: 1.3 }}>{slot.subject}</div>
                        <div style={{ fontSize: 9, color: 'var(--txt3)', marginTop: 3, fontFamily: 'DM Mono,monospace' }}>
                          {slot.startTime}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: .18 }}>
                        <Plus size={14} color="var(--txt2)" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Today's schedule summary */}
      {todaySlots.filter(s => s.class === selCls).length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Today's schedule — Class {selCls}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 16px' }}>
            {todaySlots
              .filter(s => s.class === selCls)
              .sort((a, b) => a.period - b.period)
              .map(s => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                  background: `${subjectColor(s.subject)}12`,
                  border: `1px solid ${subjectColor(s.subject)}30`,
                  borderRadius: 8,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace' }}>P{s.period}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: subjectColor(s.subject) }}>{s.subject}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace' }}>{s.startTime}</div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}
