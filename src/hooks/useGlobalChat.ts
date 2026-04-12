import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { Message } from '@/types'

// Replicating CONTACTS lightly just for ID mapping in global context
const CONTACT_IDS = ['admin', 'teacher1', 'teacher2', 'teacher3', 'staff1', 'staff2', 'staff3']

function makeThreadId(uidA: string, uidB: string) {
  return [uidA, uidB].sort().join('__')
}

export function useGlobalUnread() {
  const { user, profile } = useAuthStore()
  const myUid = user?.uid ?? ''
  const schoolId = profile?.schoolId // Used for talking with Admin HQ
  const { lastRead } = useChatStore()
  
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!myUid) return
    const unsubs = CONTACT_IDS.map(contactId => {
      let q
      if (contactId === 'admin' && schoolId) {
        q = query(collection(db, 'messages', schoolId, 'thread'), orderBy('ts', 'desc'), limit(50))
      } else {
        const threadId = makeThreadId(myUid, contactId)
        q = query(collection(db, 'conversations', threadId, 'messages'), orderBy('ts', 'desc'), limit(50))
      }
      
      return onSnapshot(q, (snap) => {
        if (snap.empty) {
          setUnreadCounts(prev => ({ ...prev, [contactId]: 0 }))
          return
        }
        
        let unread = 0
        for (const doc of snap.docs) {
          const d = doc.data()
          const tsMillis = d.ts?.toMillis() || 0
          const isMe = d.senderId === myUid || d.senderId === 'principal' || d.sender === 'principal'

          if (tsMillis <= (lastRead[contactId] || 0)) {
            break // ordered desc, so any further messages are older and already read
          }
          if (!isMe) {
            unread++
          }
        }

        setUnreadCounts(prev => ({ ...prev, [contactId]: unread }))
      })
    })
    return () => unsubs.forEach(u => u())
  }, [myUid, schoolId, lastRead])

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0)
  return { totalUnread, unreadCounts }
}
