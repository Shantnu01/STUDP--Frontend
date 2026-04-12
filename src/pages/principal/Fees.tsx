import { useEffect, useMemo, useState } from 'react';
import { DollarSign, CheckCircle2, Clock, AlertTriangle, Search, Edit, X, Save, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { STUDENT_MOCK_DATA } from '@/lib/mockData';

interface FeeRecord {
  id: string;
  studentId: string;
  student: string;
  classId: string;
  section: string;
  amount: number;
  paid: number;
  status: 'paid' | 'partial' | 'overdue';
  due: string;
}

interface FeeInput {
  id?: string;
  studentId?: string;
  student?: string;
  classId?: string;
  section?: string;
  amount?: number;
  paid?: number;
  due?: string;
  status?: string;
}

interface FeesResponse {
  fees?: FeeInput[];
  fee?: FeeInput;
}

const CLASSES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'];
const SECTIONS = ['A','B','C','D','E'];
const ENABLE_DEMO_FALLBACK = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_DATA === 'true';

const STATUS_CONFIG = {
  paid: { label: 'Paid', icon: CheckCircle2, cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  partial: { label: 'Partial', icon: Clock, cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  overdue: { label: 'Overdue', icon: AlertTriangle, cls: 'text-rose-400 bg-rose-400/10 border-rose-400/20' },
} as const;

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function computeStatus(paid: number, amount: number): 'paid' | 'partial' | 'overdue' {
  if (paid >= amount) return 'paid';
  if (paid > 0) return 'partial';
  return 'overdue';
}

function normalizeFee(record: FeeInput, index: number): FeeRecord {
  const amount = Math.max(record.amount ?? 10000, 0);
  const paid = Math.min(Math.max(record.paid ?? 0, 0), amount);
  return {
    id: record.id || `fee-${index}`,
    studentId: record.studentId || record.id || `student-${index}`,
    student: record.student || 'Unnamed Student',
    classId: record.classId || '',
    section: record.section || '',
    amount,
    paid,
    due: record.due || '2026-05-01',
    status: record.status === 'paid' || record.status === 'partial' || record.status === 'overdue' ? record.status : computeStatus(paid, amount),
  };
}

function sortFees(records: FeeRecord[]) {
  return [...records].sort((a, b) =>
    a.classId.localeCompare(b.classId) ||
    a.section.localeCompare(b.section) ||
    a.student.localeCompare(b.student)
  );
}

const FALLBACK_FEES = sortFees(STUDENT_MOCK_DATA.map((student, index) => normalizeFee({
  id: student.id,
  studentId: student.id,
  student: student.name,
  classId: student.classId,
  section: student.section,
  amount: 10000,
  paid: 0,
  due: '2026-05-01',
  status: 'overdue',
}, index)));

export default function Fees() {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'partial' | 'overdue'>('all');
  const [editTarget, setEditTarget] = useState<FeeRecord | null>(null);
  const [editPaid, setEditPaid] = useState('');
  const [editTotalFee, setEditTotalFee] = useState('');
  const [showClassFee, setShowClassFee] = useState(false);
  const [classFeeTarget, setClassFeeTarget] = useState('');
  const [classFeeAmount, setClassFeeAmount] = useState('');

  const loadFees = async (showErrorToast = false) => {
    setLoading(true);
    try {
      const res = await api.get<FeesResponse>('/api/fees');
      const raw = Array.isArray(res.data?.fees) ? res.data.fees : [];
      setFees(sortFees(raw.map((record, index) => normalizeFee(record, index))));
    } catch (error) {
      if (ENABLE_DEMO_FALLBACK) {
        setFees(FALLBACK_FEES);
      } else {
        setFees([]);
      }
      if (showErrorToast) {
        toast.error(getErrorMessage(error, 'Unable to load fee records right now.'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFees();
  }, []);

  const filtered = useMemo(() => fees.filter((fee) => {
    const matchSearch = fee.student.toLowerCase().includes(search.toLowerCase());
    const matchClass = !filterClass || fee.classId === filterClass;
    const matchSection = !filterSection || fee.section === filterSection;
    const matchStatus = filterStatus === 'all' || fee.status === filterStatus;
    return matchSearch && matchClass && matchSection && matchStatus;
  }), [fees, search, filterClass, filterSection, filterStatus]);

  const totalCollected = fees.reduce((sum, fee) => sum + fee.paid, 0);
  const totalDue = fees.reduce((sum, fee) => sum + (fee.amount - fee.paid), 0);
  const overdueCount = fees.filter((fee) => fee.status === 'overdue').length;

  const openEdit = (record: FeeRecord) => {
    setEditTarget(record);
    setEditPaid(String(record.paid));
    setEditTotalFee(String(record.amount));
  };

  const handleSave = async () => {
    if (!editTarget) return;

    const amount = Number(editTotalFee) || editTarget.amount;
    const paid = Math.min(Number(editPaid) || 0, amount);

    setSaving(true);
    try {
      await api.patch(`/api/fees/${editTarget.studentId}`, {
        amount,
        paid,
        due: editTarget.due,
      });
      toast.success('Fee record updated successfully');
      setEditTarget(null);
      await loadFees();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update fee record'));
    } finally {
      setSaving(false);
    }
  };

  const handleSetClassFee = async () => {
    if (!classFeeTarget) return;

    setSaving(true);
    try {
      await api.post('/api/fees/class-config', {
        classId: classFeeTarget,
        amount: Number(classFeeAmount) || 0,
      });
      toast.success('Class fee applied successfully');
      setShowClassFee(false);
      setClassFeeTarget('');
      setClassFeeAmount('');
      await loadFees();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to apply class fee'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-element animate-delay-100">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Management</h1>
          <p className="text-[var(--txt2)] mt-1">Manage class fees and student overrides from the live student database.</p>
        </div>
        <button onClick={() => setShowClassFee(true)} className="flex items-center gap-2 bg-[var(--bg2)] border border-[var(--border)] text-[var(--txt)] px-4 py-2 rounded-xl hover:bg-[var(--bg3)] transition-all">
          <Settings className="w-4 h-4" /> Set Class Fee
        </button>
      </header>

      <div className="grid4">
        <div className="mc">
          <div className="mc-label">Total Collected</div>
          <div className="mc-value">Rs {(totalCollected / 1000).toFixed(0)}K</div>
        </div>
        <div className="mc">
          <div className="mc-label">Outstanding Dues</div>
          <div className="mc-value">Rs {(totalDue / 1000).toFixed(0)}K</div>
        </div>
        <div className="mc">
          <div className="mc-label">Overdue Students</div>
          <div className="mc-value">{overdueCount}</div>
        </div>
        <div className="mc">
          <div className="mc-label">Collection Rate</div>
          <div className="mc-value">{totalCollected + totalDue > 0 ? Math.round((totalCollected / (totalCollected + totalDue)) * 100) : 0}%</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex-wrap gap-3">
          <div>
            <div className="card-title">Fee Records</div>
            <div className="card-sub">{filtered.length} matching students</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
              className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--txt)] focus:outline-none">
              <option value="">All Classes</option>
              {CLASSES.map((className) => <option key={className} value={className}>{className}</option>)}
            </select>
            <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}
              className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--txt)] focus:outline-none">
              <option value="">All Sections</option>
              {SECTIONS.map((section) => <option key={section} value={section}>{section}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'all' | 'paid' | 'partial' | 'overdue')}
              className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--txt)] focus:outline-none">
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--txt3)]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Student Name..."
                className="pl-9 pr-4 py-2 bg-[var(--bg3)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--txt)]" />
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Class & Section</th>
                <th>Total Fee</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th className="text-right">Manage</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-[var(--txt3)]">Loading...</td></tr>
              ) : filtered.map((fee) => {
                const cfg = STATUS_CONFIG[fee.status];
                const Icon = cfg.icon;
                return (
                  <tr key={fee.id} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="av w-8 h-8 bg-[var(--bg3)] text-[var(--txt)] text-xs font-bold">{fee.student[0]}</div>
                        <span className="font-semibold text-[var(--txt)]">{fee.student}</span>
                      </div>
                    </td>
                    <td className="mono text-[var(--txt2)] text-xs">{fee.classId} - {fee.section}</td>
                    <td className="font-semibold text-[var(--txt)]">Rs {fee.amount.toLocaleString()}</td>
                    <td className="text-emerald-400 font-semibold">Rs {fee.paid.toLocaleString()}</td>
                    <td className="text-rose-400 font-semibold">Rs {(fee.amount - fee.paid).toLocaleString()}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
                        <Icon className="w-3 h-3" />{cfg.label}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(fee)} title="Edit fee / override"
                          className="btn btn-ghost p-1.5 text-[var(--accent)] hover:bg-[var(--accent)]/10">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-[var(--txt3)]">No students match the filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showClassFee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm">
             <div className="card-header border-b border-[var(--border)] pb-3">
               <div className="card-title">Set Class Fee</div>
               <button onClick={() => setShowClassFee(false)} className="btn btn-ghost p-1.5" disabled={saving}><X className="w-4 h-4" /></button>
             </div>
             <div className="card-body p-5 space-y-4">
               <div>
                 <label className="text-xs font-semibold text-[var(--txt2)] block mb-1.5">Select Class</label>
                 <select value={classFeeTarget} onChange={(e) => setClassFeeTarget(e.target.value)} className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none">
                   <option value="">Choose Class...</option>
                   {CLASSES.map((className) => <option key={className} value={className}>{className}</option>)}
                 </select>
               </div>
               <div>
                  <label className="text-xs font-semibold text-[var(--txt2)] block mb-1.5">Total Fee Amount (Rs)</label>
                  <input type="number" value={classFeeAmount} onChange={(e) => setClassFeeAmount(e.target.value)}
                    placeholder="e.g. 15000" className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none" />
               </div>
             </div>
             <div className="flex p-4 border-t border-[var(--border)] gap-3 bg-[var(--bg2)] rounded-b-xl">
                <button onClick={() => setShowClassFee(false)} className="flex-1 px-4 py-2 rounded-xl bg-[var(--bg3)] hover:bg-[var(--border)] text-sm font-semibold transition-all">Cancel</button>
                <button onClick={() => void handleSetClassFee()} disabled={!classFeeTarget || !classFeeAmount || saving} className="flex-1 px-4 py-2 rounded-xl bg-[var(--accent)] text-black font-bold text-sm disabled:opacity-50 transition-all">Apply to Class</button>
             </div>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <div className="av w-9 h-9 bg-[var(--accent)]/10 text-[var(--accent)]"><DollarSign className="w-5 h-5" /></div>
                <div>
                  <div className="card-title">Manage Student Fee</div>
                  <div className="card-sub">{editTarget.student} - {editTarget.classId}</div>
                </div>
              </div>
              <button onClick={() => setEditTarget(null)} className="btn btn-ghost p-1.5" disabled={saving}><X className="w-4 h-4" /></button>
            </div>

            <div className="card-body space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">Override Total Fee (Rs)</label>
                <input type="number" value={editTotalFee} onChange={(e) => setEditTotalFee(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">Amount Paid (Rs)</label>
                <input type="number" value={editPaid} onChange={(e) => setEditPaid(e.target.value)}
                  min={0} placeholder="e.g. 6000"
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
              </div>
              <div className="bg-[var(--bg3)] rounded-xl px-4 py-3 text-sm space-y-1">
                <div className="flex justify-between text-[var(--txt2)]"><span>Total Fee</span><span className="font-semibold text-[var(--txt)]">Rs {(Number(editTotalFee) || 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-[var(--txt2)]"><span>Amount Paid</span><span className="font-semibold text-emerald-400">Rs {(Number(editPaid) || 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-[var(--txt2)]"><span>Balance</span><span className="font-semibold text-rose-400">Rs {Math.max((Number(editTotalFee) || 0) - (Number(editPaid) || 0), 0).toLocaleString()}</span></div>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3 justify-end border-t border-[var(--border)] mt-2">
              <button onClick={() => setEditTarget(null)} className="btn btn-ghost px-5 py-2.5" disabled={saving}>Cancel</button>
              <button onClick={() => void handleSave()} disabled={saving}
                className="flex items-center gap-2 bg-[var(--accent)] text-black font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all text-sm disabled:opacity-50">
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
