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
