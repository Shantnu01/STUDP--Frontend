import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import api from '@/lib/api'
import { Registration } from '@/types'
import toast from 'react-hot-toast'

export function useRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'registrations'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q,
      (snap) => {
        setRegistrations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Registration))  )
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [])

  const approve = async (reg: Registration) => {
    try {
      await api.patch(`/api/registrations/${reg.id}/approve`)
      toast.success(`${reg.schoolName} approved`)
    } catch (e: any) {
      toast.error(`Error approving: ${e.message}`)
    }
  }

  const reject = async (id: string) => {
    try {
      await api.patch(`/api/registrations/${id}/reject`)
      toast.success('Registration rejected')
    } catch (e: any) {
      toast.error(`Error rejecting: ${e.message}`)
    }
  }

  return { registrations, loading, approve, reject }
}
