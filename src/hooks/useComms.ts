import { useEffect, useState, useRef, useCallback } from 'react'
import {
  collection, onSnapshot, query, where, addDoc, updateDoc, setDoc,
  doc, serverTimestamp, orderBy, getDoc, deleteDoc
} from 'firebase/firestore'
import api from '@/lib/api'

import { db } from '@/lib/firebase'
import { LeaveRequest, Announcement, ChatMessage, ChatThread } from '@/types'
import { makeThreadId } from '@/lib/utils'
import toast from 'react-hot-toast'

// ── LEAVE ─────────────────────────────────────────────────────────────────────
export function useLeave(schoolId: string | undefined, userId: string | undefined) {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!schoolId || !userId) { setLeaves([]); setLoading(false); return }
    const q = query(
      collection(db, 'leaveRequests'),
      where('school_id', '==', schoolId),
      where('user_id', '==', userId),
      orderBy('applied_at', 'desc')
    )
    const unsub = onSnapshot(q,
      snap => { setLeaves(snap.docs.map(d => ({ id: d.id, ...d.data() } as LeaveRequest))); setLoading(false) },
      err => { console.error('leaves:', err); setLoading(false) }
    )
    return unsub
  }, [schoolId, userId])

  const applyLeave = useCallback(async (data: any) => {
    // We now use the backend API to apply leave for better validation and denormalization
    const res = await api.post('/api/leave/apply', {
      leave_type: data.type,
      start_date: data.from,
      end_date: data.to,
      reason: data.reason
    })
    toast.success('Leave application submitted')
    return res.data
  }, [])

  const cancelLeave = useCallback(async (id: string) => {
    // Instead of status = cancelled, we'll just delete the request if it's pending
    // This aligns with user's "10 days delete" intent - keep it clean.
    // However, if the API doesn't support DELETE yet, we'll just delete from Firestore directly
    // but the backend router for leave doesn't have a delete route.
    // I'll stick to Firestore delete for now for cancelling.
    try {
      await deleteDoc(doc(db, 'leaveRequests', id))
      toast.success('Leave request withdrawn')
    } catch (e) {
      toast.error('Failed to withdraw request')
    }
  }, [])

  return { leaves, loading, applyLeave, cancelLeave }
}

// Principal sees all leave requests for their school in real-time
export function usePrincipalLeaveRequests(schoolId: string | undefined) {
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!schoolId) { setRequests([]); setLoading(false); return }
    const q = query(
      collection(db, 'leaveRequests'),
      where('school_id', '==', schoolId),
      orderBy('applied_at', 'desc')
    )
    const unsub = onSnapshot(q,
      snap => {
        setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as LeaveRequest)))
        setLoading(false)
      },
      err => { console.error('principalLeaveRequests:', err); setLoading(false) }
    )
    return unsub
  }, [schoolId])

  return { requests, loading }
}

// ── ANNOUNCEMENTS ─────────────────────────────────────────────────────────────
export function useAnnouncements(schoolId: string | undefined) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!schoolId) { setAnnouncements([]); setLoading(false); return }
    const q = query(
      collection(db, 'announcements'),
      where('schoolId', '==', schoolId),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q,
      snap => { setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement))); setLoading(false) },
      err => { console.error('announcements:', err); setLoading(false) }
    )
    return unsub
  }, [schoolId])

  const postAnnouncement = useCallback(async (data: Omit<Announcement, 'id'>) => {
    await addDoc(collection(db, 'announcements'), { ...data, deleted: false, createdAt: serverTimestamp() })
    toast.success('Announcement posted')
  }, [])

  const deleteAnnouncement = useCallback(async (id: string) => {
    await updateDoc(doc(db, 'announcements', id), { deleted: true })
    toast.success('Announcement removed')
  }, [])

  return { announcements, loading, postAnnouncement, deleteAnnouncement }
}

// ── CHAT ──────────────────────────────────────────────────────────────────────
export function useChat(myUid: string | undefined, schoolId: string | undefined) {
  const [threads, setThreads] = useState<ChatThread[]>([])

  useEffect(() => {
    if (!myUid || !schoolId) return
    const q = query(
      collection(db, 'chatThreads'),
      where('schoolId', '==', schoolId),
      where('participantIds', 'array-contains', myUid),
      orderBy('lastTs', 'desc')
    )
    const unsub = onSnapshot(q,
      snap => setThreads(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatThread))),
      err => console.error('chatThreads:', err)
    )
    return unsub
  }, [myUid, schoolId])

  // Use setDoc with deterministic ID so we never create duplicates
  const getOrCreateThread = useCallback(async (
    otherUid: string, otherName: string, myName: string
  ): Promise<string> => {
    if (!myUid || !schoolId) return ''
    const threadId = makeThreadId(myUid, otherUid)
    const threadRef = doc(db, 'chatThreads', threadId)
    const snap = await getDoc(threadRef)
    if (!snap.exists()) {
      await setDoc(threadRef, {
        schoolId,
        participantIds: [myUid, otherUid],
        participantNames: [myName, otherName],
        lastMessage: '',
        lastTs: serverTimestamp(),
      })
    }
    return threadId
  }, [myUid, schoolId])

  return { threads, getOrCreateThread }
}

export function useChatMessages(threadId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null }
    if (!threadId) { setMessages([]); return }
    setLoading(true)
    const q = query(collection(db, 'chatThreads', threadId, 'messages'), orderBy('ts', 'asc'))
    unsubRef.current = onSnapshot(q,
      snap => { setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage))); setLoading(false) },
      err => { console.error('chatMessages:', err); setLoading(false) }
    )
    return () => { if (unsubRef.current) { unsubRef.current(); unsubRef.current = null } }
  }, [threadId])

  const send = useCallback(async (threadId: string, msg: Omit<ChatMessage, 'id'>) => {
    const msgRef = doc(collection(db, 'chatThreads', threadId, 'messages'))
    const threadRef = doc(db, 'chatThreads', threadId)
    await Promise.all([
      setDoc(msgRef, { ...msg, ts: serverTimestamp(), read: false }),
      updateDoc(threadRef, { lastMessage: msg.text, lastTs: serverTimestamp() }),
    ])
  }, [])

  return { messages, loading, send }
}

// All teachers in same school (for contact list + timetable)
export function useTeachersList(schoolId: string | undefined) {
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!schoolId) { setTeachers([]); setLoading(false); return }
    const q = query(
      collection(db, 'teachers'),
      where('schoolId', '==', schoolId),
      where('status', '==', 'active')
    )
    const unsub = onSnapshot(q,
      snap => { setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) },
      err => { console.error('teachersList:', err); setLoading(false) }
    )
    return unsub
  }, [schoolId])

  return { teachers, loading }
}
