/**
 * useAdminStats — Fetches high-level metrics and trends for the Super Admin Dashboard.
 */
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export interface AdminStats {
  metrics: {
    mrr: number;
    arr: number;
    activeSchools: number;
    totalSchools: number;
    pendingRegistrations: number;
    overdueSchools: number;
  };
  planSplit: {
    plan: string;
    count: number;
    rev: number;
  }[];
  revenueTrends: {
    month: string;
    revenue: number;
    expenses: number;
  }[];
  recentPayments: any[];
  recentRegistrations: any[];
  loading: boolean;
  error?: string;
}

const INITIAL_DATA: AdminStats = {
  metrics: {
    mrr: 0,
    arr: 0,
    activeSchools: 0,
    totalSchools: 0,
    pendingRegistrations: 0,
    overdueSchools: 0,
  },
  planSplit: [],
  revenueTrends: [],
  recentPayments: [],
  recentRegistrations: [],
  loading: true,
};

export function useAdminStats(): AdminStats {
  const [data, setData] = useState<AdminStats>(INITIAL_DATA);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await api.get('/api/dashboard/admin');
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
            error: err.response?.data?.error || 'Failed to load admin stats',
          }));
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return data;
}
