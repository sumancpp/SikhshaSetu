import React, { useState, useEffect } from 'react';
import { reportApi } from '../../api/report.api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { formatDateTime } from '../../utils/formatters';
import { ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

export const ModerationReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const { success, error } = useToast();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportApi.getReports(statusFilter || undefined);
      if (res.success) {
        setReports(res.data);
      }
    } catch (err: any) {
      error('Failed to load reports', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleResolve = async (id: string, status: 'RESOLVED' | 'DISMISSED') => {
    try {
      const res = await reportApi.updateReportStatus(id, {
        status,
        resolutionNote: `Marked as ${status} by Administrator`,
      });
      if (res.success) {
        success('Report Updated', `Report status changed to ${status}`);
        fetchReports();
      }
    } catch (err: any) {
      error('Update failed', err.response?.data?.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
          Moderation &amp; Safety Queue
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Review community reports for academic integrity violations, spam, or inappropriate behavior
        </p>
      </div>

      <div className="flex items-center gap-2">
        {['PENDING', 'RESOLVED', 'DISMISSED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === st
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert className="w-6 h-6" />}
          title="Moderation queue is clear"
          description={`No ${statusFilter.toLowerCase()} incident reports in the system.`}
        />
      ) : (
        <div className="space-y-3">
          {reports.map((rep) => (
            <Card key={rep._id} className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="red">{rep.reason}</Badge>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    Target: <strong className="text-gray-800 dark:text-gray-200">{rep.targetType}</strong> (ID: {rep.targetId})
                  </p>
                </div>
                <span className="text-[11px] text-gray-400">{formatDateTime(rep.createdAt)}</span>
              </div>

              {rep.details && (
                <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl">
                  {rep.details}
                </p>
              )}

              {rep.status === 'PENDING' && (
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolve(rep._id, 'DISMISSED')}
                  >
                    Dismiss Report
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleResolve(rep._id, 'RESOLVED')}
                  >
                    Resolve &amp; Take Action
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
