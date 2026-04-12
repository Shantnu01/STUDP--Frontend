// Pricing.tsx (Admin Management)
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Check, Info, Save, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

interface PlanDetail {
  id: string
  price: number
  limit: number
  features: string[]
}

export default function Pricing() {
  const [plans, setPlans] = useState<PlanDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      // Since it's a small app, we'll fetch from a generic schools/plans or just /plans if we implement it.
      // For now, let's assume we implement a simple dedicated endpoint.
      const { data } = await api.get('/api/admin/plans')
      setPlans(data.plans)
    } catch (e: any) {
      toast.error('Failed to load plan configurations')
    } finally {
      setLoading(false)
    }
  }

  const updatePlan = async (p: PlanDetail) => {
    setSavingId(p.id)
    try {
      await api.put(`/api/admin/plans/${p.id}`, p)
      toast.success(`${p.id} updated successfully`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSavingId(null)
    }
  }

  if (loading) return <div className="mc-value" style={{padding:40, textAlign:'center'}}>Loading Protocol…</div>

  return (
    <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ maxWidth: 800 }}>
        <h2 style={{ fontSize:24, fontWeight:900, letterSpacing:'-0.5px', marginBottom:8 }}>Subscription Protocol Configuration</h2>
        <p style={{ color:'var(--txt2)', fontSize:13, lineHeight:1.6 }}> Configure the global service tiers for all participating institutions. Changes here affect live MRR calculations and identity gate limits.</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap:20 }}>
        {plans.map((p) => (
          <div key={p.id} className="card" style={{ padding:28, border: p.id === 'Enterprise Excellence' ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
               <div style={{ fontSize:10, padding:'3px 10px', background:'rgba(255,255,255,0.05)', borderRadius:99, color:'var(--accent)', fontWeight:700, letterSpacing:1 }}>MODERN TIER</div>
               <ShieldCheck size={16} color={p.id === 'Enterprise Excellence' ? 'var(--accent)' : 'var(--txt3)'} />
            </div>

            <h3 style={{ fontSize:20, fontWeight:800, marginBottom:24 }}>{p.id}</h3>

            <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:32 }}>
              <div className="field">
                <label>Monthly Revenue (₹)</label>
                <div style={{ position:'relative' }}>
                  <input 
                    type="number" 
                    value={p.price} 
                    onChange={e => setPlans(prev => prev.map(item => item.id === p.id ? { ...item, price: parseInt(e.target.value) || 0 } : item))}
                    style={{ fontSize:18, fontWeight:700, fontFamily:'DM Mono, monospace', paddingLeft:30 }}
                  />
                  <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontWeight:700 }}>₹</span>
                </div>
              </div>

              <div className="field">
                <label>Member Capacity (Limit)</label>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <input 
                    type="number" 
                    value={p.limit} 
                    onChange={e => setPlans(prev => prev.map(item => item.id === p.id ? { ...item, limit: parseInt(e.target.value) || 0 } : item))}
                    style={{ fontWeight:700, fontFamily:'DM Mono, monospace' }}
                  />
                  <span style={{ fontSize:11, color:'var(--txt3)', fontWeight:500 }}>MEMBERS</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom:32 }}>
               <div style={{ fontSize:10, color:'var(--txt3)', textTransform:'uppercase', fontWeight:700, marginBottom:12, letterSpacing:0.5 }}>Core Feature set</div>
               <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {p.features.map((f, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--txt2)' }}>
                       <Check size={12} color="var(--accent)" />
                       {f}
                    </div>
                  ))}
               </div>
            </div>

            <button 
              className="btn btn-accent" 
              style={{ width:'100%', height:44, borderRadius:12 }}
              onClick={() => updatePlan(p)}
              disabled={savingId === p.id}
            >
              {savingId === p.id ? <><span className="spin" /> Synchronizing…</> : <><Save size={14} /> Commit Changes</>}
            </button>
          </div>
        ))}
      </div>

      <div className="card" style={{ background:'rgba(212,175,55,0.03)', border:'1px dashed var(--accent)', padding:20, borderRadius:16, display:'flex', gap:16 }}>
         <div style={{ padding:10, borderRadius:12, background:'rgba(212,175,55,0.1)', height:'fit-content' }}><Info size={18} color="var(--accent)" /></div>
         <div>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>Infrastructure Note</div>
            <div style={{ fontSize:12, color:'var(--txt2)', lineHeight:1.6 }}>Changing plans affects revenue metrics in real-time. Schools exceeding the new capacity limits will be notified but not suspended; only new creations will be restricted by the identity gate.</div>
         </div>
      </div>
    </div>
  )
}
