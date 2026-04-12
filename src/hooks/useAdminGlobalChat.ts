import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useChatStore } from '@/store/chatStore'
import { School } from '@/types'

export function useAdminGlobalChat(schools: School[]) {
  const { user } = useAuth()
  const myUid = user?.uid ?? ''
  const { lastRead } = useChatStore()
  
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!myUid || schools.length === 0) return

    const unsubs = schools.map(school => {
      const q = query(
        collection(db, 'messages', school.id, 'thread'),
        orderBy('ts', 'desc'),
        limit(50)
      )
      
      return onSnapshot(q, (snap) => {
        if (snap.empty) {
          setUnreadCounts(prev => ({ ...prev, [school.id]: 0 }))
          return
        }
        
        let unread = 0
        for (const doc of snap.docs) {
          const d = doc.data()
          const tsMillis = d.ts?.toMillis() || 0
          
          const isMe = d.senderId === 'admin' || d.sender === 'admin' || d.senderId === myUid

          if (tsMillis <= (lastRead[school.id] || 0)) {
            break
          }
          if (!isMe) {
            unread++
          }
        }

        setUnreadCounts(prev => ({ ...prev, [school.id]: unread }))
      })
    })

    return () => unsubs.forEach(u => u())
  }, [myUid, schools, lastRead])

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0)
  return { totalUnread, unreadCounts }
}
