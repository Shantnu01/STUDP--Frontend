import { useEffect, useMemo, useState } from 'react';
import { Search, Edit, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { STAFF_MOCK_DATA, TEACHER_MOCK_DATA } from '@/lib/mockData';

interface PaymentRecord {
  id: string;
  entityId: string;
  name: string;
  type: 'teacher' | 'staff';
  totalAmount: number;
  amountToBePaid: number;
  status: 'paid' | 'pending';
}

interface PaymentInput {
  id?: string;
  entityId?: string;
  name?: string;
  type?: 'teacher' | 'staff';
  totalAmount?: number;
  amountToBePaid?: number;
  status?: string;
}

interface PaymentsResponse {
  records?: PaymentInput[];
  record?: PaymentInput;
}

const ENABLE_DEMO_FALLBACK = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_DATA === 'true';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function normalizePayment(record: PaymentInput, index: number): PaymentRecord {
  return {
    id: record.id || `payment-${index}`,
    entityId: record.entityId || record.id || `entity-${index}`,
    name: record.name || 'Unnamed',
    type: record.type === 'staff' ? 'staff' : 'teacher',
    totalAmount: Math.max(record.totalAmount ?? (record.type === 'staff' ? 30000 : 50000), 0),
    amountToBePaid: Math.max(record.amountToBePaid ?? (record.type === 'staff' ? 30000 : 50000), 0),
    status: record.status === 'paid' ? 'paid' : 'pending',
  };
}

function sortRecords(records: PaymentRecord[]) {
  return [...records].sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
}

const FALLBACK_RECORDS = sortRecords([
  ...TEACHER_MOCK_DATA.map((teacher, index) => normalizePayment({
    id: `teacher:${teacher.id}`,
    entityId: teacher.id,
    name: teacher.name,
    type: 'teacher',
    totalAmount: 50000,
    amountToBePaid: 50000,
    status: 'pending',
  }, index)),
  ...STAFF_MOCK_DATA.map((member, index) => normalizePayment({
    id: `staff:${member.id}`,
    entityId: member.id,
    name: member.name,
    type: 'staff',
    totalAmount: 30000,
    amountToBePaid: 30000,
    status: 'pending',
  }, index + TEACHER_MOCK_DATA.length)),
]);

export default function Payments() {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'teacher' | 'staff'>('all');
  const [editTarget, setEditTarget] = useState<PaymentRecord | null>(null);
  const [form, setForm] = useState({ totalAmount: 0, amountToBePaid: 0, status: 'pending' as 'paid' | 'pending' });

  const loadRecords = async (showErrorToast = false) => {
    setLoading(true);
    try {
      const res = await api.get<PaymentsResponse>('/api/personnel-payments');
      const raw = Array.isArray(res.data?.records) ? res.data.records : [];
      setRecords(sortRecords(raw.map((record, index) => normalizePayment(record, index))));
    } catch (error) {
      if (ENABLE_DEMO_FALLBACK) {
        setRecords(FALLBACK_RECORDS);
      } else {
        setRecords([]);
      }
      if (showErrorToast) {
        toast.error(getErrorMessage(error, 'Unable to load payment records right now.'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRecords();
  }, []);

  const filtered = useMemo(() => records.filter((record) => {
    const matchSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || record.type === filterType;
    return matchSearch && matchType;
  }), [records, searchTerm, filterType]);

  const openEdit = (record: PaymentRecord) => {
    setEditTarget(record);
    setForm({ totalAmount: record.totalAmount, amountToBePaid: record.amountToBePaid, status: record.status });
  };

  const handleSave = async () => {
    if (!editTarget) return;

    setSaving(true);
    try {
      await api.patch(`/api/personnel-payments/${editTarget.type}/${editTarget.entityId}`, form);
      toast.success('Payment record updated successfully');
      setEditTarget(null);
      await loadRecords();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update payment record'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-element">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Staff Payments</h1>
        <p className="text-[var(--txt2)] mt-1">Track salaries and dues for the same live teacher and staff records used everywhere else.</p>
      </header>

      <div className="card">
        <div className="card-header flex-wrap gap-3">
          <div>
            <div className="card-title">Payment List</div>
            <div className="card-sub">{filtered.length} records found</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as 'all' | 'teacher' | 'staff')}
              className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--txt)]">
              <option value="all">All Roles</option>
              <option value="teacher">Teachers</option>
              <option value="staff">Staff</option>
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--txt3)]" />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search name..."
                className="pl-9 pr-4 py-2 bg-[var(--bg3)] border border-[var(--border)] rounded-xl text-sm text-[var(--txt)]" />
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Total Amount</th>
                <th>Amount to be Paid</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center text-[var(--txt3)]">Loading...</td></tr>
              ) : filtered.map((record) => (
                <tr key={record.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="av w-8 h-8 bg-[var(--bg3)] text-[var(--txt)] text-xs font-bold">{record.name[0]}</div>
                      <span className="font-semibold text-[var(--txt)]">{record.name}</span>
                    </div>
                  </td>
                  <td className="capitalize text-[var(--txt2)] text-sm">{record.type}</td>
                  <td className="font-semibold">Rs {record.totalAmount.toLocaleString()}</td>
                  <td className="text-amber-400 font-semibold">Rs {record.amountToBePaid.toLocaleString()}</td>
                  <td>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${record.status === 'paid' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-amber-400 bg-amber-400/10 border-amber-400/20'}`}>
                      {record.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end">
                      <button onClick={() => openEdit(record)} className="btn btn-ghost p-1.5 text-[var(--accent)]">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="p-12 text-center text-[var(--txt3)]">No payment records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <div className="card-header">
              <div className="card-title">Edit Payment: {editTarget.name}</div>
              <button onClick={() => setEditTarget(null)} className="btn btn-ghost p-1.5" disabled={saving}><X className="w-4 h-4" /></button>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--txt2)] block mb-1.5">Total Amount (Rs)</label>
                <input type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: Number(e.target.value) })}
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)]" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--txt2)] block mb-1.5">Amount to be Paid (Rs)</label>
                <input type="number" value={form.amountToBePaid} onChange={(e) => setForm({ ...form, amountToBePaid: Number(e.target.value) })}
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)]" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--txt2)] block mb-1.5">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'paid' | 'pending' })}
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)]">
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3 justify-end mt-2">
              <button onClick={() => setEditTarget(null)} className="btn btn-ghost" disabled={saving}>Cancel</button>
              <button onClick={() => void handleSave()} disabled={saving} className="bg-[var(--accent)] text-black font-bold px-5 py-2 rounded-xl text-sm disabled:opacity-50">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
