import { useEffect, useState, useCallback } from 'react'
import {
  collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, orderBy
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Student } from '@/types'
import toast from 'react-hot-toast'

// Helper to extract strict backend format "Grade X" & "Section" from a loose string like "10-A"
function parseTeacherClasses(classes: string[]) {
  return classes.map(c => {
    const match = c.match(/\d+/)
    const gradeNum = match ? match[0] : null
    
    let section = null
    if (c.includes('-')) {
      section = c.split('-')[1]?.trim().toUpperCase()
    } else {
      const secMatch = c.match(/\s([A-F])$/i) || c.match(/^([A-F])$/i)
      if (secMatch) section = secMatch[1].toUpperCase()
    }

    const classId = gradeNum ? `Grade ${gradeNum}` : c
    return { classId, section }
  })
}

export function useStudents(schoolId: string | undefined, classes: string[]) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!schoolId) { setStudents([]); setLoading(false); return }

    const matchers = parseTeacherClasses(classes || [])

    const q = query(
      collection(db, 'students'),
      where('schoolId', '==', schoolId)
    )
    
    const unsub = onSnapshot(
      q,
      snap => { 
        const raw = snap.docs.map(d => ({ id: d.id, ...d.data() } as Student))
        // Strictly filter to what the teacher is assigned to
        const filtered = raw.filter(s => {
          if (!classes || classes.length === 0) return false
          return matchers.some(m => {
            if (s.classId !== m.classId) return false
            if (m.section && s.section) return s.section.toUpperCase() === m.section
            return true
          })
        })
        setStudents(filtered.sort((a,b) => (a.classId || '').localeCompare(b.classId || '') || parseInt(a.rollNo) - parseInt(b.rollNo)))
        setLoading(false) 
      },
      err => { console.error('students listener:', err); setLoading(false) }
    )
    return unsub
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, classes.join(',')])

  const addStudent = useCallback(async (data: Omit<Student, 'id'>) => {
    await addDoc(collection(db, 'students'), { ...data, createdAt: serverTimestamp() })
    toast.success('Student added')
  }, [])

  const updateStudent = useCallback(async (id: string, data: Partial<Omit<Student, 'id'>>) => {
    await updateDoc(doc(db, 'students', id), { ...data, updatedAt: serverTimestamp() })
    toast.success('Student updated')
  }, [])

  const removeStudent = useCallback(async (id: string) => {
    await updateDoc(doc(db, 'students', id), { status: 'inactive', updatedAt: serverTimestamp() })
    toast.success('Student removed')
  }, [])

  return { students, loading, addStudent, updateStudent, removeStudent }
}
