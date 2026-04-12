import { useEffect, useState } from 'react';
import { Plus, Search, Edit, X, Save, Trash2, Phone, MapPin, User } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { STAFF_MOCK_DATA } from '@/lib/mockData';

interface StaffMember {
  id: string;
  name: string;
  age: number;
  work: string;
  contact: string;
  address: string;
  email: string;
  status: 'active' | 'inactive';
}

interface FormState {
  name: string;
  age: string;
  work: string;
  contact: string;
  address: string;
  email: string;
  status: 'active' | 'inactive';
}

interface StaffInput {
  id?: string;
  name?: string;
  age?: number;
  work?: string;
  contact?: string;
  address?: string;
  email?: string;
  status?: string;
}

interface StaffResponse {
  staff?: StaffInput | StaffInput[];
}

const EMPTY_FORM: FormState = {
  name: '',
  age: '',
  work: '',
  contact: '',
  address: '',
  email: '',
  status: 'active',
};

const ENABLE_DEMO_FALLBACK = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_DATA === 'true';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function sortStaff(items: StaffMember[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeStaffMember(member: StaffInput, index: number): StaffMember {
  return {
    id: member.id || `staff-${index}`,
    name: member.name || 'Unnamed Staff Member',
    age: typeof member.age === 'number' ? member.age : 0,
    work: member.work || '',
    contact: member.contact || '',
    address: member.address || '',
    email: member.email || '',
    status: member.status === 'inactive' ? 'inactive' : 'active',
  };
}

const SAMPLE_STAFF = sortStaff(STAFF_MOCK_DATA.map((member, index) => normalizeStaffMember(member, index)));

export default function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'active' | 'inactive'>('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchStaff = async (showErrorToast = false) => {
    setLoading(true);

    try {
      const res = await api.get<StaffResponse>('/api/staff');
      const raw = Array.isArray(res.data?.staff)
        ? res.data.staff
        : res.data?.staff
          ? [res.data.staff]
          : [];
      setStaff(sortStaff(raw.map((member, index) => normalizeStaffMember(member, index))));
    } catch (error) {
      if (ENABLE_DEMO_FALLBACK) {
        setStaff(SAMPLE_STAFF);
      } else {
        setStaff([]);
      }
      if (showErrorToast) {
        toast.error(getErrorMessage(error, 'Unable to load staff right now.'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStaff();
  }, []);

  const f = (key: keyof FormState, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const filtered = staff.filter((member) => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q ||
      member.name.toLowerCase().includes(q) ||
      member.work.toLowerCase().includes(q) ||
      member.address.toLowerCase().includes(q) ||
      member.contact.includes(q);
    const matchStatus = !filterStatus || member.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditTarget(member);
    setForm({
      name: member.name,
      age: String(member.age || ''),
      work: member.work,
      contact: member.contact,
      address: member.address,
      email: member.email,
      status: member.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.work.trim()) {
      toast.error('Name and work are required');
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      age: Number(form.age) || 0,
    };

    try {
      if (editTarget) {
        await api.patch('/api/staff/' + editTarget.id, payload);
        toast.success('Staff member updated successfully');
      } else {
        await api.post('/api/staff', payload);
        toast.success('Staff member added successfully');
      }

      setShowModal(false);
      setEditTarget(null);
      setForm({ ...EMPTY_FORM });
      await fetchStaff();
    } catch (error) {
      toast.error(getErrorMessage(error, editTarget ? 'Failed to update staff member' : 'Failed to add staff member'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/staff/${id}`);
      toast.success('Staff member deleted successfully');
      setDeleteConfirm(null);
      await fetchStaff();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete staff member'));
    }
  };

  const inp = (label: string, key: keyof FormState, rest: Record<string, string | number> = {}) => (
    <div>
      <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">{label}</label>
      <input value={form[key]} onChange={(e) => f(key, e.target.value)}
        className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        {...rest} />
    </div>
  );

  return (
    <div className="space-y-6 animate-element animate-delay-100">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff</h1>
          <p className="text-[var(--txt2)] mt-1">Manage support staff, administrators, and non-teaching personnel.</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-[var(--accent)] text-black font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[var(--accent)]/20 self-start text-sm">
          <Plus className="w-4 h-4" /> Add Staff Member
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="mc"><div className="mc-label">Total Staff</div><div className="mc-value">{staff.length}</div></div>
        <div className="mc"><div className="mc-label">Active</div><div className="mc-value">{staff.filter((member) => member.status === 'active').length}</div></div>
        <div className="mc"><div className="mc-label">Inactive</div><div className="mc-value">{staff.filter((member) => member.status === 'inactive').length}</div></div>
        <div className="mc"><div className="mc-label">Roles</div><div className="mc-value">{new Set(staff.map((member) => member.work)).size}</div></div>
      </div>

      <div className="card">
        <div className="card-header flex-wrap gap-3">
          <div>
            <div className="card-title">All Staff</div>
            <div className="card-sub">{filtered.length} members</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as '' | 'active' | 'inactive')}
              className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--txt3)]" />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search name, role, address..."
                className="pl-9 pr-4 py-2 bg-[var(--bg3)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--txt)]" />
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Age</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-12 text-center text-[var(--txt3)]">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-[var(--txt3)]">No staff members found.</td></tr>
              ) : filtered.map((member) => (
                <tr key={member.id} className="group">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="av w-8 h-8 bg-[var(--bg3)] text-[var(--txt)] text-xs font-bold">{member.name[0]}</div>
                      <div>
                        <div className="font-semibold text-[var(--txt)]">{member.name}</div>
                        <div className="text-xs text-[var(--txt3)]">{member.email || '--'}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="text-sm text-[var(--accent)] font-semibold">{member.work}</span></td>
                  <td className="text-[var(--txt2)] text-sm">{member.age || '--'}</td>
                  <td>
                    <div className="flex items-center gap-1 text-xs text-[var(--txt2)]"><Phone className="w-3 h-3" /> {member.contact || '--'}</div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-xs text-[var(--txt2)]"><MapPin className="w-3 h-3 shrink-0" /> <span className="max-w-[140px] truncate">{member.address || '--'}</span></div>
                  </td>
                  <td>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${member.status === 'active' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}>
                      {member.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(member)} title="Edit" className="btn btn-ghost p-1.5 text-[var(--accent)] hover:bg-[var(--accent)]/10">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteConfirm(member.id)} title="Delete" className="btn btn-ghost p-1.5 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="text-center space-y-3">
              <div className="av w-12 h-12 bg-red-500/10 text-red-400 mx-auto"><Trash2 className="w-6 h-6" /></div>
              <div className="font-bold text-[var(--txt)]">Delete Staff Member?</div>
              <div className="text-sm text-[var(--txt2)]">This action cannot be undone.</div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-ghost flex-1">Cancel</button>
              <button onClick={() => void handleDelete(deleteConfirm)} className="btn btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <div className="av w-9 h-9 bg-[var(--accent)]/10 text-[var(--accent)]"><User className="w-5 h-5" /></div>
                <div>
                  <div className="card-title">{editTarget ? 'Edit Staff Member' : 'Add New Staff Member'}</div>
                  <div className="card-sub">{editTarget ? `Editing ${editTarget.name}` : 'Fill in the staff member details below'}</div>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost p-1.5" disabled={saving}><X className="w-4 h-4" /></button>
            </div>

            <div className="card-body space-y-4">
              {inp('Full Name *', 'name', { placeholder: 'e.g. Ramesh Pillai' })}
              <div className="grid grid-cols-2 gap-4">
                {inp('Role / Work *', 'work', { placeholder: 'e.g. Office Administrator' })}
                {inp('Age', 'age', { type: 'number', placeholder: 'e.g. 35', min: 18, max: 80 })}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {inp('Contact Number', 'contact', { placeholder: '+91 98700 00000' })}
                {inp('Email', 'email', { type: 'email', placeholder: 'staff@school.edu' })}
              </div>
              {inp('Address', 'address', { placeholder: 'e.g. 14 Palm St, Kochi' })}
              <div>
                <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">Status</label>
                <select value={form.status} onChange={(e) => f('status', e.target.value)}
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3 justify-end border-t border-[var(--border)] mt-2">
              <button onClick={() => setShowModal(false)} className="btn btn-ghost px-5 py-2.5" disabled={saving}>Cancel</button>
              <button onClick={handleSave} disabled={!form.name.trim() || !form.work.trim() || saving}
                className="flex items-center gap-2 bg-[var(--accent)] text-black font-bold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Add Staff Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
