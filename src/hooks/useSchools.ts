import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { School } from '@/types'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export function useSchools() {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)

  // Real-time listener for reading
  useEffect(() => {
    const q = query(collection(db, 'schools'), orderBy('name'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setSchools(snap.docs.map(d => ({ id: d.id, ...d.data() } as School)))
        setLoading(false)
      },
      (err) => {
        console.error('schools listener error:', err)
        // Fallback: fetch via API if real-time listener fails (e.g. rules block read)
        api.get('/api/schools')
          .then(res => {
            const data = res.data?.schools || res.data || []
            setSchools(data)
          })
          .catch(console.error)
          .finally(() => setLoading(false))
      }
    )
    return unsub
  }, [])

  const addSchool = async (data: Omit<School, 'id'>) => {
    await api.post('/api/schools', data)
    toast.success('School added successfully')
  }

  const updateSchool = async (id: string, data: Partial<School>) => {
    await api.patch(`/api/schools/${id}`, data)
    toast.success('School updated')
  }

  /**
   * deleteSchool — calls DELETE /api/schools/:id.
   * Optimistically removes from local state immediately for snappy UX.
   * Throws on failure so SchoolModal can catch and show the error.
   */
  const deleteSchool = async (id: string) => {
    await api.delete(`/api/schools/${id}`)
    // Remove from state immediately (onSnapshot will also update, but this is faster)
    setSchools(prev => prev.filter(s => s.id !== id))
  }

  return { schools, loading, addSchool, updateSchool, deleteSchool }
}
