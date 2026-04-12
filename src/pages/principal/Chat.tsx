import { useState, useRef, useEffect, useCallback } from 'react'
import {
  collection, addDoc, onSnapshot, query,
  orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'
import {
  Send, Search, ChevronLeft, Users, MessageCircle, AtSign, Paperclip, Smile, Loader2,
} from 'lucide-react'

/* ── Types ─────────────────────────────────────────── */
interface Contact {
  id: string          // Used as threadPartnerId
  name: string
  role: string
  avatar: string
  color: string
  textColor: string
  online: boolean
  lastSeen?: string
}

interface Message {
  id: string
  text: string
  senderId: string    // Firebase UID of sender
  senderName: string
  ts: Timestamp | null
  timeLabel: string
}

/* ── Static contact list ────────────────────────────── */
// NOTE: In a real multi-school deployment these would come from Firestore /users.
// For now they are fixed — the Admin HQ entry maps to the admin Firebase user.
const CONTACTS: Contact[] = [
  { id: 'admin',    name: 'Admin HQ',        role: 'System Administrator',  avatar: 'A',  color: '#6ee7b7', textColor: '#000', online: true },
  { id: 'teacher1', name: 'Dr. Anita Rao',   role: 'Mathematics Teacher',   avatar: 'AR', color: '#818cf8', textColor: '#fff', online: true },
  { id: 'teacher2', name: 'Ms. Deepa Nair',  role: 'English Teacher',       avatar: 'DN', color: '#fb923c', textColor: '#fff', online: false, lastSeen: '2h ago' },
  { id: 'teacher3', name: 'Mr. Suresh Kumar',role: 'Physics Teacher',       avatar: 'SK', color: '#f472b6', textColor: '#fff', online: true },
  { id: 'staff1',   name: 'Ramesh Pillai',   role: 'Office Administrator',  avatar: 'RP', color: '#34d399', textColor: '#000', online: true },
  { id: 'staff2',   name: 'Kavitha Sharma',  role: 'Librarian',             avatar: 'KS', color: '#fbbf24', textColor: '#000', online: false, lastSeen: '30m ago' },
  { id: 'staff3',   name: 'Mr. Arun Menon',  role: 'PE Teacher',            avatar: 'AM', color: '#60a5fa', textColor: '#fff', online: false, lastSeen: 'Yesterday' },
]

const GROUP_MAP: Record<string, string[]> = {
  Admin:    ['System Administrator'],
  Teachers: ['Mathematics Teacher', 'English Teacher', 'Physics Teacher', 'PE Teacher'],
  Staff:    ['Office Administrator', 'Librarian'],
}

/* ── Helpers ────────────────────────────────────────── */
function makeThreadId(uidA: string, uidB: string) {
  // Deterministic — same two users always get the same thread, regardless of who opens first
  return [uidA, uidB].sort().join('__')
}

function fmtTime(ts: Timestamp | null): string {
  if (!ts) return ''
  const d = ts.toDate()
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7)  return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { day: '2-digit', month: 'short' })
}

import { useChatStore } from '@/store/chatStore'
import { useGlobalUnread } from '@/hooks/useGlobalChat'

/* ── Message Bubble ─────────────────────────────────── */
function Bubble({ msg, myUid }: { msg: Message; myUid: string }) {
  const isMe = msg.senderId === myUid || msg.senderId === 'principal'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
      <div style={{
        maxWidth: '72%', padding: '10px 14px', fontSize: 13, lineHeight: 1.55,
        borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
        background: isMe ? 'var(--accent)' : 'var(--bg3)',
        color: isMe ? '#000' : 'var(--txt)',
        fontWeight: isMe ? 500 : 400,
        border: isMe ? 'none' : '1px solid var(--border)',
        wordBreak: 'break-word', whiteSpace: 'pre-wrap',
      }}>
        {msg.text}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 10, color: 'var(--txt3)', fontFamily: 'DM Mono, monospace' }}>
        {msg.timeLabel}
        {isMe && <span style={{ color: 'var(--accent)' }}>✓✓</span>}
      </div>
    </div>
  )
}

/* ── Main Chat Page ─────────────────────────────────── */
export default function PrincipalMessages() {
  const { user, profile } = useAuthStore()
  const myUid    = user?.uid ?? ''
  const myName   = profile?.displayName || user?.displayName || 'Me'
  const schoolId = profile?.schoolId // Used for talking with Admin HQ

  const { setLastRead } = useChatStore()
  const { unreadCounts } = useGlobalUnread()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages,   setMessages]   = useState<Message[]>([])
  const [lastMsgs,   setLastMsgs]   = useState<Record<string, Message | null>>({})
  const [draft,      setDraft]      = useState('')
  const [search,     setSearch]     = useState('')
  const [sending,    setSending]    = useState(false)
  const [loadingMsgs,setLoadingMsgs]= useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  // ── Scroll to bottom when messages change ────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Real-time listener for the open thread ───────────
  useEffect(() => {
    if (!selectedId || !myUid) return
    setLoadingMsgs(true)
    setMessages([])

    let q
    if (selectedId === 'admin' && schoolId) {
      q = query(collection(db, 'messages', schoolId, 'thread'), orderBy('ts', 'asc'))
    } else {
      const threadId = makeThreadId(myUid, selectedId)
      q = query(collection(db, 'conversations', threadId, 'messages'), orderBy('ts', 'asc'))
    }

    const unsub = onSnapshot(q, (snap) => {
      const msgs: Message[] = snap.docs.map(d => {
        const data = d.data()
        return {
          id:         d.id,
          text:       data.text,
          senderId:   data.sender || data.senderId, // Admin uses 'admin'/'principal'
          senderName: data.senderName || data.senderEmail,
          ts:         data.ts ?? null,
          timeLabel:  fmtTime(data.ts ?? null),
        }
      })
      setMessages(msgs)
      setLoadingMsgs(false)
    }, (err) => {
      console.error('[Chat] Listen error:', err)
      setLoadingMsgs(false)
    })
    return unsub
  }, [selectedId, myUid, schoolId])

  // ── Update read timestamp for active thread ───────────
  useEffect(() => {
    if (selectedId && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.ts) {
        setLastRead(selectedId, lastMsg.ts.toMillis())
      }
    }
  }, [selectedId, messages, setLastRead])

  // ── Load last message for each contact (for sidebar preview) ─
  useEffect(() => {
    if (!myUid) return
    const unsubs = CONTACTS.map(c => {
      let q
      if (c.id === 'admin' && schoolId) {
        q = query(collection(db, 'messages', schoolId, 'thread'), orderBy('ts', 'desc'))
      } else {
        const threadId = makeThreadId(myUid, c.id)
        q = query(collection(db, 'conversations', threadId, 'messages'), orderBy('ts', 'desc'))
      }
      
      return onSnapshot(q, (snap) => {
        if (snap.empty) {
          setLastMsgs(prev => ({ ...prev, [c.id]: null }))
          return
        }
        const d = snap.docs[0].data()
        setLastMsgs(prev => ({
          ...prev,
          [c.id]: {
            id: snap.docs[0].id,
            text: d.text,
            senderId: d.sender || d.senderId,
            senderName: d.senderName || d.senderEmail,
            ts: d.ts ?? null,
            timeLabel: fmtTime(d.ts ?? null),
          },
        }))
      })
    })
    return () => unsubs.forEach(u => u())
  }, [myUid, schoolId])

  // ── Send ─────────────────────────────────────────────
  const send = useCallback(async () => {
    if (!draft.trim() || !selectedId || !myUid || sending) return
    const text = draft.trim()
    setDraft('')
    setSending(true)
    try {
      if (selectedId === 'admin' && schoolId) {
        await addDoc(collection(db, 'messages', schoolId, 'thread'), {
          text,
          sender: 'principal',
          senderName: myName,
          ts: serverTimestamp(),
        })
      } else {
        const threadId = makeThreadId(myUid, selectedId)
        await addDoc(collection(db, 'conversations', threadId, 'messages'), {
          text,
          senderId:   myUid,
          senderName: myName,
          recipientId: selectedId,
          ts: serverTimestamp(),
        })
      }
    } catch (err) {
      console.error('[Chat] Send error:', err)
      setDraft(text) // Restore draft on failure
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }, [draft, selectedId, myUid, myName, sending])

  const contact = CONTACTS.find(c => c.id === selectedId)
  const filteredContacts = CONTACTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px' }}>Messages</h1>
        <p style={{ fontSize: 13, color: 'var(--txt2)', marginTop: 4 }}>
          Communicate directly with admin, teachers, and staff. Messages are saved in real time.
        </p>
      </div>

      {/* Chat container */}
      <div style={{
        display: 'flex', height: 'calc(100vh - 220px)', borderRadius: 14,
        border: '1px solid var(--border)', overflow: 'hidden',
        background: 'var(--bg2)',
      }}>
        {/* ── Sidebar ───────────────────────────────────── */}
        <div style={{ width: 280, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt3)', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search contacts…"
                style={{
                  width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: 8, paddingBottom: 8,
                  background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9,
                  fontSize: 12, color: 'var(--txt)', outline: 'none', fontFamily: 'Inter, sans-serif',
                  boxSizing: 'border-box',
                }}
                onFocus={e  => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e   => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {Object.keys(GROUP_MAP).map(group => {
              const contacts = filteredContacts.filter(c => GROUP_MAP[group].includes(c.role))
              if (contacts.length === 0) return null
              return (
                <div key={group}>
                  <div style={{ padding: '12px 14px 4px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--txt3)', fontFamily: 'DM Mono, monospace' }}>
                    {group}
                  </div>
                  {contacts.map(c => {
                    const last = lastMsgs[c.id]
                    const isSelected = selectedId === c.id
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedId(c.id)
                          if (lastMsgs[c.id]?.ts) setLastRead(c.id, lastMsgs[c.id]!.ts!.toMillis())
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', cursor: 'pointer', transition: 'background .1s',
                          background: isSelected ? 'rgba(110,231,183,.08)' : 'transparent',
                          borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
                        }}
                        onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--bg3)' }}
                        onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      >
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div style={{ width: 38, height: 38, borderRadius: '50%', background: c.color, color: c.textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                            {c.avatar}
                          </div>
                          {c.online && (
                            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid var(--bg2)' }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 4 }}>
                              {unreadCounts[c.id] > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--red)', color: '#fff', fontSize: 10, borderRadius: 99, padding: '1px 6px', fontWeight: 700 }}><MessageCircle size={10} color="#fff" /> {unreadCounts[c.id]}</div>}
                              {last?.timeLabel && <div style={{ fontSize: 10, color: 'var(--txt3)', fontFamily: 'DM Mono, monospace' }}>{last.timeLabel}</div>}
                            </div>
                          </div>
                          <div style={{ fontSize: 11, color: unreadCounts[c.id] ? 'var(--txt)' : 'var(--txt2)', fontWeight: unreadCounts[c.id] ? 600 : 400, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {last
                              ? ((last.senderId === myUid || last.senderId === 'principal') ? `You: ${last.text}` : last.text)
                              : <span style={{ color: 'var(--txt3)' }}>{c.role}</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--txt2)' }}>
              <Users size={12} /><span>{CONTACTS.length} contacts</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#22c55e' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
              <span>{CONTACTS.filter(c => c.online).length} online</span>
            </div>
          </div>
        </div>

        {/* ── Chat area ────────────────────────────────── */}
        {!selectedId ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: 'var(--txt3)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={28} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--txt2)', marginBottom: 6 }}>Select a conversation</div>
              <div style={{ fontSize: 13, color: 'var(--txt3)' }}>Messages are saved in real time and persist across sessions</div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--bg2)' }}>
              <button
                onClick={() => setSelectedId(null)}
                style={{ background: 'none', border: 'none', color: 'var(--txt2)', cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 6 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <ChevronLeft size={16} />
              </button>
              {contact && (
                <>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: contact.color, color: contact.textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                      {contact.avatar}
                    </div>
                    {contact.online && (
                      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid var(--bg2)' }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{contact.name}</div>
                    <div style={{ fontSize: 11, color: contact.online ? '#22c55e' : 'var(--txt3)' }}>
                      {contact.online ? 'Online' : `Last seen ${contact.lastSeen}`}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--bg)' }}>
              {loadingMsgs ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--txt3)' }}>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : messages.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--txt3)' }}>
                  <AtSign size={28} />
                  <div style={{ fontSize: 13 }}>No messages yet. Start the conversation!</div>
                </div>
              ) : (
                messages.map(m => <Bubble key={m.id} msg={m} myUid={myUid} />)
              )}
              <div ref={bottomRef} />
            </div>

            {/* Composer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg2)', flexShrink: 0 }}>
              <div
                style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 12px', transition: 'border-color .2s' }}
                onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)' }}
                onBlurCapture={e  => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)' }}
              >
                <button title="Attach" style={{ background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 6, flexShrink: 0 }}>
                  <Paperclip size={16} />
                </button>
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  placeholder={`Message ${contact?.name ?? ''}…`}
                  rows={1}
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    fontSize: 13, color: 'var(--txt)', fontFamily: 'Inter, sans-serif',
                    resize: 'none', lineHeight: 1.5,
                  }}
                />
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                  <button title="Emoji" style={{ background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 6 }}>
                    <Smile size={16} />
                  </button>
                  <button
                    onClick={send}
                    disabled={!draft.trim() || sending}
                    style={{
                      width: 34, height: 34, borderRadius: 9,
                      background: draft.trim() && !sending ? 'var(--accent)' : 'var(--bg4)',
                      border: 'none', cursor: draft.trim() && !sending ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all .15s', opacity: draft.trim() && !sending ? 1 : 0.5,
                    }}
                  >
                    {sending
                      ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--txt3)' }} />
                      : <Send size={14} color={draft.trim() ? '#000' : 'var(--txt3)'} />}
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 6, fontFamily: 'DM Mono, monospace' }}>
                Press Enter to send · Shift+Enter for new line · Messages are saved permanently
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
