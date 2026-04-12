import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user } = useAuth()
  const [tog, setTog] = useState({ email: true, realtime: true, autoApprove: false })
  const toggle = (k: keyof typeof tog) => setTog(t => ({ ...t, [k]: !t[k] }))

  const Section = ({ title, rows }: { title: string; rows: { name: string; desc: string; key: keyof typeof tog }[] }) => (
    <div className="card">
      <div className="card-header"><span className="card-title">{title}</span></div>
      {rows.map(({ name, desc, key }) => (
        <div key={key} style={{ display:'flex',alignItems:'center',padding:'13px 16px',borderBottom:'1px solid var(--border)',gap:12 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12,fontWeight:500 }}>{name}</div>
            <div style={{ fontSize:11,color:'var(--txt2)',marginTop:2 }}>{desc}</div>
          </div>
          <div className={`toggle ${tog[key] ? 'on' : ''}`} onClick={() => toggle(key)} />
        </div>
      ))}
    </div>
  )

  return (
    <div className="fade-in" style={{ display:'flex',flexDirection:'column',gap:16,maxWidth:600 }}>
      <div className="card">
        <div className="card-header"><span className="card-title">Profile</span></div>
        <div className="card-body" style={{ display:'flex',flexDirection:'column',gap:12 }}>
          <div className="field"><label>Display name</label><input defaultValue={user?.displayName || ''} placeholder="Admin name" /></div>
          <div className="field"><label>Email</label><input value={user?.email || ''} disabled /></div>
          <div className="field"><label>UID</label><input value={user?.uid || ''} disabled style={{ fontFamily:'DM Mono,monospace',fontSize:11 }} /></div>
          <button className="btn btn-accent btn-sm" style={{ width:'fit-content' }} onClick={() => toast.success('Profile saved ✓')}>Save profile</button>
        </div>
      </div>

      <Section title="Notifications" rows={[
        { name: 'Email notifications', desc: 'Get notified on new registrations and payment events', key: 'email' },
        { name: 'Real-time messaging', desc: 'Live Firestore onSnapshot listener for school threads', key: 'realtime' },
      ]} />

      <Section title="Automation" rows={[
        { name: 'Auto-approve Starter plan', desc: 'Automatically approve registrations under 500 students on Starter', key: 'autoApprove' },
      ]} />

      <div className="card">
        <div className="card-header"><span className="card-title">Firebase connection</span></div>
        <div className="card-body" style={{ display:'flex',flexDirection:'column',gap:10 }}>
          <div style={{ fontSize:11,color:'var(--txt2)' }}>
            Configure your Firebase project in <code style={{ fontFamily:'DM Mono,monospace',color:'var(--accent)',background:'var(--bg3)',padding:'2px 6px',borderRadius:4 }}>.env</code> file.
          </div>
          {[
            ['Auth',      'Firebase Authentication — Email/Password enabled'],
            ['Firestore', 'collections: schools, payments, registrations, messages'],
            ['Storage',   'School logos and invoice documents'],
          ].map(([svc, desc]) => (
            <div key={svc} style={{ display:'flex',gap:10,padding:'10px 12px',background:'var(--bg3)',borderRadius:8,border:'1px solid var(--border)' }}>
              <span style={{ fontFamily:'DM Mono,monospace',color:'var(--accent)',fontSize:11,minWidth:70 }}>{svc}</span>
              <span style={{ fontSize:11,color:'var(--txt2)' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Firestore security rules</span></div>
        <div className="card-body">
          <pre style={{ fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--accent)',lineHeight:1.7,background:'var(--bg3)',padding:14,borderRadius:8,overflowX:'auto',border:'1px solid var(--border)' }}>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null &&
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'admin';
    }
    match /schools/{id}        { allow read, write: if isAdmin(); }
    match /payments/{id}       { allow read, write: if isAdmin(); }
    match /registrations/{id}  { allow read: if isAdmin(); allow create: if true; allow update: if isAdmin(); }
    match /messages/{schoolId}/thread/{msgId} {
      allow read, write: if isAdmin();
    }
    match /admins/{uid}        { allow read: if request.auth.uid == uid; }
  }
}`}</pre>
        </div>
      </div>
    </div>
  )
}
