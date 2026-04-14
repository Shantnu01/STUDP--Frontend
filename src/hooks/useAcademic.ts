import { useEffect, useState, useCallback } from 'react'
import {
  collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, orderBy, getDocs, writeBatch
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Mark, Attendance, Assignment } from '@/types'
import { gradeFromMarks } from '@/lib/utils'
import toast from 'react-hot-toast'

// ── MARKS ─────────────────────────────────────────────────────────────────────
export function useMarks(schoolId: string | undefined, teacherId: string | undefined) {
  const [marks, setMarks] = useState<Mark[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!schoolId || !teacherId) { setMarks([]); setLoading(false); return }
    const q = query(
      collection(db, 'marks'),
      where('schoolId', '==', schoolId),
      where('teacherId', '==', teacherId),
      orderBy('date', 'desc')
    )
    const unsub = onSnapshot(
      q,
      snap => { setMarks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Mark))); setLoading(false) },
      err => { console.error('marks listener:', err); setLoading(false) }
    )
    return unsub
  }, [schoolId, teacherId])

  const addMark = useCallback(async (data: Omit<Mark, 'id' | 'grade'>) => {
    const grade = gradeFromMarks(data.obtainedMarks, data.maxMarks)
    await addDoc(collection(db, 'marks'), { ...data, grade, createdAt: serverTimestamp() })
    toast.success('Mark saved')
  }, [])

  const bulkAddMarks = useCallback(async (entries: Omit<Mark, 'id' | 'grade'>[]) => {
    if (!entries.length) return
    // Use batched writes (max 500 per batch)
    const chunks: typeof entries[] = []
    for (let i = 0; i < entries.length; i += 490) chunks.push(entries.slice(i, i + 490))
    for (const chunk of chunks) {
      const batch = writeBatch(db)
      chunk.forEach(e => {
        const ref = doc(collection(db, 'marks'))
        batch.set(ref, { ...e, grade: gradeFromMarks(e.obtainedMarks, e.maxMarks), createdAt: serverTimestamp() })
      })
      await batch.commit()
    }
    toast.success(`${entries.length} marks saved`)
  }, [])

  const updateMark = useCallback(async (id: string, obtained: number, max: number, remarks?: string) => {
    await updateDoc(doc(db, 'marks', id), {
      obtainedMarks: obtained,
      maxMarks: max,
      grade: gradeFromMarks(obtained, max),
      ...(remarks !== undefined ? { remarks } : {}),
    })
    toast.success('Mark updated')
  }, [])

  const deleteMark = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'marks', id))
    toast.success('Mark deleted')
  }, [])

  return { marks, loading, addMark, bulkAddMarks, updateMark, deleteMark }
}

// ── ATTENDANCE ────────────────────────────────────────────────────────────────
export function useAttendance(schoolId: string | undefined, teacherId: string | undefined) {
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!schoolId || !teacherId) { setAttendance([]); setLoading(false); return }
    const q = query(
      collection(db, 'attendance'),
      where('schoolId', '==', schoolId),
      where('teacherId', '==', teacherId),
      orderBy('date', 'desc')
    )
    const unsub = onSnapshot(
      q,
      snap => { setAttendance(snap.docs.map(d => ({ id: d.id, ...d.data() } as Attendance))); setLoading(false) },
      err => { console.error('attendance listener:', err); setLoading(false) }
    )
    return unsub
  }, [schoolId, teacherId])

  const submitAttendance = useCallback(async (records: Omit<Attendance, 'id'>[]) => {
    if (!records.length) return
    const { date, class: cls, teacherId: tid, schoolId: sid } = records[0]
    // Delete existing records for this date+class+teacher first
    const existing = await getDocs(query(
      collection(db, 'attendance'),
      where('date', '==', date),
      where('class', '==', cls),
      where('teacherId', '==', tid),
      where('schoolId', '==', sid)
    ))
    const deleteBatch = writeBatch(db)
    existing.docs.forEach(d => deleteBatch.delete(d.ref))
    await deleteBatch.commit()
    // Insert new records
    const insertBatch = writeBatch(db)
    records.forEach(r => {
      const ref = doc(collection(db, 'attendance'))
      insertBatch.set(ref, r)
    })
    await insertBatch.commit()
    toast.success('Attendance saved')
  }, [])

  return { attendance, loading, submitAttendance }
}

// ── ASSIGNMENTS ───────────────────────────────────────────────────────────────
export function useAssignments(schoolId: string | undefined, teacherId: string | undefined) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!schoolId || !teacherId) { setAssignments([]); setLoading(false); return }
    const q = query(
      collection(db, 'assignments'),
      where('schoolId', '==', schoolId),
      where('teacherId', '==', teacherId),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(
      q,
      snap => { setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Assignment))); setLoading(false) },
      err => { console.error('assignments listener:', err); setLoading(false) }
    )
    return unsub
  }, [schoolId, teacherId])

  const addAssignment = useCallback(async (data: Omit<Assignment, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'assignments'), { ...data, createdAt: serverTimestamp() })
    toast.success('Assignment created')
  }, [])

  const updateAssignment = useCallback(async (id: string, data: Partial<Omit<Assignment, 'id'>>) => {
    await updateDoc(doc(db, 'assignments', id), data)
    toast.success('Assignment updated')
  }, [])

  const deleteAssignment = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'assignments', id))
    toast.success('Assignment deleted')
  }, [])

  return { assignments, loading, addAssignment, updateAssignment, deleteAssignment }
}
