import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../api/analytics.api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import { formatDateTime } from '../../utils/formatters';
import { Activity, Shield } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await analyticsApi.getAuditLogs();
        if (res.success) {
          setLogs(res.data.logs);
        }
      } catch (err) {
        // Ignore
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-500" />
          Security Audit Trail
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Immutable ledger of administrative actions, user logins, role modifications, and privilege access
        </p>
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : logs.length === 0 ? (
        <div className="p-8 text-center text-xs text-gray-400">No audit logs recorded yet.</div>
      ) : (
        <Card className="divide-y divide-gray-100 dark:divide-slate-800/80 p-0 overflow-hidden shadow-xs">
          <div className="p-4 bg-gray-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>Action &amp; Actor</span>
            <span>Target &amp; Timestamp</span>
          </div>
          {logs.map((log) => (
            <div
              key={log._id}
              className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="blue">{log.action}</Badge>
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    {log.userId?.name || 'System / Admin'}
                  </span>
                </div>
                {log.ipAddress && (
                  <p className="text-[10px] text-gray-400 font-mono">IP: {log.ipAddress}</p>
                )}
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {log.targetType || 'Entity'}: {log.targetId || '-'}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(log.createdAt)}</p>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};
