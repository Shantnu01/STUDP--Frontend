import { useState } from 'react'
import { useSchools } from '@/hooks/useSchools'
import SchoolModal from '@/components/modals/SchoolModal'
import { School, SchoolStatus } from '@/types'
import { planColors, planPrice, statusBadge, fmtINR, fmtDate, initials } from '@/lib/utils'
import { Search } from 'lucide-react'

export default function Schools() {
  const { schools, addSchool, updateSchool, deleteSchool } = useSchools()
  const [modal, setModal] = useState<School | null | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState<SchoolStatus | ''>('')

  const filtered = schools.filter(s => {
    const q = search.toLowerCase()
    const matchQ = !q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    const matchS = !statusF || s.status === statusF
    return matchQ && matchS
  })

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div className="search-wrap" style={{ flex: 1, maxWidth: 340 }}>
          <Search size={14} />
          <input className="search-input" placeholder="Search schools, cities, emails…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          value={statusF}
          onChange={e => setStatusF(e.target.value as SchoolStatus | '')}
          style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 7, padding: '7px 10px', fontSize: 12, color: 'var(--txt)', outline: 'none', fontFamily: 'Sora, sans-serif' }}
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="overdue">Overdue</option>
          <option value="suspended">Suspended</option>
        </select>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--txt2)', fontFamily: 'DM Mono, monospace' }}>{filtered.length} schools</span>
        <button className="btn btn-accent btn-sm" onClick={() => setModal(null)}>+ Add school</button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="empty"><p>No schools match your filter</p></div>
      ) : (
        <div className="grid3">
          {filtered.map(s => {
            const { bg, color } = planColors(s.plan)
            const mrr = planPrice(s.plan)
            return (
              <div
                key={s.id}
                className="card"
                style={{ cursor: 'pointer', transition: 'all .2s', padding: 16 }}
                onClick={() => setModal(s)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div className="av" style={{ width: 38, height: 38, fontSize: 13, background: bg, color }}>{initials(s.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                    <div style={{ display: 'flex', gap: 5, marginTop: 3, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: 'var(--txt2)' }}>{s.city}</span>
                      <span className={`badge ${statusBadge(s.status)}`} style={{ fontSize: 9 }}>{s.status}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { label: 'Students', value: s.students.toLocaleString('en-IN') },
                    { label: 'MRR', value: fmtINR(mrr) },
                    { label: 'Last pay', value: fmtDate(s.lastPayment) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ flex: 1, background: 'var(--bg3)', borderRadius: 6, padding: '7px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'DM Mono, monospace' }}>{value}</div>
                      <div style={{ fontSize: 9, color: 'var(--txt3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: .5 }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className="badge badge-gray" style={{ fontSize: 10 }}>{s.plan}</span>
                  <span style={{ fontSize: 10, color: 'var(--txt3)', marginLeft: 'auto' }}>{s.email}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal !== undefined && (
        <SchoolModal
          school={modal}
          onSave={(d) => modal ? updateSchool(modal.id, d) : addSchool(d)}
          onDelete={modal ? async () => {
            await deleteSchool(modal.id)
          } : undefined}
          onClose={() => setModal(undefined)}
        />
      )}
    </div>
  )
}
