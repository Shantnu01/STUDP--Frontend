export type Plan = 'Institutional Starter' | 'Academy Pro' | 'Enterprise Excellence'
export type SchoolStatus = 'active' | 'overdue' | 'suspended'
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'failed'
export type RequestStatus = 'pending' | 'approved' | 'rejected'

export interface School {
  id: string
  name: string
  city: string
  plan: Plan
  students: number
  email: string
  phone: string
  status: SchoolStatus
  lastPayment: string
  notes?: string
  createdAt?: any
  updatedAt?: any
}

export interface Payment {
  id: string
  schoolId: string
  schoolName: string
  plan: Plan
  amount: number
  status: PaymentStatus
  date: string
  due?: string
  createdAt?: any
}

export interface Registration {
  id: string
  schoolName: string
  city: string
  plan: Plan
  students: number
  email: string
  phone?: string
  status: RequestStatus
  createdAt?: any
}

export interface Message {
  id: string
  text: string
  sender: 'admin' | 'school'
  senderEmail: string
  ts: any
}

export interface DashboardMetrics {
  mrr: number
  activeSchools: number
  pendingRequests: number
  overdueCount: number
  arr: number
  perSchool: number
  planSplit: Record<Plan, { count: number; revenue: number }>
}

// ── Teacher Domain Types ───────────────────────────────────────────────────

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'
export type AssignmentStatus = 'draft' | 'published' | 'closed'
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected'

export interface Teacher {
  id: string; uid: string; schoolId: string; name: string; email: string
  phone: string; subject: string; subjects: string[]; classes: string[]
  employeeId: string; qualification: string; joinDate: string
  role: 'teacher' | 'principal'; status: 'active' | 'inactive'
  avatar?: string; createdAt?: any; updatedAt?: any
}

export interface Student {
  id: string; schoolId: string; teacherId?: string; name: string; rollNo: string
  classId: string; section: string; dob: string; gender: 'male' | 'female' | 'other'
  parentName: string; parentPhone: string; parentEmail: string; address: string
  bloodGroup?: string; admissionNo: string; status: 'active' | 'inactive' | 'transferred'
  studentId?: string;
  createdAt?: any
}

export interface Mark {
  id: string; studentId: string; studentName: string; teacherId: string; schoolId: string
  subject: string; examType: 'Unit Test 1'|'Unit Test 2'|'Midterm'|'Final'|'Assignment'|'Project'|'Quiz'
  maxMarks: number; obtainedMarks: number; grade: string; remarks?: string; date: string
  class: string; createdAt?: any
}

export interface Attendance {
  id: string; studentId: string; studentName: string; teacherId: string; schoolId: string
  class: string; date: string; status: AttendanceStatus; remarks?: string
}

export interface Assignment {
  id: string; teacherId: string; schoolId: string; title: string; description: string
  subject: string; class: string; dueDate: string; maxMarks: number
  status: AssignmentStatus; attachmentUrl?: string; createdAt?: any; submissions?: number
}

export interface Announcement {
  id: string; teacherId: string; teacherName: string; schoolId: string
  title: string; body: string; targetAudience: 'all' | 'class' | 'teachers'
  targetClass?: string; pinned: boolean; createdAt?: any
}

export interface LeaveRequest {
  id: string
  user_id: string
  user_name: string
  role: string
  school_id: string
  leave_type: 'sick' | 'casual' | 'earned' | 'emergency' | 'other'
  start_date: string
  end_date: string
  reason: string
  status: LeaveStatus
  applied_at: string
  reviewed_at?: string | null
  reviewed_by?: string | null
  principalNote?: string
}

export interface ChatThread {
  id: string; schoolId: string; participantIds: string[]; participantNames: string[]
  lastMessage?: string; lastTs?: any; unreadCount?: number
}

export interface ChatMessage {
  id: string; threadId: string; senderId: string; senderName: string
  senderRole: 'teacher' | 'principal' | 'admin'; text: string; ts: any; read: boolean
}

export interface Timetable {
  id: string; schoolId: string; class: string
  day: 'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'; period: number
  subject: string; teacherId: string; teacherName: string; startTime: string; endTime: string
}
