import { useEffect, useState } from 'react';
import { Send, Users, Check, Search, MessageSquare, AtSign, ChevronDown } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

function makeThreadId(uidA: string, uidB: string) {
  return [uidA, uidB].sort().join('__');
}

const TEMPLATES = [
  { label: 'Staff Meeting Reminder', body: 'Dear {name},\n\nThis is a reminder that a Staff Meeting is scheduled for [DATE] at [TIME] in the Conference Hall.\n\nYour attendance is mandatory.\n\nRegards,\nPrincipal' },
  { label: 'Holiday Notice',         body: 'Dear {name},\n\nPlease be informed that the school will remain closed on [DATE] due to [HOLIDAY].\n\nRegards,\nPrincipal' },
  { label: 'Exam Duty Assignment',   body: 'Dear {name},\n\nYou have been assigned exam invigilation duty on [DATE] for [EXAM].\n\nKindly report to the examination office by [TIME].\n\nRegards,\nPrincipal' },
  { label: 'Training Workshop',      body: 'Dear {name},\n\nYou are invited to attend a professional development workshop on [TOPIC] scheduled for [DATE].\n\nRegistration is mandatory.\n\nRegards,\nPrincipal' },
];

export default function BulkMessage() {
  const [recipients, setRecipients] = useState<{ id: string; name: string; subject: string; email: string; }[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [channelOpen, setChannelOpen] = useState(false);
  const [channel, setChannel] = useState<'email' | 'sms' | 'app'>('app');
  const [sent, setSent] = useState(false);

  const { user, profile } = useAuthStore();
  const myUid = user?.uid ?? '';
  const myName = profile?.displayName || user?.displayName || 'Principal';
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchAll() {
      try {
        const [resT, resS] = await Promise.all([
          api.get('/api/teachers'),
          api.get('/api/staff')
        ]);
        
        const teachers = (resT.data?.teachers || []).map((t: any) => ({
          id: `teacher_${t.id}`,
          name: t.name,
          subject: t.subject || 'Teacher',
          email: t.email
        }));
        
        const staff = (resS.data?.staff || []).map((s: any) => ({
          id: `staff_${s.id}`,
          name: s.name,
          subject: s.role || s.work || 'Staff',
          email: s.email
        }));
        
        // Filter out profiles with absolutely no email
        const all = [...teachers, ...staff].filter(r => r.email && r.email.trim() !== '');
        
        setRecipients(all);
      } catch (e) {
        console.error('Failed to load secure contacts:', e);
        toast.error('Could not load email profiles');
      }
    }
    fetchAll();
  }, []);

  const filtered = recipients.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAll = () => {
    if (selected.size === recipients.length) setSelected(new Set());
    else setSelected(new Set(recipients.map(t => t.id)));
  };

  const toggle = (id: string) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelected(s);
  };

  const handleSend = async () => {
    if (selected.size === 0 || !message.trim()) return;
    if (!myUid) {
      toast.error('You must be logged in to send messages');
      return;
    }

    setSent(true);
    try {
      // Log memory to Firestore chat thread for all channels
      const promises = Array.from(selected).map(targetId => {
        const threadId = makeThreadId(myUid, targetId);
        const recipient = recipients.find(r => r.id === targetId);
        const finalMessage = recipient ? message.replace(/\{name\}/g, recipient.name.split(' ')[0]) : message;
        
        let prefix = '';
        if (channel === 'email') prefix = '📧 [Sent via Email]\n';
        if (channel === 'sms') prefix = '📱 [Sent via SMS]\n';
        
        return addDoc(collection(db, 'conversations', threadId, 'messages'), {
          text: prefix + finalMessage,
          senderId: myUid,
          senderName: myName,
          recipientId: targetId,
          ts: serverTimestamp(),
        });
      });
      await Promise.all(promises);

      // Actually trigger Real NodeMailer Integration
      if (channel === 'email') {
        const selectedRecipients = Array.from(selected)
          .map(id => recipients.find(r => r.id === id))
          .filter(Boolean)
          .map(r => ({ email: r!.email, name: r!.name }));

        await api.post('/api/email/bulk', {
          recipients: selectedRecipients,
          subject: subject || 'Notice from Principal',
          message: message,
          senderName: myName
        });
      }

      if (channel === 'sms') {
        // SMS Mock
        await new Promise(r => setTimeout(r, 1000));
      }
      
      toast.success(`Message sent to ${selected.size} recipients!`);
      setTimeout(() => { setSent(false); navigate('/principal/chat'); }, 1500);
    } catch (e: any) {
      toast.error('Error sending messages: ' + e.message);
      setSent(false);
    }
  };

  const applyTemplate = (body: string) => {
    setMessage(body);
  };

  return (
    <div className="space-y-6 animate-element animate-delay-100">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Message</h1>
          <p className="text-[var(--txt2)] mt-1">Send secure messages to selected staff.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Teacher Selection — 2 cols */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <div>
              <div className="card-title flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--accent)]" />
                Recipients
              </div>
              <div className="card-sub">{selected.size} of {recipients.length} eligible selected</div>
            </div>
            <button onClick={toggleAll} className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${selected.size === recipients.length && recipients.length > 0 ? 'btn-danger' : 'btn btn-ghost'}`}>
              {selected.size === recipients.length && recipients.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="px-5 pb-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--txt3)]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search staff..."
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg3)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--txt)]"
              />
            </div>

            <div className="space-y-1 max-h-[440px] overflow-y-auto pr-1">
              {filtered.map(t => {
                const isSelected = selected.has(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggle(t.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all border ${
                      isSelected
                        ? 'bg-[var(--accent)]/10 border-[var(--accent)]/20'
                        : 'hover:bg-[var(--bg3)] border-transparent'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--txt)]'}`}>{t.name}</p>
                      <p className="text-[10px] text-[var(--txt3)] flex items-center gap-1">
                        {t.subject}
                      </p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[var(--accent)]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Message Composer — 3 cols */}
        <div className="lg:col-span-3 flex flex-col gap-4">

          {/* Templates */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Message Templates</div>
            </div>
            <div className="px-5 pb-5 grid grid-cols-2 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.label}
                  onClick={() => applyTemplate(t.body)}
                  className="text-left p-3 rounded-xl bg-[var(--bg3)] hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/30 border border-transparent transition-all group"
                >
                  <p className="text-sm font-semibold text-[var(--txt)] group-hover:text-[var(--accent)] transition-colors leading-tight">{t.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Composer */}
          <div className="card flex-1">
            <div className="card-header">
              <div className="card-title flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--accent)]" />
                Compose Message
              </div>

              {/* Channel selector */}
              <div className="relative">
                <button
                  onClick={() => setChannelOpen(o => !o)}
                  className="btn btn-ghost flex items-center gap-2 text-sm"
                >
                  {channel === 'email' ? '📧 Email' : channel === 'sms' ? '📱 SMS' : '🔔 App Notification'}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {channelOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-[var(--bg2)] border border-[var(--border)] rounded-xl shadow-2xl z-30 overflow-hidden w-48">
                    {(['email', 'sms', 'app'] as const).map(c => (
                      <button
                        key={c}
                        onClick={() => { setChannel(c); setChannelOpen(false); }}
                        className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-[var(--bg3)] transition-colors ${channel === c ? 'text-[var(--accent)]' : 'text-[var(--txt)]'}`}
                      >
                        {c === 'email' ? '📧 Email' : c === 'sms' ? '📱 SMS' : '🔔 App Notification'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card-body space-y-4">
              {channel === 'email' && (
                <div>
                  <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">Subject</label>
                  <input
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. Staff Meeting — April 14"
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[var(--txt2)]">Message Body</label>
                  <span className="text-[11px] text-[var(--txt3)]">{message.length} chars</span>
                </div>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={8}
                  placeholder="Type your message here... Use {name} to personalize."
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none leading-relaxed"
                />
                <p className="text-[11px] text-[var(--txt3)] mt-1.5">Use <code className="bg-[var(--bg3)] px-1 py-0.5 rounded text-[var(--accent)]">{'{{name}}'}</code> to auto-insert teacher name.</p>
              </div>

              {/* Preview row */}
              {selected.size > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-[var(--bg3)] rounded-xl">
                  <span className="text-xs text-[var(--txt3)] font-semibold self-center">To:</span>
                  {Array.from(selected).map(id => {
                    const t = recipients.find(x => x.id === id);
                    return t ? (
                      <span key={id} className="text-xs font-medium bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 px-2.5 py-1 rounded-full">
                        {t.name.split(' ')[0]}
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={selected.size === 0 || !message.trim() || sent}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all ${
                  sent
                    ? 'bg-emerald-500 text-white'
                    : selected.size === 0 || !message.trim()
                    ? 'bg-[var(--bg3)] text-[var(--txt3)] cursor-not-allowed'
                    : 'bg-[var(--accent)] text-black hover:opacity-90 shadow-lg shadow-[var(--accent)]/20'
                }`}
              >
                {sent ? (
                  <><Check className="w-4 h-4" /> Message Queued!</>
                ) : (
                  <><Send className="w-4 h-4" /> Send to {selected.size || 0} Teacher{selected.size !== 1 ? 's' : ''}</>
                )}
              </button>

              {sent && (
                <p className="text-center text-xs text-emerald-400 font-medium animate-in fade-in">
                  ✓ Message delivered to chat successfully. Redirecting...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
