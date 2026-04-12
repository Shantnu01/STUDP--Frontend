import { useState } from 'react'
import { usePayments } from '@/hooks/usePayments'
import { useSchools } from '@/hooks/useSchools'
import { statusBadge, fmtDate } from '@/lib/utils'
import { X } from 'lucide-react'

export default function Invoices() {
  const { payments, addPayment } = usePayments()
  const { schools } = useSchools()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ schoolId: '', plan: 'Starter', amount: '', due: '', status: 'pending' as any })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const create = async () => {
    const school = schools.find(s => s.id === form.schoolId)
    if (!school || !form.amount) return
    await addPayment({
      schoolId: form.schoolId, schoolName: school.name,
      plan: form.plan as any, amount: parseFloat(form.amount),
      status: form.status, date: new Date().toISOString().split('T')[0],
      due: form.due,
    })
    setShowModal(false)
  }

  const download = (inv: string, name: string, amount: number) => {
    const txt = `EDUSYNC INVOICE\n${'─'.repeat(40)}\nInvoice: ${inv}\nSchool:  ${name}\nAmount:  ₹${amount.toLocaleString('en-IN')}\nDate:    ${new Date().toLocaleDateString('en-IN')}\n${'─'.repeat(40)}\nThank you · EduSync Platform`
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt],{type:'text/plain'})); a.download = inv + '.txt'; a.click()
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Invoices</span>
          <button className="btn btn-accent btn-sm" onClick={() => setShowModal(true)}>+ New invoice</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th style={{width:'14%'}}>Invoice #</th><th style={{width:'24%'}}>School</th><th style={{width:'12%'}}>Plan</th><th style={{width:'12%'}}>Amount</th><th style={{width:'11%'}}>Status</th><th style={{width:'13%'}}>Due</th><th style={{width:'14%'}}>Action</th></tr></thead>
            <tbody>
              {payments.length === 0 && <tr><td colSpan={7} style={{textAlign:'center',color:'var(--txt3)',padding:24,fontFamily:'DM Mono,monospace'}}>No invoices yet</td></tr>}
              {payments.map((p, i) => {
                const inv = 'INV-' + String(1000 + i + 1)
                return (
                  <tr key={p.id}>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:11}}>{inv}</td>
                    <td>{p.schoolName}</td>
                    <td><span className="badge badge-gray">{p.plan}</span></td>
                    <td style={{fontFamily:'DM Mono,monospace'}}>₹{p.amount.toLocaleString('en-IN')}</td>
                    <td><span className={`badge ${statusBadge(p.status)}`}>{p.status}</span></td>
                    <td style={{fontFamily:'DM Mono,monospace'}}>{fmtDate(p.due ?? p.date)}</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => download(inv, p.schoolName, p.amount)}>Download</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100 }} onClick={e => { if(e.target===e.currentTarget) setShowModal(false) }}>
          <div style={{ width:420,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:16,padding:28,display:'flex',flexDirection:'column',gap:16 }}>
            <div style={{ display:'flex',alignItems:'center' }}>
              <div style={{ flex:1,fontSize:15,fontWeight:600 }}>New invoice</div>
              <button onClick={() => setShowModal(false)} style={{ background:'none',border:'none',color:'var(--txt2)',cursor:'pointer' }}><X size={18}/></button>
            </div>
            <div className="field">
              <label>School</label>
              <select value={form.schoolId} onChange={e => set('schoolId', e.target.value)}>
                <option value="">Select school…</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="grid2">
              <div className="field"><label>Plan</label>
                <select value={form.plan} onChange={e => set('plan', e.target.value)}>
                  <option>Starter</option><option>Growth</option><option>Enterprise</option>
                </select>
              </div>
              <div className="field"><label>Amount (₹)</label><input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="7500" /></div>
            </div>
            <div className="grid2">
              <div className="field"><label>Due date</label><input type="date" value={form.due} onChange={e => set('due', e.target.value)} /></div>
              <div className="field"><label>Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="pending">Pending</option><option value="paid">Paid</option><option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
            <div style={{ display:'flex',gap:8,justifyContent:'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-accent btn-sm" onClick={create}>Create invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
