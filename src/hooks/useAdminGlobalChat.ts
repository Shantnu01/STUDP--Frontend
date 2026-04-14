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
  
  // Store snapshot data locally per school so we avoid resubscribing when lastRead updates
  const [docsMap, setDocsMap] = useState<Record<string, any[]>>({})

  useEffect(() => {
    if (!myUid || schools.length === 0) return

    const unsubs = schools.map(school => {
      const q = query(
        collection(db, 'messages', school.id, 'thread'),
        orderBy('ts', 'desc'),
        limit(50)
      )
      
      return onSnapshot(q, (snap) => {
        const docsData = snap.docs.map(doc => doc.data())
        setDocsMap(prev => ({ ...prev, [school.id]: docsData }))
      })
    })

    return () => unsubs.forEach(u => u())
  }, [myUid, schools])

  // Process unread dynamically
  const unreadCounts: Record<string, number> = {}
  let totalUnread = 0

  for (const school of schools) {
    const docs = docsMap[school.id] || []
    let unread = 0
    const schoolLastRead = lastRead[school.id] || 0

    for (const d of docs) {
      const tsMillis = d.ts?.toMillis ? d.ts.toMillis() : 0
      const isMe = d.senderId === 'admin' || d.sender === 'admin' || d.senderId === myUid

      // If we reach a message that has a confirmed timestamp older or equal to our lastRead, stop.
      if (tsMillis > 0 && tsMillis <= schoolLastRead) {
        break
      }
      
      if (!isMe) unread++
    }
    
    unreadCounts[school.id] = unread
    totalUnread += unread
  }

  return { totalUnread, unreadCounts }
}

