import { useEffect, useState, useRef } from 'react'
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { Message } from '@/types'
import toast from 'react-hot-toast'

export function useMessages(schoolId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null }
    if (!schoolId) { setMessages([]); return }

    setLoading(true)
    const q = query(collection(db, 'messages', schoolId, 'thread'), orderBy('ts'))
    unsubRef.current = onSnapshot(q,
      (snap) => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)))
        setLoading(false)
      },
      (err) => {
        console.error('messages:', err)
        setLoading(false)
      }
    )
    return () => { if (unsubRef.current) unsubRef.current() }
  }, [schoolId])

  const sendMessage = async (text: string) => {
    if (!schoolId || !text.trim()) return
    try {
      await addDoc(collection(db, 'messages', schoolId, 'thread'), {
        text: text.trim(),
        sender: 'admin',
        senderEmail: auth.currentUser?.email || 'admin',
        ts: serverTimestamp()
      })
    } catch (e: any) {
      toast.error('Send failed: ' + e.message)
    }
  }

  return { messages, loading, sendMessage }
}
