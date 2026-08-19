import React, { useEffect, useState } from 'react';
import { analyticsApi } from '../../api/analytics.api';
import { subjectApi } from '../../api/subject.api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import {
  BookOpen,
  FileCheck2,
  Users,
  Plus,
  ArrowRight,
  Sparkles,
  Award,
  QrCode,
  MapPin,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const FacultyDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFacultyData = async () => {
      try {
        const [statsRes, subRes] = await Promise.all([
          analyticsApi.getFacultyAnalytics(),
          subjectApi.getSubjects(),
        ]);
        if (statsRes.success) setStats(statsRes.data);
        if (subRes.success) setSubjects(subRes.data);
      } catch (err) {
        // Ignore
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
      {/* Faculty Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white p-4 sm:p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <Badge variant="blue" className="bg-white/20 text-white border-white/30 text-xs">
              Faculty Workspace
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome, {user?.name}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
              Manage course materials, assign homework, configure automated MCQ quizzes, evaluate submissions, and take GPS-verified attendance.
            </p>
          </div>

          <Button
            onClick={() => navigate('/attendance')}
            className="bg-white hover:bg-blue-50 text-indigo-900 border-none font-bold text-xs shadow-lg shrink-0"
            leftIcon={<QrCode className="w-4 h-4 text-indigo-600" />}
          >
            🚀 Launch Live Attendance
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Teaching Subjects</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">
              {stats?.totalSubjects || subjects.length}
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Primary &amp; Co-Faculty</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Submissions to Grade</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">
              {stats?.pendingGrading || 0}
            </h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">Awaiting evaluation</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Enrolled Students</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">
              {stats?.totalStudents || 15}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">Across all subjects</p>
          </div>
        </Card>
      </div>

      {/* Teaching Subjects Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">My Subject Workspaces</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Click a subject to manage materials, assignments, quizzes, and forum
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((sub) => (
            <Card
              key={sub._id}
              hover
              onClick={() => navigate(`/subjects/${sub._id}`)}
              className="space-y-3 flex flex-col justify-between border-t-4 border-t-blue-600"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <Badge variant="blue">{sub.code}</Badge>
                  <span className="text-[11px] text-gray-400 font-medium">
                    Sem {sub.semester}
                  </span>
                </div>
                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                  {sub.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {sub.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-gray-400">Class: {sub.classId?.name || 'Class'}</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  Enter Hub <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
