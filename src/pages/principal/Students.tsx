import { useEffect, useState } from 'react';
import { Plus, Search, Edit, X, Save, User, Download } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { STUDENT_MOCK_DATA } from '@/lib/mockData';
import { exportCSV } from '@/lib/utils';

interface Student {
  id: string;
  studentId: string;
  name: string;
  rollNo: string;
  classId: string;
  section: string;
  gender: string;
  phone: string;
  status: 'active' | 'inactive';
  parentName?: string;
}

interface FormState {
  name: string;
  rollNo: string;
  classId: string;
  section: string;
  gender: string;
  phone: string;
  status: 'active' | 'inactive';
  parentName: string;
}

interface StudentInput {
  id?: string;
  studentId?: string;
  name?: string;
  rollNo?: string;
  classId?: string;
  section?: string;
  gender?: string;
  phone?: string;
  status?: string;
  parentName?: string;
}

interface StudentResponse {
  student?: StudentInput;
  students?: StudentInput[];
}

const EMPTY_FORM: FormState = {
  name: '',
  rollNo: '',
  classId: '',
  section: '',
  gender: 'Male',
  phone: '',
  status: 'active',
  parentName: '',
};

const CLASSES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'] as const;
const SECTIONS = ['A','B','C','D','E'] as const;
const ENABLE_DEMO_FALLBACK = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_DATA === 'true';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getGradeRank(value: string = '') {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function sortStudents(items: Student[]) {
  return [...items].sort((a, b) =>
    getGradeRank(a.classId) - getGradeRank(b.classId) ||
    a.classId.localeCompare(b.classId) ||
    (a.section || '').localeCompare(b.section || '') ||
    a.name.localeCompare(b.name)
  );
}

function genStudentId(index: number): string {
  return `STU-${new Date().getFullYear()}-${String(index).padStart(5, '0')}`;
}

function normalizeStudent(student: StudentInput, index: number): Student {
  return {
    id: student.id || `student-${index}`,
    studentId: student.studentId || genStudentId(index + 1),
    name: student.name || 'Unnamed Student',
    rollNo: student.rollNo || '',
    classId: student.classId || '',
    section: student.section || '',
    gender: student.gender || 'Male',
    phone: student.phone || '',
    status: student.status === 'inactive' ? 'inactive' : 'active',
    parentName: student.parentName || '',
  };
}

const SAMPLE = sortStudents(STUDENT_MOCK_DATA.map((student, index) => normalizeStudent(student, index)));

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'active' | 'inactive'>('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const fetchStudents = async (showErrorToast = false) => {
    setLoading(true);

    try {
      const res = await api.get<StudentResponse>('/api/students');
      const data = Array.isArray(res.data?.students) ? res.data.students : [];
      const normalized = sortStudents(data.map((student, index) => normalizeStudent(student, index)));
      setStudents(normalized);
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to load students right now.');
      if (ENABLE_DEMO_FALLBACK) {
        setStudents(SAMPLE);
      } else {
        setStudents([]);
      }
      if (showErrorToast) {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStudents();
  }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (student: Student) => {
    setEditTarget(student);
    setForm({
      name: student.name,
      rollNo: student.rollNo,
      classId: student.classId,
      section: student.section,
      gender: student.gender || 'Male',
      phone: student.phone || '',
      status: student.status,
      parentName: student.parentName || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.rollNo.trim()) {
      toast.error('Name and Roll No are required');
      return;
    }
    if (!form.classId) {
      toast.error('Please select a class');
      return;
    }
    if (!form.section) {
      toast.error('Please select a section');
      return;
    }

    setSaving(true);
    try {
      if (editTarget) {
        await api.patch<StudentResponse>(`/api/students/${editTarget.id}`, form);
        toast.success('Student updated successfully');
      } else {
        await api.post<StudentResponse>('/api/students', form);
        toast.success('Student added successfully');
      }

      setShowModal(false);
      setEditTarget(null);
      setForm({ ...EMPTY_FORM });
      await fetchStudents();
    } catch (error) {
      toast.error(getErrorMessage(error, editTarget ? 'Failed to update student' : 'Failed to add student'));
    } finally {
      setSaving(false);
    }
  };

  const f = (key: keyof FormState, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const filtered = students.filter((student) => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q ||
      student.name.toLowerCase().includes(q) ||
      student.rollNo.includes(q) ||
      student.studentId.toLowerCase().includes(q) ||
      student.phone.includes(q) ||
      student.status.toLowerCase().includes(q) ||
      student.classId.toLowerCase().includes(q);
    const matchClass = !filterClass || student.classId === filterClass;
    const matchSection = !filterSection || student.section === filterSection;
    const matchStatus = !filterStatus || student.status === filterStatus;
    return matchSearch && matchClass && matchSection && matchStatus;
  });

  const sel = <T extends string>(val: T, set: (value: T) => void, opts: readonly T[] | readonly string[], placeholder: string) => (
    <select
      value={val}
      onChange={(e) => set(e.target.value as T)}
      className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
    >
      <option value="">{placeholder}</option>
      {opts.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );

  return (
    <div className="space-y-6 animate-element animate-delay-100">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-[var(--txt2)] mt-1">Manage student records and enrollments.</p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <button
            onClick={() => exportCSV(
              filtered.map(s => ({
                Name: s.name, ID: s.studentId, Roll: s.rollNo,
                Class: s.classId, Section: s.section, Gender: s.gender,
                Phone: s.phone, Status: s.status
              })),
              'EduSync_Students.csv'
            )}
            className="flex items-center gap-2 bg-[var(--bg3)] border border-[var(--border)] text-[var(--txt)] font-bold px-4 py-2.5 rounded-xl hover:bg-[var(--bg4)] transition-all text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-[var(--accent)] text-black font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[var(--accent)]/20 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="mc"><div className="mc-label">Total</div><div className="mc-value">{students.length}</div></div>
        <div className="mc"><div className="mc-label">Active</div><div className="mc-value">{students.filter((student) => student.status === 'active').length}</div></div>
        <div className="mc"><div className="mc-label">Inactive</div><div className="mc-value">{students.filter((student) => student.status === 'inactive').length}</div></div>
        <div className="mc"><div className="mc-label">Classes</div><div className="mc-value">{new Set(students.map((student) => student.classId)).size}</div></div>
      </div>

      <div className="card">
        <div className="card-header flex-wrap gap-3">
          <div>
            <div className="card-title">All Students</div>
            <div className="card-sub">{filtered.length} records</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sel(filterClass, setFilterClass, CLASSES, 'All Classes')}
            {sel(filterSection, setFilterSection, SECTIONS, 'All Sections')}
            {sel(filterStatus, setFilterStatus, ['active', 'inactive'], 'All Status')}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--txt3)]" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name, ID, phone, roll no..."
                className="pl-9 pr-4 py-2 bg-[var(--bg3)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--txt)]"
              />
            </div>
            {(filterClass || filterSection || filterStatus || searchTerm) && (
              <button
                onClick={() => { setFilterClass(''); setFilterSection(''); setFilterStatus(''); setSearchTerm(''); }}
                className="text-xs text-[var(--txt3)] hover:text-[var(--red)] flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Student ID</th>
                <th>Roll No</th>
                <th>Class</th>
                <th>Section</th>
                <th>Gender</th>
                <th>Parent's</th>
                <th>Phone</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="p-12 text-center text-[var(--txt3)]">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="p-12 text-center text-[var(--txt3)]">No students match the current filters.</td></tr>
              ) : filtered.map((student) => (
                <tr key={student.id} className="group">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="av w-8 h-8 bg-[var(--bg3)] text-[var(--txt)] text-xs font-bold">
                        {student.name[0]}
                      </div>
                      <span className="font-semibold text-[var(--txt)]">{student.name}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--accent)', background: 'rgba(110,231,183,.08)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(110,231,183,.15)', whiteSpace: 'nowrap' }}>
                      {student.studentId || '--'}
                    </span>
                  </td>
                  <td className="mono text-[var(--txt2)] text-xs">{student.rollNo}</td>
                  <td className="text-[var(--txt)]">{student.classId}</td>
                  <td className="text-[var(--txt2)]">{student.section || '--'}</td>
                  <td className="text-[var(--txt2)] text-sm">{student.gender || '--'}</td>
                  <td className="text-[var(--txt)] text-sm">{student.parentName || '--'}</td>
                  <td className="text-[var(--txt2)] text-xs mono">{student.phone || '--'}</td>
                  <td>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${student.status === 'active' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}>
                      {student.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(student)}
                        className="btn btn-ghost p-1.5 text-[var(--accent)] hover:bg-[var(--accent)]/10"
                        title="Edit student"
                      >
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
                <div className="av w-9 h-9 bg-[var(--accent)]/10 text-[var(--accent)]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="card-title">{editTarget ? 'Edit Student' : 'Add New Student'}</div>
                  <div className="card-sub">{editTarget ? `Editing ${editTarget.name}` : 'Fill in the student details below'}</div>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost p-1.5" disabled={saving}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="card-body space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">Full Name *</label>
                <input value={form.name} onChange={(e) => f('name', e.target.value)} placeholder="e.g. Anya Mehta"
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">Roll No *</label>
                  <input value={form.rollNo} onChange={(e) => f('rollNo', e.target.value)} placeholder="e.g. 001"
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
                  <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">Class *</label>
                  <select value={form.classId} onChange={(e) => f('classId', e.target.value)}
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                    <option value="">Select class...</option>
                    {CLASSES.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">Section *</label>
                  <select value={form.section} onChange={(e) => f('section', e.target.value)}
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                    <option value="">Select...</option>
                    {SECTIONS.map((section) => <option key={section} value={section}>{section}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">Parent Phone</label>
                  <input value={form.phone} onChange={(e) => f('phone', e.target.value)} placeholder="+91 98765 00000"
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">Status</label>
                  <select value={form.status} onChange={(e) => f('status', e.target.value)}
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--txt2)] mb-1.5 block">Parent&apos;s Name</label>
                <input value={form.parentName} onChange={(e) => f('parentName', e.target.value)} placeholder="e.g. Rahul Mehta"
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3 justify-end border-t border-[var(--border)] mt-2">
              <button onClick={() => setShowModal(false)} className="btn btn-ghost px-5 py-2.5" disabled={saving}>Cancel</button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim() || !form.rollNo.trim() || saving}
                className="flex items-center gap-2 bg-[var(--accent)] text-black font-bold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
