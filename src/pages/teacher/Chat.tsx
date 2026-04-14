import { useState, useEffect, useRef, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useChat, useChatMessages, useTeachersList } from '@/hooks/useComms'
import { Teacher } from '@/types'
import { initials, fmtTime, fmtDateShort, makeThreadId, subjectColor } from '@/lib/utils'
import { Send, Search, MessageSquare, Crown } from 'lucide-react'

export default function Chat() {
  const { teacher } = useOutletContext<{ teacher: Teacher }>()
  const { threads, getOrCreateThread } = useChat(teacher.uid, teacher.schoolId)
  const { teachers } = useTeachersList(teacher.schoolId)
  const [activeThread, setActiveThread]   = useState<string | null>(null)
  const [activeContact, setActiveContact] = useState<{ name: string; uid: string; role?: string; subject?: string } | null>(null)
  const [opening, setOpening]             = useState(false)
  const { messages, loading: msgLoading, send } = useChatMessages(activeThread)
  const [input, setInput]   = useState('')
  const [search, setSearch] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Build contacts list: all other active teachers, principal pinned at top
  const contacts = teachers
    .filter(t => t.uid !== teacher.uid)
    .sort((a, b) => {
      if (a.role === 'principal') return -1
      if (b.role === 'principal') return 1
      return a.name.localeCompare(b.name)
    })
    .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || (t.subject ?? '').toLowerCase().includes(search.toLowerCase()))

  const openThread = useCallback(async (contact: typeof contacts[0]) => {
    if (opening) return
    setOpening(true)
    try {
      const tid = await getOrCreateThread(contact.uid, contact.name, teacher.name)
      setActiveThread(tid)
      setActiveContact({ name: contact.name, uid: contact.uid, role: contact.role, subject: contact.subject })
    } finally { setOpening(false) }
  }, [opening, getOrCreateThread, teacher.name])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || !activeThread) return
    setInput('')
    await send(activeThread, {
      threadId: activeThread,
      senderId: teacher.uid,
      senderName: teacher.name,
      senderRole: 'teacher',
      text,
      ts: null,
      read: false,
    })
  }, [input, activeThread, send, teacher.uid, teacher.name])

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // Get thread preview from threads list
  const getPreview = (contactUid: string) => {
    const tid = makeThreadId(teacher.uid, contactUid)
    return threads.find(t => t.id === tid)?.lastMessage ?? ''
  }

  return (
    <div
      className="fade-in"
      style={{
        display: 'flex', height: 'calc(100vh - 90px)', borderRadius: 14, overflow: 'hidden',
        background: 'var(--bg2)', border: '1px solid var(--border)',
      }}
    >
      {/* ── CONTACTS ─────────────────────────────────────────── */}
      <div style={{ width: 264, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '13px 14px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Messages</div>
          <div className="search-wrap">
            <Search size={13} />
            <input className="search-input" placeholder="Search people…" value={search} onChange={e => setSearch(e.target.value)} style={{ fontSize: 12 }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {contacts.length === 0 && (
            <div className="empty" style={{ padding: 20 }}>
              <p>No other staff members yet</p>
            </div>
          )}
          {contacts.map(c => {
            const tid     = makeThreadId(teacher.uid, c.uid)
            const isActive = activeThread === tid
            const color   = subjectColor(c.subject ?? c.name)
            const preview = getPreview(c.uid)
            return (
              <div
                key={c.uid}
                onClick={() => openThread(c)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  cursor: opening ? 'wait' : 'pointer',
                  borderBottom: '1px solid var(--border)',
                  background: isActive ? 'rgba(167,139,250,.08)' : 'transparent',
                  borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                  transition: 'all .12s',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg3)' }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <div className="av av-round" style={{ width: 34, height: 34, fontSize: 12, background: `${color}20`, color, flexShrink: 0 }}>
                  {initials(c.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </span>
                    {c.role === 'principal' && <Crown size={10} color="var(--amber)" />}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--txt2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {preview || (c.role === 'principal' ? 'Principal' : c.subject ?? 'Teacher')}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── CHAT AREA ─────────────────────────────────────────── */}
      {activeThread && activeContact ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header */}
          <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div className="av av-round" style={{ width: 30, height: 30, fontSize: 11, background: `${subjectColor(activeContact.subject ?? activeContact.name)}20`, color: subjectColor(activeContact.subject ?? activeContact.name), flexShrink: 0 }}>
              {initials(activeContact.name)}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                {activeContact.name}
                {activeContact.role === 'principal' && <Crown size={11} color="var(--amber)" />}
              </div>
              <div style={{ fontSize: 10, color: 'var(--txt2)', fontFamily: 'DM Mono,monospace' }}>
                {activeContact.role === 'principal' ? 'Principal' : activeContact.subject ?? 'Teacher'}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {msgLoading && (
              <div style={{ textAlign: 'center', color: 'var(--txt3)', fontSize: 11, fontFamily: 'DM Mono,monospace', paddingTop: 20 }}>
                Loading messages…
              </div>
            )}
            {!msgLoading && messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--txt3)', fontSize: 12, paddingTop: 40 }}>
                No messages yet with {activeContact.name}.<br />
                <span style={{ fontSize: 11, fontFamily: 'DM Mono,monospace' }}>Say hello to start the conversation.</span>
              </div>
            )}
            {messages.map((m, i) => {
              const isMe = m.senderId === teacher.uid
              const showDate = i === 0 || fmtDateShort(messages[i - 1]?.ts) !== fmtDateShort(m.ts)
              return (
                <div key={m.id}>
                  {showDate && (
                    <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace', margin: '4px 0 8px' }}>
                      {fmtDateShort(m.ts)}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 2 }}>
                    {!isMe && (
                      <div style={{ fontSize: 10, color: 'var(--txt3)', marginBottom: 1, paddingLeft: 4 }}>{m.senderName}</div>
                    )}
                    <div
                      style={{
                        maxWidth: '78%', padding: '8px 12px', fontSize: 12, lineHeight: 1.55,
                        background: isMe ? 'var(--accent)' : 'var(--bg3)',
                        color: isMe ? '#000' : 'var(--txt)',
                        borderRadius: isMe ? '12px 3px 12px 12px' : '3px 12px 12px 12px',
                        fontWeight: isMe ? 500 : 400,
                      }}
                    >
                      {m.text}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--txt3)', fontFamily: 'DM Mono,monospace' }}>
                      {fmtTime(m.ts)}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Message ${activeContact.name}…`}
              rows={1}
              style={{
                flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '8px 11px', fontSize: 12, color: 'var(--txt)',
                fontFamily: 'Sora,sans-serif', resize: 'none', outline: 'none',
                lineHeight: 1.4, minHeight: 36, transition: 'border .15s',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              style={{
                width: 34, height: 34, borderRadius: 8, background: 'var(--accent)',
                border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
                opacity: input.trim() ? 1 : .5,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                transition: 'opacity .15s',
              }}
            >
              <Send size={14} color="#000" />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(167,139,250,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={24} color="var(--accent)" />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Select a conversation</div>
          <div style={{ fontSize: 12, color: 'var(--txt2)', textAlign: 'center', maxWidth: 240 }}>
            Message your principal or fellow teachers on the left
          </div>
        </div>
      )}
    </div>
  )
}
