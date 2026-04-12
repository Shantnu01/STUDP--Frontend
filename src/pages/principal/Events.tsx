import { useState, useMemo } from 'react';
import { CalendarDays, Plus, Bell, Megaphone, GraduationCap, Trophy, Clock, ChevronRight, ChevronLeft, X, Save, Edit2 } from 'lucide-react';

type EventCategory = 'academic' | 'sports' | 'cultural' | 'admin' | 'holiday';

interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string;
  category: EventCategory;
  audience: string;
}

const CATEGORY_CONFIG: Record<EventCategory, { label: string; icon: any; cls: string }> = {
  academic:  { label: 'Academic',  icon: GraduationCap, cls: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  sports:    { label: 'Sports',    icon: Trophy,        cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  cultural:  { label: 'Cultural',  icon: Megaphone,     cls: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  admin:     { label: 'Admin',     icon: Bell,          cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  holiday:   { label: 'Holiday',   icon: CalendarDays,  cls: 'text-rose-400 bg-rose-400/10 border-rose-400/20' },
};

const INITIAL_EVENTS: SchoolEvent[] = [
  { id: '1', title: 'Spring Semester Exams', description: 'Final examinations for 2026 spring session.', date: '2026-04-10', time: '10:00', category: 'academic', audience: 'Grades 6-12' },
  { id: '2', title: 'District Sports Meet', description: 'Annual athletic competition at district level.', date: '2026-04-15', time: '09:00', category: 'sports', audience: 'Athletic Teams' },
];

function fmtEventTime(t: string): string {
  if (!t) return '--:--';
  const [hStr, mStr] = t.split(':');
  const h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return t;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}

export default function Events() {
  const [events, setEvents] = useState<SchoolEvent[]>(INITIAL_EVENTS);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1)); // April 2026
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<SchoolEvent | null>(null);
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '', category: 'academic' as EventCategory, audience: 'All Grades' });

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const changeMonth = (by: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + by, 1));
  };

  const filteredEvents = useMemo(() => {
    if (selectedDate) {
      return events.filter(e => e.date === selectedDate);
    }
    return events;
  }, [events, selectedDate]);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ title: '', description: '', date: selectedDate || '', time: '', category: 'academic', audience: 'All Grades' });
    setShowModal(true);
  };

  const openEdit = (e: SchoolEvent) => {
    setEditTarget(e);
    setForm({ ...e });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editTarget) {
      setEvents(prev => prev.map(e => e.id === editTarget.id ? { ...e, ...form } : e));
    } else {
      setEvents(prev => [...prev, { id: String(Date.now()), ...form }]);
    }
    setShowModal(false);
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 animate-element">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events Management</h1>
          <p className="text-[var(--txt2)] mt-1">Calendar navigation and event scheduling.</p>
        </div>
        <button onClick={openAdd} className="bg-[var(--accent)] text-black font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
          <Plus size={16} /> Add Event
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Side */}
        <div className="lg:col-span-5 space-y-6">
           <div className="card">
              <div className="card-header border-b border-[var(--border)]">
                 <div className="flex items-center justify-between w-full">
                    <div className="font-bold text-lg">{monthName}</div>
                    <div className="flex gap-1">
                       <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-[var(--bg3)] rounded-lg"><ChevronLeft size={18} /></button>
                       <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-[var(--bg3)] rounded-lg"><ChevronRight size={18} /></button>
                    </div>
                 </div>
              </div>
              <div className="card-body p-6">
                 <div className="grid grid-cols-7 gap-2 mb-2">
                    {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-center font-bold text-[10px] text-[var(--txt3)] p-1">{d}</div>)}
                 </div>
                 <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: firstDayOfMonth(currentDate) }).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: daysInMonth(currentDate) }).map((_, i) => {
                       const d = i + 1;
                       const ds = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                       const hasEvent = events.some(e => e.date === ds);
                       const isSelected = selectedDate === ds;
                       return (
                          <div key={d} onClick={() => setSelectedDate(isSelected ? null : ds)}
                             className={`relative h-10 flex items-center justify-center rounded-xl cursor-pointer transition-all border
                             ${isSelected ? 'bg-[var(--accent)] text-black font-bold border-[var(--accent)]' : 'hover:bg-[var(--bg3)] border-transparent'}
                             `}>
                             <span className="text-xs">{d}</span>
                             {hasEvent && !isSelected && <span className="absolute bottom-1.5 w-1 h-1 bg-[var(--accent)] rounded-full" />}
                          </div>
                       );
                    })}
                 </div>
              </div>
           </div>

           <div className="card p-5 bg-[var(--bg3)]/30 border-dashed border-[var(--border)]">
              <div className="text-xs text-[var(--txt3)] font-medium italic">Click a date to see its events or add a new one. Click again to clear filters.</div>
           </div>
        </div>

        {/* Events List Side */}
        <div className="lg:col-span-7 space-y-4">
           {selectedDate && (
              <div className="flex items-center justify-between bg-[var(--accent)]/10 px-4 py-2.5 rounded-xl border border-[var(--accent)]/20">
                 <div className="text-xs font-bold text-[var(--accent)]">Showing events for {new Date(selectedDate).toDateString()}</div>
                 <button onClick={() => setSelectedDate(null)} className="text-xs font-bold hover:underline">Clear filter</button>
              </div>
           )}

           <div className="space-y-3">
              {filteredEvents.length === 0 ? (
                 <div className="card p-12 text-center text-[var(--txt3)]">No events found.</div>
              ) : (
                 filteredEvents.map(e => {
                    const cfg = CATEGORY_CONFIG[e.category];
                    const Icon = cfg.icon;
                    return (
                       <div key={e.id} className="card p-5 group hover:border-[var(--accent)]/40 transition-all">
                          <div className="flex items-start gap-4">
                             <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${cfg.cls}`}><Icon size={18} /></div>
                             <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                   <div className="font-bold text-[var(--txt)] truncate">{e.title}</div>
                                   <button onClick={() => openEdit(e)} className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--accent)] transition-all hover:bg-[var(--accent)]/10 rounded-lg"><Edit2 size={13} /></button>
                                </div>
                                <div className="text-sm text-[var(--txt2)] mt-1 line-clamp-2">{e.description}</div>
                                <div className="flex items-center gap-4 mt-3 flex-wrap">
                                   <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--txt3)]"><Clock size={12} /> {fmtEventTime(e.time)}</div>
                                   <div className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--txt3)] bg-[var(--bg3)]">{e.audience}</div>
                                </div>
                             </div>
                          </div>
                       </div>
                    );
                 })
              )}
           </div>
        </div>
      </div>

      {/* Event Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg">
             <div className="card-header">
                <div className="card-title">{editTarget ? 'Edit Event' : 'Add New Event'}</div>
                <button onClick={() => setShowModal(false)} className="btn btn-ghost p-1.5"><X size={16} /></button>
             </div>
             <div className="card-body p-6 space-y-4">
                <div>
                   <label className="text-xs font-semibold text-[var(--txt2)] block mb-1.5">Event Title</label>
                   <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                      className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none" />
                </div>
                <div>
                   <label className="text-xs font-semibold text-[var(--txt2)] block mb-1.5">Description</label>
                   <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                      className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-xs font-semibold text-[var(--txt2)] block mb-1.5">Date</label>
                      <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                         className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm text-[var(--txt)] focus:outline-none" />
                   </div>
                   <div>
                      <label className="text-xs font-semibold text-[var(--txt2)] block mb-1.5">Time</label>
                      <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                         className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm text-[var(--txt)] focus:outline-none" />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-xs font-semibold text-[var(--txt2)] block mb-1.5">Category</label>
                      <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as any })}
                         className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm text-[var(--txt)] focus:outline-none">
                         {Object.keys(CATEGORY_CONFIG).map(k => <option key={k} value={k}>{CATEGORY_CONFIG[k as EventCategory].label}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="text-xs font-semibold text-[var(--txt2)] block mb-1.5">Audience</label>
                      <input value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })}
                         className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm text-[var(--txt)] focus:outline-none" />
                   </div>
                </div>
             </div>
             <div className="p-6 pt-2 flex justify-end gap-3 mt-2 border-t border-[var(--border)]">
                <button onClick={() => setShowModal(false)} className="px-5 py-2 text-sm">Cancel</button>
                <button onClick={handleSave} className="bg-[var(--accent)] text-black font-bold px-6 py-2 rounded-xl text-sm"><Save size={14} className="inline mr-1" /> Save Event</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
