// Billing.tsx
import { useState } from 'react'
import { usePayments } from '@/hooks/usePayments'
import { useSchools } from '@/hooks/useSchools'
import { statusBadge, fmtINR, fmtDate, planColors } from '@/lib/utils'
import SchoolModal from '@/components/modals/SchoolModal'
import { School } from '@/types'

export function Billing() {
  const [activeTab, setActiveTab] = useState<'payments' | 'subscriptions'>('payments')
  const { payments, markPaid } = usePayments()
  const { schools, updateSchool } = useSchools()
  const [editingSchool, setEditingSchool] = useState<School | null>(null)

  const paid    = payments.filter(p => p.status === 'paid').reduce((a, p) => a + p.amount, 0)
  const overdueNum = payments.filter(p => p.status === 'overdue').reduce((a, p) => a + p.amount, 0)
  const mrr     = schools.filter(s => s.status === 'active').reduce((a, s) => a + ({'Enterprise Excellence':12000,'Academy Pro':7500,'Institutional Starter':2500}[s.plan]??2500), 0)

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      
      {/* Metrics Bar */}
      <div className="grid4">
        <div className="mc"><div className="mc-label">MRR</div><div className="mc-value">{fmtINR(mrr)}</div><div className="mc-delta up">↑ Live</div></div>
        <div className="mc"><div className="mc-label">Collected</div><div className="mc-value">{fmtINR(paid)}</div><div className="mc-delta up">All time</div></div>
        <div className="mc"><div className="mc-label">Overdue</div><div className="mc-value">{fmtINR(overdueNum)}</div><div className="mc-delta dn">Pending</div></div>
        <div className="mc"><div className="mc-label">Accounts</div><div className="mc-value">{schools.length}</div><div className="mc-delta up">Institutions</div></div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:20, borderBottom:'1px solid var(--border)', paddingBottom:2 }}>
        {['payments', 'subscriptions'].map(t => (
          <button 
            key={t}
            onClick={() => setActiveTab(t as any)}
            style={{ 
              background:'none', border:'none', color: activeTab === t ? 'var(--accent)' : 'var(--txt3)',
              fontSize:13, fontWeight:600, padding:'8px 4px', cursor:'pointer',
              borderBottom: activeTab === t ? '2px solid var(--accent)' : '2px solid transparent',
              textTransform: 'capitalize', transition: 'all .2s'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'payments' ? (
        <div className="card">
          <div className="card-header"><span className="card-title">Payment History</span><span className="card-sub">Global transactions</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th style={{width:'24%'}}>School</th><th style={{width:'12%'}}>Plan</th><th style={{width:'13%'}}>Amount</th><th style={{width:'11%'}}>Status</th><th style={{width:'13%'}}>Date</th><th style={{width:'27%'}}>Action</th></tr></thead>
              <tbody>
                {payments.length === 0 && <tr><td colSpan={6} style={{textAlign:'center',padding:32}}>No payments recorded</td></tr>}
                {payments.map(p => (
                  <tr key={p.id}>
                    <td>{p.schoolName}</td>
                    <td><span className="badge badge-gray" style={{fontSize:10}}>{p.plan}</span></td>
                    <td style={{fontFamily:'DM Mono,monospace'}}>₹{p.amount.toLocaleString('en-IN')}</td>
                    <td><span className={`badge ${statusBadge(p.status)}`}>{p.status}</span></td>
                    <td style={{fontFamily:'DM Mono,monospace'}}>{fmtDate(p.date)}</td>
                    <td><button className="btn btn-green btn-sm" onClick={() => markPaid(p.id)} disabled={p.status==='paid'}>Mark paid</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header"><span className="card-title">Active Subscriptions</span><span className="card-sub">Institutional access tiers</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th style={{width:'30%'}}>Institution</th><th style={{width:'25%'}}>Current Plan</th><th style={{width:'15%'}}>Payment Status</th><th style={{width:'15%'}}>Members</th><th style={{width:'15%'}}>Actions</th></tr></thead>
              <tbody>
                {schools.map(s => {
                   const { color } = planColors(s.plan)
                   return (
                    <tr key={s.id}>
                      <td><div style={{fontWeight:600}}>{s.name}</div><div style={{fontSize:10,color:'var(--txt3)'}}>{s.email}</div></td>
                      <td><span className="badge" style={{ background: 'rgba(255,255,255,.05)', border:'1px solid var(--border)', color, fontSize:10 }}>{s.plan}</span></td>
                      <td><span className={`badge ${statusBadge(s.status)}`}>{s.status}</span></td>
                      <td style={{fontFamily:'DM Mono,monospace'}}>{s.students} <span style={{fontSize:9,color:'var(--txt3)'}}>IDs</span></td>
                      <td><button className="btn btn-ghost btn-xs" onClick={() => setEditingSchool(s)}>Manage Sub</button></td>
                    </tr>
                   )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingSchool && (
        <SchoolModal 
          school={editingSchool}
          onSave={async (data) => {
            await updateSchool(editingSchool.id, data)
            setEditingSchool(null)
          }}
          onClose={() => setEditingSchool(null)}
        />
      )}
    </div>
  )
}
export default Billing
