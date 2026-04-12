import { useNavigate } from 'react-router-dom';
import { Users, UserRound, BookOpen, CalendarCheck, TrendingUp, AlertCircle, CheckCircle, Clock, DollarSign, Bell, MessageCircle, FileText, Zap, BarChart2, Award } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { usePrincipalStats } from '@/hooks/usePrincipalStats';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const QUICK_ACTIONS = [
  { label: 'Add Student',    icon: Users,        path: '/principal/students',   color: '#60a5fa' },
  { label: 'Mark Attendance',icon: CalendarCheck,path: '/principal/attendance', color: '#34d399' },
  { label: 'Send Message',   icon: MessageCircle,path: '/principal/chat',       color: '#a78bfa' },
  { label: 'Post Notice',    icon: FileText,     path: '/principal/noticeboard',color: '#fbbf24' },
  { label: 'View Timetable', icon: Clock,        path: '/principal/timetable',  color: '#fb923c' },
  { label: 'Fee Tracking',   icon: DollarSign,   path: '/principal/fees',       color: '#22d3ee' },
];

const chartOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#444442', font: { size: 10 } } },
    y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#444442', font: { size: 10 } }, min: 0, max: 100 },
  },
};

export default function PrincipalDashboard() {
  const navigate = useNavigate();
  const { stats, demographics, notices, events, classPerformance, loading } = usePrincipalStats();
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Map dynamic stats to KPI cards
  const kpiCards = [
    { label: 'Total Students',   value: loading ? '…' : stats.totalStudents.toLocaleString('en-IN'), icon: Users,         delta: 'Live', up: null, sub: 'Firestore record count', accent: '#60a5fa' },
    { label: 'Active Teachers',  value: loading ? '…' : String(stats.activeTeachers),                 icon: UserRound,     delta: 'Active', up: true, sub: 'Verified accounts',     accent: '#34d399' },
    { label: 'Total Classes',    value: loading ? '…' : String(stats.totalClasses),                   icon: BookOpen,      delta: 'Total', up: null, sub: 'Grade sections',        accent: '#fbbf24' },
    { label: 'Today\'s Attendance', value: loading ? '…' : `${stats.attendanceToday}%`,               icon: CalendarCheck, delta: 'Today', up: stats.attendanceToday >= 96, sub: 'Target 96%', accent: '#f87171' },
    { label: 'Fee Collection',   value: loading ? '…' : `₹${(stats.feeCollection / 1000).toFixed(1)}K`, icon: DollarSign,   delta: 'Total', up: true, sub: 'Revenue in portal',     accent: '#a78bfa' },
    { label: 'Pending Fees',     value: loading ? '…' : String(stats.pendingFees),                    icon: AlertCircle,   delta: 'Students', up: false, sub: 'Payment overdue',    accent: '#fb923c' },
    { label: 'Total Staff',      value: loading ? '…' : String(stats.totalStaff),                     icon: Users,         delta: 'Support', up: null, sub: 'Active personnel',    accent: '#22d3ee' },
    { label: 'Total Revenue',    value: loading ? '…' : `₹${(stats.totalRevenue / 1000).toFixed(1)}K`, icon: TrendingUp,    delta: 'Expected', up: true, sub: 'Annual billing',      accent: '#e879f9' },
  ];

  const totalStudents = stats.totalStudents;
  const boysCount = demographics.boysCount;
  const girlsCount = demographics.girlsCount;
  const boysPct = totalStudents > 0 ? Math.round((boysCount / totalStudents) * 100) : 0;
  const girlsPct = totalStudents > 0 ? Math.round((girlsCount / totalStudents) * 100) : 0;

  const dynamicGenderData = {
    labels: ['Boys', 'Girls'],
    datasets: [{ data: [boysCount, girlsCount], backgroundColor: ['#60a5fa', '#f472b6'], borderWidth: 0 }],
  };

  const attendanceChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Today'],
    datasets: [
      {
        label: 'Attendance %',
        data: [0, 0, 0, 0, 0, stats.attendanceToday],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,.08)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: '#10b981',
      },
      {
        label: 'Target',
        data: [96, 96, 96, 96, 96, 96],
        borderColor: 'rgba(239,68,68,.4)',
        borderDash: [4, 4],
        tension: 0,
        fill: false,
        pointRadius: 0,
      }
    ],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Welcome Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.6px', lineHeight: 1.2 }}>
            Welcome back, Principal! 🏛️
          </h1>
          <p style={{ fontSize: 13, color: 'var(--txt2)', marginTop: 5 }}>{today} · Your dashboard is now powered by live school data.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 99, background: 'rgba(16,185,129,.1)', color: '#10b981', border: '1px solid rgba(16,185,129,.2)' }}>
            <CheckCircle size={13} /> Dashboard Sync: Live
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {kpiCards.map(card => (
          <div key={card.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', transition: 'all .2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--txt2)', fontFamily: 'DM Mono, monospace' }}>{card.label}</div>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${card.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon size={13} color={card.accent} />
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.8px', lineHeight: 1 }}>{card.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: card.up === true ? '#22c55e' : card.up === false ? '#ef4444' : 'var(--txt3)', fontFamily: 'DM Mono, monospace' }}>
                {card.up === true ? '↑' : card.up === false ? '↓' : '·'} {card.delta}
              </span>
              <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={14} color="var(--accent)" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Quick Actions</span>
        </div>
        <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          {QUICK_ACTIONS.map(a => (
            <button key={a.label} onClick={() => navigate(a.path)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              padding: '14px 10px', borderRadius: 10, background: 'var(--bg3)',
              border: '1px solid var(--border)', cursor: 'pointer', transition: 'all .2s',
              color: 'var(--txt2)', fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${a.color}12`; (e.currentTarget as HTMLElement).style.borderColor = `${a.color}30`; (e.currentTarget as HTMLElement).style.color = a.color; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--txt2)'; }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 9, background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <a.icon size={16} color={a.color} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', lineHeight: 1.3 }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={14} color="var(--accent)" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Attendance Trend</span>
            <span style={{ fontSize: 11, color: 'var(--txt2)', fontFamily: 'DM Mono, monospace' }}>Building from today</span>
          </div>
          <div style={{ padding: 16, height: 210 }}>
            <Line data={attendanceChartData} options={chartOptions} />
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={14} color="var(--accent)" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Student Demographics</span>
          </div>
          <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 130, height: 130, flexShrink: 0 }}>
              <Doughnut data={dynamicGenderData} options={{ plugins: { legend: { display: false } }, cutout: '72%', maintainAspectRatio: true }} />
            </div>
            <div style={{ flex: 1 }}>
              {[{ label: 'Male Students', count: boysCount, pct: `${boysPct}%`, color: '#60a5fa' }, { label: 'Female Students', count: girlsCount, pct: `${girlsPct}%`, color: '#f472b6' }].map(d => (
                <div key={d.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                      {d.label}
                    </span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: d.color }}>{d.pct}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: 'var(--bg4)' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: d.color, width: d.pct, transition: 'width .6s' }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--txt2)' }}>Total: <strong style={{ color: 'var(--txt)' }}>{totalStudents.toLocaleString('en-IN')}</strong> students</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {/* Notices/Alerts */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={14} color="#fbbf24" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Recents Notices</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {notices.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--txt3)', fontSize: 12 }}>No recent notices</div>
            ) : notices.map((notice, i) => (
              <div key={i} style={{ padding: '10px 16px', borderBottom: i < notices.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 12, color: 'var(--txt)', fontWeight: 600 }}>{notice.title}</div>
                <div style={{ fontSize: 11, color: 'var(--txt2)', marginTop: 2 }}>{notice.content}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule/Events */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={14} color="var(--accent)" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Upcoming Events</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {events.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--txt3)', fontSize: 12 }}>No upcoming events scheduled</div>
            ) : events.map((ev, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 16px', borderBottom: i < events.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 3, borderRadius: 99, background: 'var(--accent)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{ev.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt2)', marginTop: 2 }}>{new Date(ev.date).toLocaleDateString()} · {ev.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Grade Performance */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={14} color="#fbbf24" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Grade Wise Avg</span>
          </div>
          <div style={{ padding: '12px 16px' }}>
            {classPerformance.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--txt3)', fontSize: 12 }}>Add classes to see metrics</div>
            ) : classPerformance.map(c => (
              <div key={c.grade} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--txt2)', marginBottom: 4 }}>
                  <span>{c.grade}</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', color: c.color }}>{c.avg}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: 'var(--bg4)' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: c.color, width: `${c.avg}%`, transition: 'width .6s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
