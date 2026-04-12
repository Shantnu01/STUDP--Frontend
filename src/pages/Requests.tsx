import { useRegistrations } from '@/hooks/useRegistrations'
import { statusBadge, fmtDate } from '@/lib/utils'

export default function Requests() {
  const { registrations, approve, reject } = useRegistrations()
  const pending  = registrations.filter(r => r.status === 'pending')
  const resolved = registrations.filter(r => r.status !== 'pending')

  const Section = ({ title, items, showActions }: any) => (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{title}</span>
        <span className="card-sub">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="card-body" style={{ color:'var(--txt3)',fontSize:12,fontFamily:'DM Mono,monospace' }}>
          {showActions ? 'No pending requests 🎉' : 'None yet'}
        </div>
      ) : items.map((r: any) => (
        <div key={r.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:'1px solid var(--border)' }}>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:12,fontWeight:600 }}>{r.schoolName}, {r.city}</div>
            <div style={{ fontSize:11,color:'var(--txt2)',marginTop:3,fontFamily:'DM Mono,monospace' }}>
              {r.plan} · {(r.students||0).toLocaleString('en-IN')} students · {r.email} · {fmtDate(r.createdAt)}
            </div>
          </div>
          {!showActions && <span className={`badge ${statusBadge(r.status)}`}>{r.status}</span>}
          {showActions && (
            <div style={{ display:'flex',gap:6,flexShrink:0 }}>
              <button className="btn btn-green btn-sm" onClick={() => approve(r)}>Approve</button>
              <button className="btn btn-red btn-sm" onClick={() => reject(r.id)}>Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className="fade-in" style={{ display:'flex',flexDirection:'column',gap:16 }}>
      <div className="grid4">
        <div className="mc"><div className="mc-label">Pending</div><div className="mc-value">{pending.length}</div><div className="mc-delta" style={{color:'var(--txt2)'}}>Need action</div></div>
        <div className="mc"><div className="mc-label">Approved</div><div className="mc-value">{registrations.filter(r=>r.status==='approved').length}</div><div className="mc-delta up">Onboarded</div></div>
        <div className="mc"><div className="mc-label">Rejected</div><div className="mc-value">{registrations.filter(r=>r.status==='rejected').length}</div><div className="mc-delta dn">Declined</div></div>
        <div className="mc"><div className="mc-label">Total</div><div className="mc-value">{registrations.length}</div><div className="mc-delta" style={{color:'var(--txt2)'}}>All time</div></div>
      </div>
      <Section title="Pending registrations" items={pending} showActions />
      <Section title="Resolved" items={resolved} showActions={false} />
    </div>
  )
}
