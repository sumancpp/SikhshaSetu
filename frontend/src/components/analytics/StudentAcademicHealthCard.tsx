import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../api/analytics.api';
import { StudentAcademicHealth } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Skeleton } from '../common/Skeleton';
import {
  HeartPulse,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

export const StudentAcademicHealthCard: React.FC = () => {
  const [health, setHealth] = useState<StudentAcademicHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await analyticsApi.getStudentHealth();
        if (res.success) {
          setHealth(res.data);
        }
      } catch (err) {
        console.warn('Could not load student health:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  if (loading) {
    return <Skeleton className="h-44 rounded-3xl" />;
  }

  if (!health) return null;

  return (
    <Card className="p-6 border border-purple-200 dark:border-purple-900/40 bg-gradient-to-br from-white via-purple-50/20 to-blue-50/30 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Academic Wellness & Exam Readiness
              </h3>
              <Badge
                variant={
                  health.overallRiskTier === 'SAFE'
                    ? 'emerald'
                    : health.overallRiskTier === 'MODERATE'
                    ? 'purple'
                    : 'red'
                }
                className="text-[11px] font-bold"
              >
                {health.overallRiskTier === 'SAFE' ? '🌟 Peak Standing' : `${health.overallRiskTier} Priority`}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Live composite readiness index across {health.totalSubjectsEnrolled} enrolled subjects.
            </p>
          </div>
        </div>

        {/* Readiness Score */}
        <div className="flex items-center gap-4 self-start sm:self-auto bg-white/70 dark:bg-slate-850 p-3 rounded-2xl border border-purple-100 dark:border-purple-900/30">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400">Readiness Score</span>
            <div className="text-xl font-extrabold text-purple-600 dark:text-purple-400">
              {health.overallHealthScore}%
            </div>
          </div>
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-full rounded-full"
              style={{ width: `${health.overallHealthScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Progress Metric Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-purple-100/60 dark:border-slate-800">
        <div className="bg-white/60 dark:bg-slate-900/80 p-3 rounded-xl border border-gray-100 dark:border-slate-800 text-center">
          <span className="text-[10px] text-gray-400 uppercase font-semibold">Submissions</span>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">
            {health.metrics.submissionRatePercentage}%
          </p>
          <span className="text-[10px] text-gray-500">
            {health.metrics.totalAssignmentsSubmitted}/{health.metrics.totalAssignmentsAssigned}
          </span>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/80 p-3 rounded-xl border border-gray-100 dark:border-slate-800 text-center">
          <span className="text-[10px] text-gray-400 uppercase font-semibold">Quiz Average</span>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">
            {health.metrics.averageQuizScorePercentage}%
          </p>
          <span className="text-[10px] text-gray-500">
            {health.metrics.totalQuizzesCompleted} taken
          </span>
        </div>

        <div className="col-span-2 bg-purple-50/50 dark:bg-purple-950/30 p-3 rounded-xl border border-purple-100 dark:border-purple-900/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Exam Tip:</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-1">
            {health.proactiveTips[0] || 'Keep regular submission rhythms to ensure peak scoring.'}
          </p>
        </div>
      </div>
    </Card>
  );
};
