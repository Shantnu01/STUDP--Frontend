import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { usePrincipalLeaveRequests } from '@/hooks/useComms';
import { useAuth } from '@/hooks/useAuth';

export default function LeaveRequests() {
  const { profile } = useAuth();
  const { requests, loading } = usePrincipalLeaveRequests(profile?.schoolId);
  const [busy, setBusy] = useState<string | null>(null);

  const handleUpdateStatus = async (id: string, newStatus: 'Approved' | 'Rejected') => {
    setBusy(id);
    try {
      await api.patch(`/api/leave/${id}/status`, { status: newStatus });
      toast.success(`Request ${newStatus.toLowerCase()} successfully`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${newStatus.toLowerCase()} request`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6 animate-element animate-delay-100">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Requests</h1>
          <p className="text-[var(--txt2)] mt-1">Review and manage staff leave applications.</p>
        </div>
      </header>

      <div className="card w-full overflow-hidden border border-[var(--border)]">
        <div className="card-header items-center">
          <div>
            <div className="card-title">All Applications</div>
            <div className="card-sub">{requests.length} total requests</div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Leave Details</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-[var(--txt3)]">Loading records...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-[var(--txt3)]">No leave requests found.</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[var(--txt)]">{req.user_name}</span>
                        <span className="text-[var(--txt2)] text-xs capitalize mono">{req.role}</span>
                      </div>
                      <div className="text-[10px] text-[var(--txt3)] mt-1">Applied: {new Date(req.applied_at).toLocaleDateString()}</div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className="inline-block px-2 py-0.5 text-xs font-bold rounded bg-[var(--bg3)] text-[var(--txt)] w-max capitalize">
                          {req.leave_type}
                        </span>
                        <span className="text-xs text-[var(--txt2)] mono mt-1">
                          {req.start_date} → {req.end_date}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-xs text-sm text-[var(--txt2)] whitespace-normal">
                      {req.reason}
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full
                        ${req.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' :
                        req.status === 'Rejected' ? 'bg-red-500/20 text-red-500' :
                        'bg-amber-500/20 text-amber-500'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="text-right">
                      {req.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleUpdateStatus(req.id, 'Approved')} disabled={busy === req.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                            Approve
                          </button>
                          <button onClick={() => handleUpdateStatus(req.id, 'Rejected')} disabled={busy === req.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all">
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[var(--txt3)] text-xs italic">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
