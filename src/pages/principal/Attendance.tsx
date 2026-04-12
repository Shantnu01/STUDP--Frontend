import { useEffect, useMemo, useState } from 'react';
import { Users, GraduationCap, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { STAFF_MOCK_DATA, STUDENT_MOCK_DATA, TEACHER_MOCK_DATA } from '@/lib/mockData';

type PersonType = 'students' | 'teachers' | 'staff';

interface Person {
  id: string;
  name: string;
  meta: string;
  type: PersonType;
  classId?: string;
  section?: string;
  presentDays: number;
  totalWorkingDays: number;
}

interface StudentInput {
  id?: string;
  name?: string;
  classId?: string;
  section?: string;
}

interface TeacherInput {
  id?: string;
  name?: string;
  subject?: string;
}

interface StaffInput {
  id?: string;
  name?: string;
  work?: string;
}

interface SummaryResponse {
  counts?: Record<string, { presentDays?: number; totalWorkingDays?: number }>;
}

const TAB_ICONS: Record<PersonType, React.ElementType> = {
  students: GraduationCap,
  teachers: UserRound,
  staff: Users,
};

const CLASSES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'];
const SECTIONS = ['A','B','C','D','E'];
const ENABLE_DEMO_FALLBACK = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_DATA === 'true';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function applyCounts(people: Person[], counts: Record<string, { presentDays?: number; totalWorkingDays?: number }> = {}) {
  return people.map((person) => ({
    ...person,
    presentDays: counts[person.id]?.presentDays ?? 0,
    totalWorkingDays: counts[person.id]?.totalWorkingDays ?? 0,
  }));
}

function buildStudentPeople(students: StudentInput[]) {
  return students.map((student, index) => ({
    id: student.id || `student-${index}`,
    name: student.name || 'Unnamed Student',
    meta: `${student.classId || '--'} · ${student.section || '--'}`,
    type: 'students' as const,
    classId: student.classId || '',
    section: student.section || '',
    presentDays: 0,
    totalWorkingDays: 0,
  }));
}

function buildTeacherPeople(teachers: TeacherInput[]) {
  return teachers.map((teacher, index) => ({
    id: teacher.id || `teacher-${index}`,
    name: teacher.name || 'Unnamed Teacher',
    meta: teacher.subject || '--',
    type: 'teachers' as const,
    presentDays: 0,
    totalWorkingDays: 0,
  }));
}

function buildStaffPeople(staff: StaffInput[]) {
  return staff.map((member, index) => ({
    id: member.id || `staff-${index}`,
    name: member.name || 'Unnamed Staff Member',
    meta: member.work || '--',
    type: 'staff' as const,
    presentDays: 0,
    totalWorkingDays: 0,
  }));
}

const FALLBACK_STUDENTS = buildStudentPeople(STUDENT_MOCK_DATA);
const FALLBACK_TEACHERS = buildTeacherPeople(TEACHER_MOCK_DATA);
const FALLBACK_STAFF = buildStaffPeople(STAFF_MOCK_DATA);

export default function Attendance() {
  const [tabPeople, setTabPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<PersonType>('students');
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  
  type StatusRecord = Record<string, 'present' | 'absent'>;
  const [persistedState, setPersistedState] = useState<{ teachers: StatusRecord, staff: StatusRecord }>({ teachers: {}, staff: {} });
  const [editBuffer, setEditBuffer] = useState<{ teachers: StatusRecord, staff: StatusRecord }>({ teachers: {}, staff: {} });
  const [isEditMode, setIsEditMode] = useState(false);

  const fetchDailyState = async () => {
    try {
      const activeDate = new Date().toISOString().split('T')[0];
      const [teachersRes, staffRes] = await Promise.all([
        api.get(`/api/attendance`, { params: { classId: 'teachers', date: activeDate } }),
        api.get(`/api/attendance`, { params: { classId: 'staff', date: activeDate } })
      ]);
      
      const teacherStatuses = teachersRes.data?.attendance?.statuses ?? {};
      const staffStatuses = staffRes.data?.attendance?.statuses ?? {};
      
      const newState = { teachers: teacherStatuses, staff: staffStatuses };
      setPersistedState(newState);
      setEditBuffer(newState);
      
      if (Object.keys(teacherStatuses).length === 0 && Object.keys(staffStatuses).length === 0) {
        setIsEditMode(true);
      } else {
        setIsEditMode(false);
      }
    } catch (err) {
      console.warn('[Attendance] Could not load daily state:', err)
    }
  };

  useEffect(() => {
    void fetchDailyState();
  }, []);

  const loadTabData = async (showErrorToast = false) => {
    setLoading(true);
    try {
      let countsMap = {};
      const countsRes = await api.get<SummaryResponse>('/api/attendance/summary', { params: { scope: activeTab } });
      countsMap = countsRes.data?.counts ?? {};

      if (activeTab === 'students') {
        const res = await api.get<{ students?: StudentInput[] }>('/api/students', { params: { classId: filterClass, section: filterSection } });
        setTabPeople(applyCounts(buildStudentPeople(res.data.students ?? []), countsMap));
      } else if (activeTab === 'teachers') {
        const res = await api.get<{ teachers?: TeacherInput[] }>('/api/teachers');
        setTabPeople(applyCounts(buildTeacherPeople(res.data.teachers ?? []), countsMap));
      } else {
        const res = await api.get<{ staff?: StaffInput[] }>('/api/staff');
        setTabPeople(applyCounts(buildStaffPeople(res.data.staff ?? []), countsMap));
      }
    } catch (error) {
      if (ENABLE_DEMO_FALLBACK) {
        if (activeTab === 'students') {
          let list = FALLBACK_STUDENTS;
          if (filterClass) list = list.filter(p => p.classId === filterClass);
          if (filterSection) list = list.filter(p => p.section === filterSection);
          setTabPeople(list);
        } else if (activeTab === 'teachers') setTabPeople(FALLBACK_TEACHERS);
        else setTabPeople(FALLBACK_STAFF);
      } else {
        setTabPeople([]);
      }
      if (showErrorToast) toast.error(getErrorMessage(error, 'Unable to load attendance data right now.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTabData();
  }, [activeTab, filterClass, filterSection]);

  const markLocally = (id: string, status: 'present' | 'absent') => {
    if (!isEditMode) return;
    if (activeTab === 'students') return;
    
    setEditBuffer(prev => ({
      ...prev,
      [activeTab as 'teachers'|'staff']: {
        ...prev[activeTab as 'teachers'|'staff'],
        [id]: status
      }
    }));
  };

  const handleSaveAttendance = async () => {
    const teacherUpdates = Object.keys(editBuffer.teachers).length > 0 ? {
      scope: 'teachers',
      statuses: editBuffer.teachers
    } : null;

    const staffUpdates = Object.keys(editBuffer.staff).length > 0 ? {
      scope: 'staff',
      statuses: editBuffer.staff
    } : null;

    const updates = [teacherUpdates, staffUpdates].filter(Boolean);

    if (updates.length === 0) {
      toast.error('No attendance changes to save.');
      return;
    }

    setBusy(true);
    try {
      const activeDate = new Date().toISOString().split('T')[0];
      await api.post('/api/attendance/summary/batch-save', {
        activeDate,
        updates,
      });
      
      const totalRecords = updates.reduce((acc, curr) => acc + Object.keys(curr!.statuses).length, 0);
      toast.success(`${totalRecords} records saved globally.`);
      
      setPersistedState(editBuffer);
      setIsEditMode(false);
      await loadTabData();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to save attendance'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 animate-element animate-delay-100">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-[var(--txt2)] mt-1">Present Days / Total Working Days.</p>
        </div>
        {activeTab !== 'students' && (
          isEditMode ? (
            <button onClick={() => void handleSaveAttendance()} disabled={busy || loading} 
              className="px-5 py-2.5 bg-[var(--accent)] text-black font-bold rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[var(--accent)]/20 transition-all">
              {busy ? 'Saving...' : 'Save Attendance'}
            </button>
          ) : (
            <button onClick={() => setIsEditMode(true)} disabled={busy || loading} 
              className="px-5 py-2.5 bg-[var(--bg3)] text-[var(--txt)] border border-[var(--border)] hover:bg-[var(--bg4)] font-bold rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              Edit Attendance
            </button>
          )
        )}
      </header>

      <div className="flex gap-1 bg-[var(--bg2)] border border-[var(--border)] p-1 rounded-xl w-fit">
        {(['students', 'teachers', 'staff'] as PersonType[]).map((tab) => {
          const Icon = TAB_ICONS[tab];
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize
                ${activeTab === tab ? 'bg-[var(--accent)] text-black shadow' : 'text-[var(--txt2)] hover:text-[var(--txt)]'}`}>
              <Icon className="w-4 h-4" />{tab}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {activeTab === 'students' && (
          <>
            <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
              className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--txt)]">
              <option value="">All Classes</option>
              {CLASSES.map((className) => <option key={className} value={className}>{className}</option>)}
            </select>
            <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}
              className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--txt)]">
              <option value="">All Sections</option>
              {SECTIONS.map((section) => <option key={section} value={section}>{section}</option>)}
            </select>
          </>
        )}
      </div>

      <div className="card">
        <div className="card-header items-center">
          <div>
            <div className="card-title capitalize">{activeTab}</div>
            <div className="card-sub">{tabPeople.length} people</div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>{activeTab === 'students' ? 'Class & Section' : 'Role'}</th>
                {activeTab !== 'students' && (
                  <th className="text-center">Action</th>
                )}
                <th className="text-center">Attendance Ratio</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center p-8 text-[var(--txt3)]">Loading...</td>
                </tr>
              ) : tabPeople.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-8 text-[var(--txt3)]">No records found.</td>
                </tr>
              ) : (
                tabPeople.map((person) => (
                  <tr key={person.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="av w-8 h-8 bg-[var(--bg3)] text-[var(--txt)] text-xs font-bold">{person.name[0]}</div>
                        <span className="font-semibold text-[var(--txt)]">{person.name}</span>
                      </div>
                    </td>
                    <td className="text-[var(--txt2)] text-xs mono">{person.meta}</td>
                    
                    {activeTab !== 'students' && (() => {
                      const scope = activeTab as 'teachers' | 'staff';
                      const activeState = (isEditMode ? editBuffer : persistedState)[scope];
                      const currentStatus = activeState[person.id];
                      
                      return (
                        <td>
                          <div className="flex justify-center gap-2">
                            <button onClick={() => markLocally(person.id, 'present')} disabled={busy || !isEditMode}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:cursor-not-allowed border
                                ${currentStatus === 'present' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-[var(--bg3)] text-[var(--txt3)] border-[var(--border)] hover:text-[var(--txt)]'}
                                ${!isEditMode && currentStatus !== 'present' ? 'opacity-30' : ''}`}>
                              Present
                            </button>
                            <button onClick={() => markLocally(person.id, 'absent')} disabled={busy || !isEditMode}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:cursor-not-allowed border
                                ${currentStatus === 'absent' ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-[var(--bg3)] text-[var(--txt3)] border-[var(--border)] hover:text-[var(--txt)]'}
                                ${!isEditMode && currentStatus !== 'absent' ? 'opacity-30' : ''}`}>
                              Absent
                            </button>
                          </div>
                        </td>
                      );
                    })()}
                    
                    <td>
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold mono text-[var(--accent)]">
                          {person.presentDays} / {person.totalWorkingDays}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
