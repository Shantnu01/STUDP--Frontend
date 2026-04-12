import { useState } from 'react';
import { BookOpen, Clock, Plus, Edit2, Trash2, X, Save, ChevronDown, Settings } from 'lucide-react';

/* ── Types ──────────────────────────────────────── */
type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
interface Period { subject: string; teacher: string; room: string; }
type DaySchedule = Record<string, Period | null>;
type ClassTimetable = Record<Day, DaySchedule>;

/* ── Initial data ───────────────────────────────── */
const DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAY_LABELS: Record<Day, string> = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday' };

interface ScheduleConfig {
  startTime: string;
  periods: { label: string; start: string; end: string; isBreak?: boolean }[];
}

const DEFAULT_CONFIG: ScheduleConfig = {
  startTime: '08:00',
  periods: [
    { label: 'Period 1', start: '08:00', end: '08:45' },
    { label: 'Period 2', start: '08:45', end: '09:30' },
    { label: 'Period 3', start: '09:30', end: '10:15' },
    { label: 'Break',    start: '10:15', end: '10:30', isBreak: true },
    { label: 'Period 4', start: '10:30', end: '11:15' },
    { label: 'Period 5', start: '11:15', end: '12:00' },
    { label: 'Period 6', start: '12:00', end: '12:45' },
    { label: 'Lunch',     start: '12:45', end: '01:45', isBreak: true },
    { label: 'Period 7', start: '01:45', end: '02:30' },
    { label: 'Period 8', start: '02:30', end: '03:15' },
  ]
};

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Mathematics':   { bg: 'rgba(59,130,246,.1)',  text: '#60a5fa', border: 'rgba(59,130,246,.2)' },
  'Physics':       { bg: 'rgba(168,85,247,.1)',  text: '#c084fc', border: 'rgba(168,85,247,.2)' },
  'English':       { bg: 'rgba(16,185,129,.1)',  text: '#34d399', border: 'rgba(16,185,129,.2)' },
  'Chemistry':     { bg: 'rgba(239,68,68,.1)',   text: '#f87171', border: 'rgba(239,68,68,.2)' },
  'History':       { bg: 'rgba(245,158,11,.1)',  text: '#fbbf24', border: 'rgba(245,158,11,.2)' },
  'Geography':     { bg: 'rgba(249,115,22,.1)',  text: '#fb923c', border: 'rgba(249,115,22,.2)' },
  'Computer Sci.': { bg: 'rgba(6,182,212,.1)',   text: '#22d3ee', border: 'rgba(6,182,212,.2)' },
  'Phy. Ed.':      { bg: 'rgba(132,204,22,.1)',  text: '#a3e635', border: 'rgba(132,204,22,.2)' },
};

function makeSampleTT(config: ScheduleConfig): ClassTimetable {
  const tt: ClassTimetable = { Mon: {}, Tue: {}, Wed: {}, Thu: {}, Fri: {} };
  // Pre-fill with empty
  DAYS.forEach(d => {
    config.periods.filter(p => !p.isBreak).forEach(p => {
      tt[d][`${p.start}–${p.end}`] = null;
    });
  });
  return tt;
}

const CLASSES = ['Grade 6-A', 'Grade 7-A', 'Grade 10-A', 'Grade 12-A'];

export default function Timetable() {
  const [selectedClass, setSelectedClass] = useState('Grade 10-A');
  const [config, setConfig] = useState<ScheduleConfig>(DEFAULT_CONFIG);
  const [timetables, setTimetables] = useState<Record<string, ClassTimetable>>({ 'Grade 10-A': makeSampleTT(DEFAULT_CONFIG) });
  const [editCell, setEditCell] = useState<{ day: Day; period: string } | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editConfig, setEditConfig] = useState<ScheduleConfig>(config);

  const tt = timetables[selectedClass] ?? makeSampleTT(config);

  const updateCell = (day: Day, period: string, value: Period | null) => {
    setTimetables(prev => ({
      ...prev,
      [selectedClass]: { ...prev[selectedClass], [day]: { ...(prev[selectedClass]?.[day] ?? {}), [period]: value } },
    }));
    setEditCell(null);
  };

  const handleSaveConfig = () => {
    setConfig(editConfig);
    setShowConfigModal(false);
  };

  const addConfigPeriod = () => {
    setEditConfig(prev => ({
      ...prev,
      periods: [...prev.periods, { label: `Period ${prev.periods.length + 1}`, start: '00:00', end: '00:00' }]
    }));
  };

  return (
    <div className="space-y-6 animate-element">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timetable</h1>
          <p className="text-[var(--txt2)] mt-1">Full structural control over your school schedule.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowConfigModal(true)} className="flex items-center gap-2 bg-[var(--bg2)] border border-[var(--border)] px-4 py-2 rounded-xl text-sm font-semibold">
            <Settings className="w-4 h-4" /> Schedule Structure
          </button>
        </div>
      </header>

      <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--txt3)]" />
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-[var(--bg2)] border border-[var(--border)] rounded-xl text-sm font-semibold text-[var(--txt)] outline-none appearance-none cursor-pointer">
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="w-32 uppercase text-[10px] tracking-wider text-[var(--txt3)] font-mono">Time / Period</th>
                {DAYS.map(d => <th key={d} className="uppercase text-[10px] tracking-wider text-[var(--txt3)] font-mono">{DAY_LABELS[d]}</th>)}
              </tr>
            </thead>
            <tbody>
              {config.periods.map((p, pi) => {
                const pKey = `${p.start}–${p.end}`;
                return (
                  <tr key={pi} className={p.isBreak ? 'bg-[var(--bg3)]/30' : ''}>
                    <td className="p-4 border-b border-[var(--border)]">
                      <div className="text-xs font-bold text-[var(--txt)]">{p.label}</div>
                      <div className="text-[10px] text-[var(--txt3)] font-mono mt-0.5">{p.start} - {p.end}</div>
                    </td>
                    {DAYS.map(d => {
                      if (p.isBreak) return <td key={d} className="border-b border-[var(--border)] opacity-30 text-center text-[10px] italic">Break</td>;
                      const cell = tt[d]?.[pKey];
                      const col = cell ? (SUBJECT_COLORS[cell.subject] ?? { bg: 'var(--bg3)', text: 'var(--txt2)', border: 'var(--border)' }) : null;
                      return (
                        <td key={d} className="p-2 border-b border-[var(--border)] min-w-[120px]">
                          <div onClick={() => setEditCell({ day: d, period: pKey })}
                            className={`min-h-[60px] p-3 rounded-lg border cursor-pointer transition-all hover:scale-[0.98] ${cell ? '' : 'border-dashed border-[var(--border)]'}`}
                            style={cell ? { background: col!.bg, borderColor: col!.border } : {}}>
                            {cell ? (
                              <>
                                <div className="text-xs font-bold" style={{ color: col!.text }}>{cell.subject}</div>
                                <div className="text-[10px] opacity-70" style={{ color: col!.text }}>{cell.teacher}</div>
                                {cell.room && <div className="text-[9px] font-mono mt-1" style={{ color: col!.text }}>📍 {cell.room}</div>}
                              </>
                            ) : (
                                <div className="h-full flex items-center justify-center text-[var(--txt3)] opacity-0 hover:opacity-100"><Plus size={14} /></div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Settings Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="card-header shrink-0">
              <div className="card-title">Schedule Structure Settings</div>
              <button onClick={() => setShowConfigModal(false)} className="btn btn-ghost p-1.5"><X size={16} /></button>
            </div>
            <div className="card-body overflow-y-auto space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4 items-end">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--txt2)]">School Start Time</label>
                    <input type="time" value={editConfig.startTime} onChange={e => setEditConfig({ ...editConfig, startTime: e.target.value })}
                        className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm text-[var(--txt)]" />
                  </div>
                  <button onClick={addConfigPeriod} className="h-10 border border-dashed border-[var(--accent)] text-[var(--accent)] text-xs font-bold rounded-xl hover:bg-[var(--accent)]/5 transition-all">
                    + Add Period / Break
                  </button>
              </div>

              <div className="space-y-3">
                {editConfig.periods.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[var(--bg3)]/50 rounded-xl border border-[var(--border)]">
                    <input value={p.label} onChange={e => {
                        const newPeriods = [...editConfig.periods];
                        newPeriods[i].label = e.target.value;
                        setEditConfig({ ...editConfig, periods: newPeriods });
                    }} className="flex-1 bg-transparent border-none text-sm font-bold text-[var(--txt)] focus:ring-0" placeholder="Label" />
                    <div className="flex items-center gap-2">
                      <input type="time" value={p.start} onChange={e => {
                          const newPeriods = [...editConfig.periods];
                          newPeriods[i].start = e.target.value;
                          setEditConfig({ ...editConfig, periods: newPeriods });
                      }} className="bg-[var(--bg2)] border border-[var(--border)] rounded-lg px-2 py-1 text-[11px] text-[var(--txt)]" />
                      <span className="text-[var(--txt3)]">-</span>
                      <input type="time" value={p.end} onChange={e => {
                          const newPeriods = [...editConfig.periods];
                          newPeriods[i].end = e.target.value;
                          setEditConfig({ ...editConfig, periods: newPeriods });
                      }} className="bg-[var(--bg2)] border border-[var(--border)] rounded-lg px-2 py-1 text-[11px] text-[var(--txt)]" />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={p.isBreak} onChange={e => {
                            const newPeriods = [...editConfig.periods];
                            newPeriods[i].isBreak = e.target.checked;
                            setEditConfig({ ...editConfig, periods: newPeriods });
                        }} className="rounded border-[var(--border)] text-[var(--accent)] bg-[var(--bg3)]" />
                        <span className="text-[10px] font-bold text-[var(--txt3)] uppercase">Break</span>
                    </label>
                    <button onClick={() => {
                        const newPeriods = editConfig.periods.filter((_, idx) => idx !== i);
                        setEditConfig({ ...editConfig, periods: newPeriods });
                    }} className="text-rose-400 hover:bg-rose-400/10 p-1 rounded-lg transition-all"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 pt-2 border-t border-[var(--border)] flex justify-end gap-3 shrink-0">
               <button onClick={() => setShowConfigModal(false)} className="px-5 py-2 text-sm font-semibold">Cancel</button>
               <button onClick={handleSaveConfig} className="bg-[var(--accent)] text-black font-bold px-6 py-2 rounded-xl text-sm shadow-lg shadow-[var(--accent)]/10">Apply Structure</button>
            </div>
          </div>
        </div>
      )}

      {/* Cell Editor Modal (Simple version) */}
      {editCell && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="card w-full max-w-sm">
                <div className="card-header">
                    <div className="card-title">Edit Period</div>
                    <button onClick={() => setEditCell(null)} className="btn btn-ghost p-1.5"><X size={16} /></button>
                </div>
                <div className="card-body space-y-4 p-5">
                    <div>
                        <label className="text-xs font-semibold text-[var(--txt2)] block mb-1.5">Subject</label>
                        <select
                            value={tt[editCell.day]?.[editCell.period]?.subject || ''}
                            onChange={e => updateCell(editCell.day, editCell.period, e.target.value ? { subject: e.target.value, teacher: tt[editCell.day]?.[editCell.period]?.teacher || '', room: tt[editCell.day]?.[editCell.period]?.room || '' } : null)}
                            className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm text-[var(--txt)]">
                            <option value="">— Empty —</option>
                            {Object.keys(SUBJECT_COLORS).map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-[var(--txt2)] block mb-1.5">Teacher</label>
                        <input
                            value={tt[editCell.day]?.[editCell.period]?.teacher || ''}
                            onChange={e => updateCell(editCell.day, editCell.period, { subject: tt[editCell.day]?.[editCell.period]?.subject || '', teacher: e.target.value, room: tt[editCell.day]?.[editCell.period]?.room || '' })}
                            className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm text-[var(--txt)]" />
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
