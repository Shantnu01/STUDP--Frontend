import { Plan, SchoolStatus, PaymentStatus } from '@/types'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export function planPrice(plan: Plan): number {
  return { 'Enterprise Excellence': 12000, 'Academy Pro': 7500, 'Institutional Starter': 2500 }[plan] ?? 2500
}

export function planColors(plan: Plan) {
  return {
    'Enterprise Excellence': { bg: 'rgba(110,231,183,.12)', color: '#6ee7b7', border: 'rgba(110,231,183,.25)' },
    'Academy Pro':           { bg: 'rgba(59,130,246,.12)',  color: '#60a5fa', border: 'rgba(59,130,246,.25)' },
    'Institutional Starter': { bg: 'rgba(245,158,11,.12)',  color: '#fbbf24', border: 'rgba(245,158,11,.25)' },
  }[plan] ?? { bg: 'rgba(255,255,255,.06)', color: '#888', border: 'rgba(255,255,255,.1)' }
}

export function statusBadge(status: SchoolStatus | PaymentStatus) {
  const map: Record<string, string> = {
    active:  'badge-green',
    paid:    'badge-green',
    overdue: 'badge-amber',
    pending: 'badge-blue',
    suspended: 'badge-red',
    failed:  'badge-red',
    rejected:'badge-red',
    approved:'badge-green',
  }
  return map[status] ?? 'badge-gray'
}

export function fmtINR(n: number) {
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + 'Cr'
  if (n >= 100000)   return '₹' + (n / 100000).toFixed(1) + 'L'
  if (n >= 1000)     return '₹' + (n / 1000).toFixed(1) + 'K'
  return '₹' + n
}

export function fmtDate(v: any): string {
  if (!v) return '—'
  try {
    const d = v?.toDate ? v.toDate() : new Date(v)
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  } catch { return String(v) }
}

export function fmtTime(v: any): string {
  if (!v) return ''
  try {
    const d = v?.toDate ? v.toDate() : new Date(v)
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

export function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function exportCSV(rows: any[], filename: string) {
  if (!rows.length) return
  const headers = Object.keys(rows[0]).join(',')
  const body = rows.map(r => Object.values(r).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([headers + '\n' + body], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
}

// ── Teacher-specific utilities ─────────────────────────────────────────────

export function fmtDateShort(v: any): string {
  if (!v) return '—'
  try {
    const d = v?.toDate ? v.toDate() : new Date(v)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  } catch { return String(v) }
}

export function fmtDateTime(v: any): string {
  if (!v) return '—'
  try {
    const d = v?.toDate ? v.toDate() : new Date(v)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' +
           d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  } catch { return String(v) }
}

export function gradeFromMarks(obtained: number, max: number): string {
  const pct = max > 0 ? (obtained / max) * 100 : 0
  if (pct >= 90) return 'A+'; if (pct >= 80) return 'A'; if (pct >= 70) return 'B+'
  if (pct >= 60) return 'B'; if (pct >= 50) return 'C'; if (pct >= 35) return 'D'; return 'F'
}

export function gradeColor(grade: string): string {
  return ({ 'A+': '#6ee7b7', A: '#22c55e', 'B+': '#60a5fa', B: '#3b82f6', C: '#fbbf24', D: '#f59e0b', F: '#ef4444' } as any)[grade] ?? '#888'
}

export function attendanceColor(status: string) {
  return ({ present: '#22c55e', absent: '#ef4444', late: '#f59e0b', excused: '#60a5fa' } as any)[status] ?? '#888'
}

export function subjectColor(subject: string): string {
  const palette = ['#6ee7b7', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa', '#34d399', '#fb923c', '#e879f9']
  let h = 0; for (const c of subject) h = (h * 31 + c.charCodeAt(0)) % palette.length; return palette[h]
}

export function todayISO() { return new Date().toISOString().split('T')[0] }

export function daysBetween(from: string, to: string): number {
  return Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1
}

export function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    active: 'badge-green', present: 'badge-green', approved: 'badge-green', paid: 'badge-green', published: 'badge-green',
    absent: 'badge-red', rejected: 'badge-red', failed: 'badge-red', suspended: 'badge-red',
    late: 'badge-amber', overdue: 'badge-amber', pending: 'badge-amber', draft: 'badge-amber',
    excused: 'badge-blue', inactive: 'badge-gray', closed: 'badge-gray', transferred: 'badge-gray',
  }
  return map[status] ?? 'badge-gray'
}

export function makeThreadId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_')
}
