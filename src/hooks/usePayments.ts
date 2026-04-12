import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Payment } from '@/types'
import toast from 'react-hot-toast'

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q,
      (snap) => {
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)))
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [])

  const addPayment = async (data: Omit<Payment, 'id'>) => {
    await addDoc(collection(db, 'payments'), { ...data, createdAt: serverTimestamp() })
    toast.success('Invoice created')
  }

  const markPaid = async (id: string) => {
    await updateDoc(doc(db, 'payments', id), { status: 'paid' })
    toast.success('Marked as paid')
  }

  return { payments, loading, addPayment, markPaid }
}
