import { useSchools } from '@/hooks/useSchools'
import { usePayments } from '@/hooks/usePayments'
import { planPrice, fmtINR, planColors } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

const MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']
const STUDENT_DATA = MONTHS.map((month, i) => ({ month, students: 18000 + i * 2200 }))
const REVENUE_TREND = MONTHS.map((month, i) => ({ month, revenue: 410 + i * 62, expenses: 210 + i * 22 }))

export default function Analytics() {
  const { schools } = useSchools()
  const { payments } = usePayments()

  const active = schools.filter(s => s.status === 'active')
  const mrr    = active.reduce((a, s) => a + planPrice(s.plan), 0)
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((a, p) => a + p.amount, 0)

  const planDist = ['Enterprise Excellence', 'Academy Pro', 'Institutional Starter'].map(p => ({
    name: p, value: schools.filter(s => s.plan === p).length,
    color: planColors(p as any).color,
  }))

  const statusDist = [
    { name: 'Active',    value: schools.filter(s => s.status === 'active').length,    color: '#22c55e' },
    { name: 'Overdue',   value: schools.filter(s => s.status === 'overdue').length,   color: '#f59e0b' },
    { name: 'Suspended', value: schools.filter(s => s.status === 'suspended').length, color: '#ef4444' },
  ]

  const TT = (props: any) => props.active ? (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
      {props.payload?.map((p: any) => <div key={p.name} style={{ color: p.color ?? 'var(--txt)' }}>{p.name}: {p.value?.toLocaleString?.() ?? p.value}</div>)}
    </div>
  ) : null

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top metrics */}
      <div className="grid4">
        <div className="mc">
          <div className="mc-label">Total revenue</div>
          <div className="mc-value">{fmtINR(totalPaid)}</div>
          <div className="mc-delta up">All time · collected</div>
        </div>
        <div className="mc">
          <div className="mc-label">Avg per school</div>
          <div className="mc-value">{schools.length ? fmtINR(Math.round(mrr / schools.length)) : '—'}</div>
          <div className="mc-delta" style={{ color: 'var(--txt2)' }}>Monthly avg</div>
        </div>
        <div className="mc">
          <div className="mc-label">Churn rate</div>
          <div className="mc-value">2.1%</div>
          <div className="mc-delta up">↓ 0.3% MoM</div>
        </div>
        <div className="mc">
          <div className="mc-label">NPS Score</div>
          <div className="mc-value">68</div>
          <div className="mc-delta up">↑ 4 pts this quarter</div>
        </div>
      </div>

      <div className="grid2">
        {/* Revenue trend */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Revenue trend</span>
            <span className="card-sub">₹K · 8 months</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={REVENUE_TREND}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6ee7b7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,.04)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#444' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#444' }} tickFormatter={v => `₹${v}K`} />
                <Tooltip content={<TT />} />
                <Area type="monotone" dataKey="revenue" stroke="#6ee7b7" fill="url(#gRev)" strokeWidth={2} dot={false} name="Revenue" />
                <Area type="monotone" dataKey="expenses" stroke="#444" fill="none" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Student growth */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Student enrollment</span>
            <span className="card-sub">Platform-wide</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={STUDENT_DATA}>
                <defs>
                  <linearGradient id="gStu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,.04)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#444' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#444' }} tickFormatter={v => (v/1000).toFixed(0) + 'K'} />
                <Tooltip content={<TT />} />
                <Area type="monotone" dataKey="students" stroke="#3b82f6" fill="url(#gStu)" strokeWidth={2} dot={false} name="Students" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid2">
        {/* Plan distribution */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Plan distribution</span>
            <span className="card-sub">{schools.length} schools</span>
          </div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <PieChart width={160} height={160}>
              <Pie data={planDist} cx={75} cy={75} innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                {planDist.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <Tooltip content={<TT />} />
            </PieChart>
            <div style={{ flex: 1 }}>
              {planDist.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, flex: 1 }}>{p.name}</span>
                  <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--txt2)' }}>{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status distribution */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">School status</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={statusDist} layout="vertical" barSize={16}>
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#444' }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--txt2)' }} width={70} />
                <Tooltip content={<TT />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Schools">
                  {statusDist.map((e) => <Cell key={e.name} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
