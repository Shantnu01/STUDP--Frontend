import { useEffect, useState } from 'react';
import { Search, BookOpen, Mail, Phone, Plus, X, Save, UserRound, Edit, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { TEACHER_MOCK_DATA } from '@/lib/mockData';

interface Teacher {
  id: string;
  name: string;
  subject: string;
  classes: string[];
  email: string;
  phone: string;
  status: 'active' | 'on-leave' | 'inactive';
  gender: string;
}

interface TeacherInput {
  id?: string;
  name?: string;
  subject?: string;
  classes?: string[];
  classesRaw?: string;
  email?: string;
  phone?: string;
  status?: string;
  gender?: string;
}

interface TeachersResponse {
  teachers?: TeacherInput[];
  teacher?: TeacherInput;
}

type FormState = {
  name: string;
  subject: string;
  email: string;
  phone: string;
  gender: string;
  classesRaw: string;
  status: 'active' | 'on-leave' | 'inactive';
};

const EMPTY_FORM: FormState = {
  name: '',
  subject: '',
  email: '',
  phone: '',
  gender: 'Male',
  classesRaw: '',
  status: 'active',
};

const STATUS_OPTS: ('active' | 'on-leave' | 'inactive')[] = ['active', 'on-leave', 'inactive'];
const ENABLE_DEMO_FALLBACK = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_DATA === 'true';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function normalizeTeacher(teacher: TeacherInput, index: number): Teacher {
  return {
    id: teacher.id || `teacher-${index}`,
    name: teacher.name || 'Unnamed Teacher',
    subject: teacher.subject || '',
    classes: Array.isArray(teacher.classes)
      ? teacher.classes
      : teacher.classesRaw
        ? teacher.classesRaw.split(',').map((item) => item.trim()).filter(Boolean)
        : [],
    email: teacher.email || '',
    phone: teacher.phone || '',
    status: teacher.status === 'inactive' || teacher.status === 'on-leave' ? teacher.status : 'active',
    gender: teacher.gender || 'Male',
  };
}

function sortTeachers(items: Teacher[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

const SAMPLE_TEACHERS = sortTeachers(TEACHER_MOCK_DATA.map((teacher, index) => normalizeTeacher(teacher, index)));

export default function Teachers() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'active' | 'on-leave' | 'inactive'>('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Teacher | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const fetchTeachers = async (showErrorToast = false) => {
    setLoading(true);

    try {
      const res = await api.get<TeachersResponse>('/api/teachers');
      const raw = Array.isArray(res.data?.teachers) ? res.data.teachers : [];
      setTeachers(sortTeachers(raw.map((teacher, index) => normalizeTeacher(teacher, index))));
    } catch (error) {
      if (ENABLE_DEMO_FALLBACK) {
        setTeachers(SAMPLE_TEACHERS);
      } else {
        setTeachers([]);
      }
      if (showErrorToast) {
        toast.error(getErrorMessage(error, 'Unable to load teachers right now.'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTeachers();
  }, []);

  const f = (key: keyof FormState, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const filtered = teachers.filter((teacher) => {
    const q = search.toLowerCase();
    const matchSearch = !q || teacher.name.toLowerCase().includes(q) || teacher.subject.toLowerCase().includes(q) || teacher.email.toLowerCase().includes(q);
    const matchStatus = !filterStatus || teacher.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const active = teachers.filter((teacher) => teacher.status === 'active').length;
  const onLeave = teachers.filter((teacher) => teacher.status === 'on-leave').length;

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (teacher: Teacher) => {
    setEditTarget(teacher);
    setForm({
      name: teacher.name,
      subject: teacher.subject,
      email: teacher.email,
      phone: teacher.phone,
      gender: teacher.gender,
      classesRaw: teacher.classes.join(', '),
      status: teacher.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.email.trim()) {
      toast.error('Name, subject, and email are required');
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name,
      subject: form.subject,
      email: form.email,
      phone: form.phone,
      gender: form.gender,
      classesRaw: form.classesRaw,
      status: form.status,
    };

    try {
      if (editTarget) {
        await api.patch('/api/teachers/' + editTarget.id, payload);
        toast.success('Teacher updated successfully');
      } else {
        await api.post('/api/teachers', payload);
        toast.success('Teacher added successfully');
      }

      setShowModal(false);
      setEditTarget(null);
      setForm({ ...EMPTY_FORM });
      await fetchTeachers();
    } catch (error) {
      toast.error(getErrorMessage(error, editTarget ? 'Failed to update teacher' : 'Failed to add teacher'));
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = (value: string) => value === 'on-leave' ? 'On Leave' : value.charAt(0).toUpperCase() + value.slice(1);
  const statusCls = (value: string) =>
    value === 'active' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
      : value === 'on-leave' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20'
        : 'text-gray-400 bg-gray-400/10 border-gray-400/20';

  return (
    <div className="space-y-6 animate-element animate-delay-100">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
          <p className="text-[var(--txt2)] mt-1">Manage your school&apos;s teaching staff.</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-[var(--accent)] text-black font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[var(--accent)]/20 self-start text-sm">
          <Plus className="w-4 h-4" /> Add Teacher
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="mc"><div className="mc-label">Total</div><div className="mc-value">{teachers.length}</div><div className="mc-delta up">Full faculty</div></div>
        <div className="mc"><div className="mc-label">Active</div><div className="mc-value">{active}</div><div className="mc-delta up">Present</div></div>
        <div className="mc"><div className="mc-label">On Leave</div><div className="mc-value">{onLeave}</div><div className="mc-delta dn">Temporary</div></div>
        <div className="mc"><div className="mc-label">Subjects</div><div className="mc-value">{new Set(teachers.map((teacher) => teacher.subject)).size}</div><div className="mc-delta up">All mandatory</div></div>
      </div>

      <div className="card">
        <div className="card-header flex-wrap gap-3">
          <div>
            <div className="card-title">All Teachers</div>
            <div className="card-sub">{filtered.length} staff members</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as '' | 'active' | 'on-leave' | 'inactive')}
              className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
              <option value="">All Status</option>
              {STATUS_OPTS.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--txt3)]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teacher or subject..."
                className="pl-9 pr-4 py-2 bg-[var(--bg3)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--txt)]" />
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Subject</th>
                <th>Classes</th>
                <th>Contact</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center text-[var(--txt3)]">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-[var(--txt3)]">No teachers found.</td></tr>
              ) : filtered.map((teacher) => (
                <tr key={teacher.id} className="group">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="av w-9 h-9 bg-emerald-500/10 text-emerald-400 text-sm font-bold cursor-pointer"
                        title="Open direct message"
                        onClick={() => navigate(`/principal/chat?contactId=teacher${teacher.id}`)}>
                        {teacher.name.split(' ').map((word) => word[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--txt)]">{teacher.name}</p>
                        <p className="text-[11px] text-[var(--txt3)]">{teacher.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 text-[var(--txt2)]">
                      <BookOpen className="w-4 h-4 text-[var(--accent)]" />
                      <span className="text-sm">{teacher.subject}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {teacher.classes.length === 0 ? <span className="text-xs text-[var(--txt3)]">No classes assigned</span> : teacher.classes.map((className) => (
                        <span key={className} className="text-xs font-medium px-2 py-0.5 bg-[var(--bg3)] rounded-md text-[var(--txt2)] mono">{className}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-[var(--txt2)]"><Mail className="w-3 h-3" /> {teacher.email || '--'}</div>
                      <div className="flex items-center gap-1.5 text-xs text-[var(--txt2)]"><Phone className="w-3 h-3" /> {teacher.phone || '--'}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusCls(teacher.status)}`}>
                      {statusLabel(teacher.status)}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => navigate(`/principal/chat?contactId=teacher${teacher.id}`)} title="Send message"
                        className="btn btn-ghost p-1.5 hover:text-[var(--accent)]" >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openEdit(teacher)} title="Edit teacher"
                        className="btn btn-ghost p-1.5 text-[var(--accent)] hover:bg-[var(--accent)]/10">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <div className="av w-9 h-9 bg-emerald-500/10 text-emerald-400"><UserRound className="w-5 h-5" /></div>
                <div>
                  <div className="card-title">{editTarget ? 'Edit Teacher' : 'Add New Teacher'}</div>
                  <div className="card-sub">{editTarget ? `Editing ${editTarget.name}` : "Fill in the teacher's details below"}</div>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost p-1.5" disabled={saving}><X className="w-4 h-4" /></button>
            </div>

            <div className="card-body space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">Full Name *</label>
                <input value={form.name} onChange={(e) => f('name', e.target.value)} placeholder="e.g. Dr. Anita Rao"
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">Subject *</label>
                  <input value={form.subject} onChange={(e) => f('subject', e.target.value)} placeholder="e.g. Mathematics"
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">Gender</label>
                  <select value={form.gender} onChange={(e) => f('gender', e.target.value)}
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">Email *</label>
                  <input value={form.email} onChange={(e) => f('email', e.target.value)} type="email" placeholder="teacher@school.edu"
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">Phone</label>
                  <input value={form.phone} onChange={(e) => f('phone', e.target.value)} placeholder="+91 98765 00000"
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">Assigned Classes</label>
                <input value={form.classesRaw} onChange={(e) => f('classesRaw', e.target.value)} placeholder="e.g. 10-A, 11-B, 12-C (comma-separated)"
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">Status</label>
                <select value={form.status} onChange={(e) => f('status', e.target.value)}
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                  <option value="active">Active</option>
                  <option value="on-leave">On Leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3 justify-end border-t border-[var(--border)] mt-2">
              <button onClick={() => setShowModal(false)} className="btn btn-ghost px-5 py-2.5" disabled={saving}>Cancel</button>
              <button onClick={handleSave} disabled={!form.name.trim() || !form.subject.trim() || !form.email.trim() || saving}
                className="flex items-center gap-2 bg-[var(--accent)] text-black font-bold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Add Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
