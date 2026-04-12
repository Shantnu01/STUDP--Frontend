/**
 * usePrincipalStats — Fetches live counts for the Principal Dashboard.
 * Calls a single consolidated endpoint to minimize network overhead.
 */
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

export interface PrincipalStats {
  stats: {
    totalStudents: number;
    activeTeachers: number;
    totalStaff: number;
    totalClasses: number;
    attendanceToday: number;
    feeCollection: number;
    pendingFees: number;
    totalRevenue: number;
  };
  demographics: {
    boysCount: number;
    girlsCount: number;
  };
  notices: any[];
  events: any[];
  classPerformance: any[];
  loading: boolean;
  error?: string;
}

const INITIAL_STATS: PrincipalStats = {
  stats: {
    totalStudents: 0,
    activeTeachers: 0,
    totalStaff: 0,
    totalClasses: 0,
    attendanceToday: 0,
    feeCollection: 0,
    pendingFees: 0,
    totalRevenue: 0,
  },
  demographics: {
    boysCount: 0,
    girlsCount: 0,
  },
  notices: [],
  events: [],
  classPerformance: [],
  loading: true,
};

export function usePrincipalStats(): PrincipalStats {
  const { profile } = useAuthStore();
  const schoolId = profile?.schoolId;

  const [data, setData] = useState<PrincipalStats>(INITIAL_STATS);

  useEffect(() => {
    if (!schoolId) return;

    let cancelled = false;

    async function load() {
      try {
        const res = await api.get('/api/dashboard/principal');
        if (cancelled) return;
        
        setData({
          ...res.data,
          loading: false,
        });
      } catch (err: any) {
        if (!cancelled) {
          setData(prev => ({
            ...prev,
            loading: false,
            error: err.response?.data?.error || 'Failed to load dashboard data',
          }));
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [schoolId]);

  return data;
}
