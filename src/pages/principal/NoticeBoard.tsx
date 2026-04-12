import { useState } from 'react';
import { Pin, Plus, Trash2, X, Save, Search, Eye, AlertTriangle, Info, Star, Bell } from 'lucide-react';

type NoticePriority = 'urgent' | 'important' | 'general' | 'info';
type NoticeAudience = 'everyone' | 'students' | 'teachers' | 'staff' | 'parents';

interface Notice {
  id: string;
  title: string;
  body: string;
  priority: NoticePriority;
  audience: NoticeAudience;
  pinned: boolean;
  date: string;
  author: string;
  views: number;
}

const PRIORITY_CONFIG: Record<NoticePriority, { label: string; icon: any; cls: string; bg: string }> = {
  urgent:    { label: 'Urgent',    icon: AlertTriangle, cls: 'text-rose-400 border-rose-400/30',   bg: 'bg-rose-400/10' },
  important: { label: 'Important', icon: Star,          cls: 'text-amber-400 border-amber-400/30', bg: 'bg-amber-400/10' },
  general:   { label: 'General',   icon: Bell,          cls: 'text-blue-400 border-blue-400/30',   bg: 'bg-blue-400/10' },
  info:      { label: 'Info',      icon: Info,          cls: 'text-emerald-400 border-emerald-400/30', bg: 'bg-emerald-400/10' },
};

const AUDIENCE_COLORS: Record<NoticeAudience, string> = {
  everyone: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  students: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  teachers: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  staff:    'text-amber-400 bg-amber-400/10 border-amber-400/20',
  parents:  'text-rose-400 bg-rose-400/10 border-rose-400/20',
};

const SAMPLE_NOTICES: Notice[] = [
  {
    id: '1', title: 'Exam Schedule — Term 2 (2026)',
    body: 'The Term 2 examination schedule has been finalized. Exams will be conducted from May 5 to May 18, 2026. All students must carry their Hall Tickets and a valid ID. No electronic devices are permitted inside the examination hall. Detailed timetables are available at the office.',
    priority: 'urgent', audience: 'students', pinned: true,
    date: '2026-04-04', author: 'Principal', views: 284,
  },
  {
    id: '2', title: 'Staff Development Workshop — April 14',
    body: 'A mandatory professional development workshop on "Inclusive Teaching Practices" will be held on April 14, 2026 from 9 AM to 4 PM in the AV Hall. All teaching staff must attend. Breakfast and lunch will be provided. Please confirm your attendance with the Academic Coordinator by April 10.',
    priority: 'important', audience: 'teachers', pinned: true,
    date: '2026-04-03', author: 'Principal', views: 86,
  },
  {
    id: '3', title: 'Fee Payment Deadline Extended',
    body: 'The deadline for Term 2 fee payment has been extended to April 25, 2026. Students with outstanding dues are requested to clear their fees before the deadline to avoid late charges. Parents may contact the accounts office for any queries.',
    priority: 'important', audience: 'parents', pinned: false,
    date: '2026-04-02', author: 'Accounts Dept.', views: 142,
  },
  {
    id: '4', title: 'Library Books Return — Reminder',
    body: 'All students who have borrowed books from the school library are requested to return them by April 12, 2026. Books not returned by the deadline will attract a fine of ₹5 per day. New books for the 2026–27 academic year are now available for borrowing.',
    priority: 'general', audience: 'students', pinned: false,
    date: '2026-04-01', author: 'Librarian', views: 67,
  },
  {
    id: '5', title: 'School Annual Day — Volunteer Registration Open',
    body: 'Students interested in volunteering for the Annual Day (scheduled for May 30) can register at the Cultural Committee office. Volunteers will be assigned roles in event coordination, guest management, decoration, and stage management. Last date to register: April 20.',
    priority: 'info', audience: 'students', pinned: false,
    date: '2026-03-30', author: 'Cultural Committee', views: 198,
  },
  {
    id: '6', title: 'Updated School Uniform Policy (AY 2026–27)',
    body: 'Please note that the updated uniform guidelines for the 2026–27 academic year are now in effect. Students in Grades 1–7 will wear the white-and-blue uniform on all days. Grades 8 and above will continue with the grey-and-navy formal uniform. Sports uniform is mandatory on PE days only.',
    priority: 'info', audience: 'everyone', pinned: false,
    date: '2026-03-28', author: 'Admin Office', views: 310,
  },
];

const EMPTY_FORM = { title: '', body: '', priority: 'general' as NoticePriority, audience: 'everyone' as NoticeAudience, pinned: false };

export default function NoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>(SAMPLE_NOTICES);
  const [showModal, setShowModal] = useState(false);
  const [viewNotice, setViewNotice] = useState<Notice | null>(null);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<NoticePriority | 'all'>('all');
  const [filterAudience, setFilterAudience] = useState<NoticeAudience | 'all'>('all');
  const [form, setForm] = useState(EMPTY_FORM);

  const filtered = notices
    .filter(n => filterPriority === 'all' || n.priority === filterPriority)
    .filter(n => filterAudience === 'all' || n.audience === filterAudience)
    .filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const handlePost = () => {
    if (!form.title.trim() || !form.body.trim()) return;
    const newNotice: Notice = {
      id: String(Date.now()),
      ...form,
      date: new Date().toISOString().split('T')[0],
      author: 'Principal',
      views: 0,
    };
    setNotices(prev => [newNotice, ...prev]);
    setForm(EMPTY_FORM);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setNotices(prev => prev.filter(n => n.id !== id));
    if (viewNotice?.id === id) setViewNotice(null);
  };

  const togglePin = (id: string) => {
    setNotices(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  const handleView = (notice: Notice) => {
    setNotices(prev => prev.map(n => n.id === notice.id ? { ...n, views: n.views + 1 } : n));
    setViewNotice({ ...notice, views: notice.views + 1 });
  };

  const pinnedCount = notices.filter(n => n.pinned).length;

  return (
    <div className="space-y-6 animate-element animate-delay-100">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notice Board</h1>
          <p className="text-[var(--txt2)] mt-1">Post and manage official school notices.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[var(--accent)] text-black font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[var(--accent)]/20 self-start text-sm"
        >
          <Plus className="w-4 h-4" />
          Post Notice
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="mc">
          <div className="mc-label">Total Notices</div>
          <div className="mc-value">{notices.length}</div>
          <div className="mc-delta up">Posted</div>
        </div>
        <div className="mc">
          <div className="mc-label">Pinned</div>
          <div className="mc-value">{pinnedCount}</div>
          <div className="mc-delta">Highlighted</div>
        </div>
        <div className="mc">
          <div className="mc-label">Urgent / Important</div>
          <div className="mc-value">{notices.filter(n => n.priority === 'urgent' || n.priority === 'important').length}</div>
          <div className="mc-delta dn">High priority</div>
        </div>
        <div className="mc">
          <div className="mc-label">Total Views</div>
          <div className="mc-value">{notices.reduce((sum, n) => sum + n.views, 0)}</div>
          <div className="mc-delta up">Across all notices</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--txt3)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notices…"
              className="w-full pl-9 pr-4 py-2 bg-[var(--bg3)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--txt)]"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'urgent', 'important', 'general', 'info'] as const).map(p => (
              <button key={p} onClick={() => setFilterPriority(p)} className={`text-xs px-3 py-1.5 rounded-full font-semibold capitalize transition-all border ${filterPriority === p ? 'bg-[var(--accent)] text-black border-transparent' : 'border-[var(--border)] text-[var(--txt2)] hover:text-[var(--txt)]'}`}>{p}</button>
            ))}
          </div>
          <select
            value={filterAudience}
            onChange={e => setFilterAudience(e.target.value as NoticeAudience | 'all')}
            className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] capitalize"
          >
            <option value="all">All Audiences</option>
            {(['everyone', 'students', 'teachers', 'staff', 'parents'] as const).map(a => (
              <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(notice => {
          const cfg = PRIORITY_CONFIG[notice.priority];
          const Icon = cfg.icon;
          return (
            <div
              key={notice.id}
              onClick={() => handleView(notice)}
              className={`card p-5 cursor-pointer hover:-translate-y-1 transition-all group relative ${notice.pinned ? 'ring-1 ring-[var(--accent)]/40' : ''}`}
            >
              {/* Pinned badge */}
              {notice.pinned && (
                <div className="absolute top-3 right-3">
                  <Pin className="w-4 h-4 text-[var(--accent)] fill-[var(--accent)]" />
                </div>
              )}

              {/* Priority badge */}
              <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border mb-3 ${cfg.cls} ${cfg.bg}`}>
                <Icon className="w-3 h-3" />
                {cfg.label}
              </div>

              <h3 className="font-bold text-[var(--txt)] leading-tight mb-2 group-hover:text-white transition-colors pr-6">
                {notice.title}
              </h3>
              <p className="text-xs text-[var(--txt2)] leading-relaxed line-clamp-3 mb-4">
                {notice.body}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${AUDIENCE_COLORS[notice.audience]}`}>
                    {notice.audience}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[var(--txt3)]">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Eye className="w-3 h-3" /> {notice.views}
                  </span>
                  <span className="text-[11px] mono">{notice.date}</span>
                  <button
                    onClick={e => { e.stopPropagation(); togglePin(notice.id); }}
                    className={`p-1 rounded-lg hover:bg-[var(--bg3)] transition-colors ${notice.pinned ? 'text-[var(--accent)]' : ''}`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(notice.id); }}
                    className="p-1 rounded-lg hover:bg-rose-400/10 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-24 text-[var(--txt3)]">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-semibold">No notices found</p>
            <p className="text-sm mt-1">Try adjusting your filters or post a new notice.</p>
          </div>
        )}
      </div>

      {/* View Notice Modal */}
      {viewNotice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewNotice(null)}>
          <div className="card w-full max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <div className="flex-1 min-w-0">
                {(() => {
                  const cfg = PRIORITY_CONFIG[viewNotice.priority];
                  const Icon = cfg.icon;
                  return (
                    <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border mb-2 ${cfg.cls} ${cfg.bg}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </div>
                  );
                })()}
                <div className="card-title">{viewNotice.title}</div>
                <div className="card-sub mt-1">
                  Posted by {viewNotice.author} · {viewNotice.date} · {viewNotice.views} views
                </div>
              </div>
              <button onClick={() => setViewNotice(null)} className="btn btn-ghost p-1.5 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="card-body">
              <p className="text-sm text-[var(--txt)] leading-relaxed whitespace-pre-line">{viewNotice.body}</p>
              <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border capitalize ${AUDIENCE_COLORS[viewNotice.audience]}`}>
                  For: {viewNotice.audience}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => togglePin(viewNotice.id)} className={`btn btn-ghost flex items-center gap-2 text-sm ${viewNotice.pinned ? 'text-[var(--accent)]' : ''}`}>
                    <Pin className="w-4 h-4" /> {viewNotice.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button onClick={() => handleDelete(viewNotice.id)} className="btn flex items-center gap-2 text-sm text-rose-400 hover:bg-rose-400/10 px-3 py-1.5 rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Notice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-xl">
            <div className="card-header">
              <div className="card-title">Post New Notice</div>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Notice title…"
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">Notice Body *</label>
                <textarea
                  value={form.body}
                  onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                  rows={5}
                  placeholder="Type the full notice here…"
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none leading-relaxed"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(p => ({ ...p, priority: e.target.value as NoticePriority }))}
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] capitalize"
                  >
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">Audience</label>
                  <select
                    value={form.audience}
                    onChange={e => setForm(p => ({ ...p, audience: e.target.value as NoticeAudience }))}
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] capitalize"
                  >
                    {(['everyone', 'students', 'teachers', 'staff', 'parents'] as const).map(a => (
                      <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-3 p-3 bg-[var(--bg3)] rounded-xl cursor-pointer hover:bg-[var(--bg2)] transition-colors">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={e => setForm(p => ({ ...p, pinned: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-500"
                />
                <div>
                  <p className="text-sm font-semibold text-[var(--txt)]">Pin this notice</p>
                  <p className="text-xs text-[var(--txt3)]">Pinned notices always appear at the top</p>
                </div>
                <Pin className="w-4 h-4 text-[var(--txt3)] ml-auto" />
              </label>
            </div>
            <div className="p-6 pt-0 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="btn btn-ghost px-5 py-2.5">Cancel</button>
              <button
                onClick={handlePost}
                disabled={!form.title.trim() || !form.body.trim()}
                className="flex items-center gap-2 bg-[var(--accent)] text-black font-bold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
              >
                <Save className="w-4 h-4" />
                Post Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
