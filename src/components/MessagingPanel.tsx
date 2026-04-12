import { useState, useEffect, useRef } from 'react'
import { School } from '@/types'
import { useMessages } from '@/hooks/useMessages'
import { initials, planColors, fmtTime } from '@/lib/utils'
import { X, ChevronLeft, Send, Plus, MessageCircle } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { useAdminGlobalChat } from '@/hooks/useAdminGlobalChat'

interface Props {
  schools: School[]
  initialSchoolId: string | null
  onClose: () => void
}

export default function MessagingPanel({ schools, initialSchoolId, onClose }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSchoolId)
  const [inputText, setInputText] = useState('')
  const [newMsgSchool, setNewMsgSchool] = useState('')
  const [showNewMsg, setShowNewMsg] = useState(false)
  const msgsEndRef = useRef<HTMLDivElement>(null)
  const { messages, loading, sendMessage } = useMessages(selectedId)

  const { setLastRead } = useChatStore()
  const { unreadCounts } = useAdminGlobalChat(schools)

  useEffect(() => {
    if (initialSchoolId) setSelectedId(initialSchoolId)
  }, [initialSchoolId])

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    if (selectedId && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.ts) {
        setLastRead(selectedId, lastMsg.ts.toMillis())
      }
    }
  }, [messages, selectedId, setLastRead])

  const selectedSchool = schools.find(s => s.id === selectedId)

  const handleSend = async () => {
    if (!inputText.trim()) return
    await sendMessage(inputText)
    setInputText('')
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleNewMsg = async () => {
    if (!newMsgSchool || !inputText.trim()) return
    setSelectedId(newMsgSchool)
    setShowNewMsg(false)
    setNewMsgSchool('')
  }

  return (
    <div style={{
      width: 280, flexShrink: 0, background: 'var(--bg2)',
      borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      {!selectedId ? (
        /* Contact list */
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{
            padding: '13px 14px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>Messages</div>
            <button
              title="New message"
              onClick={() => setShowNewMsg(v => !v)}
              style={{ background: 'none', border: 'none', color: 'var(--txt2)', cursor: 'pointer', display: 'flex' }}
            ><Plus size={16} /></button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--txt2)', cursor: 'pointer', display: 'flex' }}
            ><X size={16} /></button>
          </div>

          {showNewMsg && (
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6 }}>
              <select
                value={newMsgSchool}
                onChange={e => setNewMsgSchool(e.target.value)}
                style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', fontSize: 11, color: 'var(--txt)', outline: 'none' }}
              >
                <option value="">Select school…</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button className="btn btn-accent btn-sm" onClick={() => { if (newMsgSchool) { setSelectedId(newMsgSchool); setShowNewMsg(false) } }}>Go</button>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {schools.length === 0 ? (
              <div className="empty"><p>No schools yet</p></div>
            ) : schools.map(s => {
              const { bg, color } = planColors(s.plan)
              const ini = initials(s.name)
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '10px 14px', cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    transition: 'background .1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="av" style={{ width: 32, height: 32, fontSize: 11, background: bg, color }}>{ini}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                      {unreadCounts[s.id] > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--red)', color: '#fff', fontSize: 9, borderRadius: 99, padding: '1px 5px', fontWeight: 700, flexShrink: 0 }}>
                          <MessageCircle size={9} color="#fff" /> {unreadCounts[s.id]}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: unreadCounts[s.id] ? 'var(--txt)' : 'var(--txt2)', fontWeight: unreadCounts[s.id] ? 600 : 400, marginTop: 1 }}>{s.city} · {s.plan}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Thread view */
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{
            padding: '11px 14px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          }}>
            <button
              onClick={() => setSelectedId(null)}
              style={{ background: 'none', border: 'none', color: 'var(--txt2)', cursor: 'pointer', display: 'flex' }}
            ><ChevronLeft size={16} /></button>
            {selectedSchool && (() => {
              const { bg, color } = planColors(selectedSchool.plan)
              return (
                <div className="av" style={{ width: 26, height: 26, fontSize: 10, background: bg, color }}>
                  {initials(selectedSchool.name)}
                </div>
              )
            })()}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedSchool?.name ?? selectedId}
              </div>
              <div style={{ fontSize: 10, color: 'var(--txt2)', fontFamily: 'DM Mono, monospace' }}>
                {selectedSchool?.email ?? 'School admin'}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--txt2)', cursor: 'pointer', display: 'flex' }}><X size={15} /></button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--txt3)', fontSize: 11, paddingTop: 20, fontFamily: 'DM Mono, monospace' }}>Loading…</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--txt3)', fontSize: 11, paddingTop: 20, fontFamily: 'DM Mono, monospace' }}>
                No messages yet · say hello
              </div>
            ) : messages.map(m => {
              const isOut = m.sender === 'admin'
              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOut ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '88%', padding: '8px 11px', fontSize: 12, lineHeight: 1.55,
                    background: isOut ? 'var(--accent)' : 'var(--bg3)',
                    color: isOut ? '#000' : 'var(--txt)',
                    borderRadius: isOut ? '10px 3px 10px 10px' : '3px 10px 10px 10px',
                    fontWeight: isOut ? 500 : 400,
                  }}>{m.text}</div>
                  <div style={{ fontSize: 9, color: 'var(--txt3)', marginTop: 3, fontFamily: 'DM Mono, monospace' }}>
                    {fmtTime(m.ts)}
                  </div>
                </div>
              )
            })}
            <div ref={msgsEndRef} />
          </div>

          <div style={{
            padding: '10px 12px', borderTop: '1px solid var(--border)',
            display: 'flex', gap: 7, alignItems: 'flex-end', flexShrink: 0,
          }}>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message…"
              rows={1}
              style={{
                flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '7px 10px', fontSize: 12, color: 'var(--txt)',
                fontFamily: 'Sora, sans-serif', resize: 'none', outline: 'none',
                lineHeight: 1.4, minHeight: 34, transition: 'border .2s',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
            <button
              onClick={handleSend}
              style={{
                width: 32, height: 32, borderRadius: 8, background: 'var(--accent)',
                border: 'none', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            ><Send size={13} color="#000" /></button>
          </div>
        </div>
      )}
    </div>
  )
}
