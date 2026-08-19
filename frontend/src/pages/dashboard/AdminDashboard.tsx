import React, { useEffect, useState } from 'react';
import { analyticsApi } from '../../api/analytics.api';
import { classApi } from '../../api/class.api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import {
  Users,
  Layers,
  BookOpen,
  ShieldAlert,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsRes, classRes] = await Promise.all([
          analyticsApi.getAdminAnalytics(),
          classApi.getClasses(),
        ]);
        if (statsRes.success) setStats(statsRes.data);
        if (classRes.success) setClasses(classRes.data);
      } catch (err) {
        // Ignore
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white p-4 sm:p-6 md:p-8 shadow-xl">
        <div className="relative z-10 space-y-2">
          <Badge variant="gold" className="text-xs">
            Admin Management Console
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Institutional Administration &amp; Insights
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 max-w-xl">
            Manage academic classes, faculty assignments, student rosters, security audit trails, and platform integrity.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Users</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">
              {stats?.totalUsers || 0}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium mt-0.5">
              <TrendingUp className="w-3 h-3" />
              {stats?.totalStudents || 0} Students &bull; {stats?.totalFaculty || 0} Faculty
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Active Classes</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">
              {stats?.totalClasses || 0}
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Across all departments</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Subjects</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">
              {stats?.totalSubjects || 0}
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Active course workspaces</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Pending Moderation</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">
              {stats?.pendingReports || 0}
            </h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">Flagged forum content</p>
          </div>
        </Card>
      </div>

      {/* Classes Overview & Fast Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Institutional Classes</h3>
            <Link to="/classes">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                View All
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {classes.slice(0, 4).map((c) => (
              <Card
                key={c._id}
                hover
                onClick={() => navigate(`/classes/${c._id}`)}
                className="space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                      {c.name}
                    </h4>
                    <p className="text-xs text-gray-400">{c.department} &bull; Sem {c.semester}</p>
                  </div>
                  <Badge variant="blue">{c.code}</Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {c.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-slate-800">
                  <span>Year: {c.academicYear}</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    Open Class <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Administration Actions */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Administrative Tools</h3>
          <Card className="space-y-3">
            <Link to="/classes" className="block">
              <Button variant="outline" className="w-full justify-start text-xs" leftIcon={<Plus className="w-4 h-4" />}>
                Create New Academic Class
              </Button>
            </Link>
            <Link to="/admin/users" className="block">
              <Button variant="outline" className="w-full justify-start text-xs" leftIcon={<Users className="w-4 h-4" />}>
                Manage Faculty &amp; Students
              </Button>
            </Link>
            <Link to="/admin/reports" className="block">
              <Button variant="outline" className="w-full justify-start text-xs" leftIcon={<ShieldAlert className="w-4 h-4" />}>
                Review Moderation Queue
              </Button>
            </Link>
            <Link to="/admin/audit-logs" className="block">
              <Button variant="outline" className="w-full justify-start text-xs" leftIcon={<Activity className="w-4 h-4" />}>
                Inspect Security Audit Logs
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
