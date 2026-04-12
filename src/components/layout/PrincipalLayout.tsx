import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserRound, CalendarCheck,
  LogOut, GraduationCap, DollarSign, Clock, Bell,
  CalendarDays, MessageSquarePlus, ClipboardList,
  ChevronLeft, Send, Search, X, MessageCircle, Inbox,
  BookOpen, Award, TrendingUp, Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalUnread } from '@/hooks/useGlobalChat';

const NAV_SECTIONS = [
  {
    label: 'Core',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard',    path: '/principal/dashboard' },
      { icon: Users,           label: 'Students',     path: '/principal/students' },
      { icon: BookOpen,        label: 'Teachers',     path: '/principal/teachers' },
      { icon: UserRound,       label: 'Staff',        path: '/principal/staff' },
    ]
  },
  {
    label: 'Academic',
    items: [
      { icon: CalendarCheck,   label: 'Attendance',   path: '/principal/attendance' },
      { icon: DollarSign,      label: 'Fees (Students)', path: '/principal/fees' },
      { icon: DollarSign,      label: 'Payments (Staff)',path: '/principal/payments' },
      { icon: Clock,           label: 'Timetable',    path: '/principal/timetable' },
      { icon: CalendarDays,    label: 'Events',       path: '/principal/events' },
    ]
  },
  {
    label: 'Comms',
    items: [
      { icon: ClipboardList,      label: 'Notice Board', path: '/principal/noticeboard' },
      { icon: MessageSquarePlus,  label: 'Bulk Message', path: '/principal/messages' },
      { icon: MessageCircle,      label: 'Messages',     path: '/principal/chat' },
    ]
  }
];

/* ── Lightweight inline chat panel ─────────────────── */
interface ChatMsg { id: string; text: string; sender: 'me' | 'them'; time: string; from: string; }
const CONTACTS = [
  { id: 'admin', name: 'Admin HQ', role: 'System Admin', avatar: 'A', color: '#6ee7b7', text: '#000' },
  { id: 'staff1', name: 'Ravindra Kumar', role: 'Head Teacher', avatar: 'R', color: '#818cf8', text: '#fff' },
  { id: 'staff2', name: 'Priya Nair', role: 'Office Staff', avatar: 'P', color: '#fb923c', text: '#fff' },
];

function ChatPanel({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMsg[]>>({
    admin: [
      { id: '1', text: 'School registration approved. Welcome aboard!', sender: 'them', time: '9:14 AM', from: 'Admin HQ' },
    ],
    staff1: [],
    staff2: [],
  });
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const contact = CONTACTS.find(c => c.id === selected);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selected]);

  const send = () => {
    if (!draft.trim() || !selected) return;
    const msg: ChatMsg = { id: Date.now().toString(), text: draft, sender: 'me', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), from: 'Me' };
    setMessages(prev => ({ ...prev, [selected]: [...(prev[selected] || []), msg] }));
    setDraft('');
  };

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: 340,
      background: 'var(--bg2)', borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', zIndex: 200,
      boxShadow: '-8px 0 32px rgba(0,0,0,.4)',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0}}>
        {selected && (
          <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--txt2)', cursor: 'pointer', display: 'flex', padding: 4 }}>
            <ChevronLeft size={16} />
          </button>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{selected ? contact?.name : 'Messages'}</div>
          {selected && <div style={{ fontSize: 11, color: 'var(--txt2)' }}>{contact?.role}</div>}
        </div>
        {!selected && (
          <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--txt3)' }}>
            {CONTACTS.length} contacts
          </div>
        )}
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--txt2)', cursor: 'pointer', display: 'flex', padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      {!selected ? (
        /* Contact list */
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {CONTACTS.map(c => {
            const msgs = messages[c.id] || [];
            const last = msgs[msgs.length - 1];
            return (
              <div key={c.id} onClick={() => setSelected(c.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                transition: 'background .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: c.color, color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {c.avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {last ? last.text : c.role}
                  </div>
                </div>
                {last && <div style={{ fontSize: 9, color: 'var(--txt3)', fontFamily: 'DM Mono, monospace', flexShrink: 0 }}>{last.time}</div>}
              </div>
            );
          })}
        </div>
      ) : (
        /* Thread view */
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(messages[selected] || []).length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--txt3)', fontSize: 12, padding: '20px 0', fontFamily: 'DM Mono, monospace' }}>No messages yet. Say hello!</div>
            )}
            {(messages[selected] || []).map(m => (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender === 'me' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '82%', padding: '9px 13px', fontSize: 13, lineHeight: 1.5,
                  borderRadius: m.sender === 'me' ? '14px 3px 14px 14px' : '3px 14px 14px 14px',
                  background: m.sender === 'me' ? 'var(--accent)' : 'var(--bg3)',
                  color: m.sender === 'me' ? '#000' : 'var(--txt)',
                  fontWeight: m.sender === 'me' ? 500 : 400,
                }}>{m.text}</div>
                <div style={{ fontSize: 9, color: 'var(--txt3)', marginTop: 3, fontFamily: 'DM Mono, monospace' }}>{m.time}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type a message…"
              rows={1}
              style={{
                flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '8px 12px', fontSize: 13, color: 'var(--txt)',
                fontFamily: 'Inter, sans-serif', resize: 'none', outline: 'none', lineHeight: 1.45,
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
            <button onClick={send} style={{
              width: 36, height: 36, borderRadius: 10, background: 'var(--accent)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Send size={14} color="#000" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Notification Badge ─────────────────────────────── */
function NotifBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span style={{
      position: 'absolute', top: -4, right: -4,
      background: 'var(--red)', color: '#fff',
      fontSize: 9, fontWeight: 700, fontFamily: 'DM Mono, monospace',
      borderRadius: 99, padding: '1px 5px',
      border: '1.5px solid var(--bg2)', lineHeight: '14px',
    }}>{count}</span>
  );
}

/* ── Main Layout ────────────────────────────────────── */
export default function PrincipalLayout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications] = useState([
    { id: 1, text: 'New fee payment received from Grade 10-A', time: '5m ago', read: false },
    { id: 2, text: 'Staff meeting scheduled for tomorrow 10 AM', time: '1h ago', read: false },
    { id: 3, text: 'Attendance alert: Grade 9-B below 75%', time: '3h ago', read: true },
  ]);
  const sysUnreadCount = notifications.filter(n => !n.read).length;

  const { totalUnread } = useGlobalUnread();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = (profile?.displayName || 'P').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const currentPage = NAV_SECTIONS.flatMap(s => s.items).find(i => location.pathname === i.path)?.label ?? 'Principal Portal';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)', color: 'var(--txt)', fontFamily: 'Inter, Sora, sans-serif' }}>

      {/* ── SIDEBAR ─────────────────────────────────────── */}
      <aside style={{ width: 240, flexShrink: 0, background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Brand */}
        <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,.3)' }}>
              <GraduationCap size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--txt)' }}>EduSync</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Principal Portal</div>
            </div>
          </div>

          {/* School badge */}
          {profile?.schoolId && (
            <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 3 }}>Active School</div>
              <div style={{ fontSize: 11, color: 'var(--txt2)', fontFamily: 'DM Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.schoolId}</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {NAV_SECTIONS.map(section => (
            <div key={section.label} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--txt3)', fontFamily: 'DM Mono, monospace', padding: '12px 8px 5px' }}>
                {section.label}
              </div>
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                const isChatItem = item.label === 'Messages';
                return (
                  <div key={item.path}>
                    <NavLink to={item.path} style={{ textDecoration: 'none' }}>
                      {({ isActive }) => (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 10px', borderRadius: 8, marginBottom: 2,
                          cursor: 'pointer', fontSize: 13, transition: 'all .15s',
                          background: isActive ? 'rgba(16,185,129,.1)' : 'transparent',
                          color: isActive ? '#10b981' : 'var(--txt2)',
                          fontWeight: isActive ? 600 : 400,
                          position: 'relative',
                        }}
                        onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'; (e.currentTarget as HTMLElement).style.color = 'var(--txt)'; }}}
                        onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--txt2)'; }}}
                        >
                          {isActive && (
                            <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, background: '#10b981', borderRadius: '0 3px 3px 0' }} />
                          )}
                          <item.icon size={15} style={{ flexShrink: 0 }} />
                          <span>{item.label}</span>
                          
                          {isChatItem && totalUnread > 0 && (
                            <span style={{ marginLeft: 'auto', background: 'var(--red)', color: '#fff', fontSize: 9, borderRadius: 99, padding: '1px 5px', fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>{totalUnread}</span>
                          )}
                        </div>
                      )}
                    </NavLink>
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, marginBottom: 6, background: 'var(--bg3)', cursor: 'pointer' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.displayName || 'Principal'}</div>
              <div style={{ fontSize: 11, color: '#10b981', fontWeight: 500 }}>Principal</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px', borderRadius: 8, background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 13, color: 'var(--txt2)', transition: 'all .15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,.08)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--txt2)'; (e.currentTarget as HTMLElement).style.background = 'none'; }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{
          height: 56, background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14, flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--txt)' }}>{currentPage}</div>
            <div style={{ fontSize: 11, color: 'var(--txt2)' }}>Principal Portal · EduSync</div>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, color: 'var(--txt3)', pointerEvents: 'none' }} />
            <input placeholder="Quick search…" style={{
              paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
              background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8,
              fontSize: 12, color: 'var(--txt)', outline: 'none', width: 180, fontFamily: 'Inter, sans-serif',
            }} onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          </div>

          {/* Notification bell */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setNotifOpen(v => !v)} style={{
              width: 36, height: 36, borderRadius: 9, background: notifOpen ? 'var(--bg3)' : 'var(--bg3)',
              border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--txt2)', position: 'relative',
            }}>
              <Bell size={15} />
              <NotifBadge count={sysUnreadCount} />
            </button>
            {notifOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 44, width: 300, background: 'var(--bg2)',
                border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,.4)', zIndex: 100,
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600 }}>Notifications</div>
                {notifications.map(n => (
                  <div key={n.id} style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: n.read ? 'transparent' : 'rgba(16,185,129,.04)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(16,185,129,.04)')}
                  >
                    <div style={{ fontSize: 12, color: 'var(--txt)', lineHeight: 1.5 }}>{n.text}</div>
                    <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 3, fontFamily: 'DM Mono, monospace' }}>{n.time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Messages icon */}
          <button onClick={() => navigate('/principal/chat')} style={{
            width: 36, height: 36, borderRadius: 9, background: 'var(--bg3)',
            border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: location.pathname === '/principal/chat' ? 'var(--accent)' : 'var(--txt2)', position: 'relative',
          }}>
            <Inbox size={15} />
            <NotifBadge count={totalUnread} />
          </button>

          {/* Avatar */}
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#fff', cursor: 'pointer', flexShrink: 0 }}>
            {initials}
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 28, background: 'var(--bg)' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
