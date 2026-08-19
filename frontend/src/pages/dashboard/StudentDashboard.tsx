import React, { useEffect, useState } from 'react';
import { analyticsApi } from '../../api/analytics.api';
import { subjectApi } from '../../api/subject.api';
import { challengeApi } from '../../api/challenge.api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import {
  Award,
  Flame,
  BookOpen,
  Target,
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Trophy,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';

export const StudentDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const [statsRes, subRes, chalRes] = await Promise.all([
          analyticsApi.getStudentAnalytics(),
          subjectApi.getSubjects(),
          challengeApi.getChallenges({ category: 'DAILY' }),
        ]);
        if (statsRes.success) setStats(statsRes.data);
        if (subRes.success) setSubjects(subRes.data);
        if (chalRes.success) setActiveChallenges(chalRes.data);
      } catch (err) {
        // Ignore
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const userPoints = user?.points || 0;
  const nextRankPoints = 500;
  const progressPercent = Math.min(100, Math.round((userPoints / nextRankPoints) * 100));

  return (
    <div className="space-y-8">
      {/* Student Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-4 sm:p-6 md:p-8 shadow-xl">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold">
              Student Learning Hub
            </span>
            <span className="flex items-center gap-1 text-xs text-yellow-300 font-bold">
              <Flame className="w-4 h-4 fill-yellow-300" />
              {user?.streakDays || 1} Day Streak!
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Ready to learn, {user?.name}?
          </h2>

          {/* Points Progress Bar */}
          <div className="max-w-md space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-semibold text-blue-100">
              <span>{userPoints} Academic Points</span>
              <span>Next Rank: {nextRankPoints} pts</span>
            </div>
            <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-amber-300 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Points</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">
              {userPoints}
            </h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
              Rank #{stats?.rank || 1} in Batch
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Enrolled Subjects</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">
              {subjects.length}
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Active Courses</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Assignments Completed</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">
              {stats?.submittedAssignments || 2}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              100% on-time rate
            </p>
          </div>
        </Card>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Subjects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">My Subjects</h3>
            <Link to="/classes">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Join / View Classes
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subjects.map((sub) => (
              <Card
                key={sub._id}
                hover
                onClick={() => navigate(`/subjects/${sub._id}`)}
                className="space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <Badge variant="blue">{sub.code}</Badge>
                    <span className="text-[11px] text-gray-400 font-medium">
                      Sem {sub.semester}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                    {sub.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {sub.description || 'Access notes, assignments, and discussions.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-400">
                  <span>Faculty: {sub.primaryFacultyId?.name || 'Faculty'}</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    Open Hub <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Daily Challenge & Fast Access */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Daily Challenge</h3>
            <Link to="/challenges" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              All Challenges
            </Link>
          </div>

          {activeChallenges.length > 0 ? (
            <Card className="space-y-3 border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/40 to-yellow-50/20 dark:from-slate-900 dark:to-slate-900">
              <div className="flex items-start justify-between">
                <Badge variant="gold">Daily Challenge</Badge>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  +{activeChallenges[0].rewardPoints} pts
                </span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {activeChallenges[0].title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                {activeChallenges[0].description}
              </p>
              <Link to="/challenges" className="block pt-2">
                <Button variant="primary" size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                  Solve &amp; Earn Points
                </Button>
              </Link>
            </Card>
          ) : (
            <Card className="p-6 text-center text-xs text-gray-400">
              Check back tomorrow for the next daily challenge!
            </Card>
          )}

          {/* Quick Leaderboard Preview */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Class Leaderboard
              </h4>
              <Link to="/leaderboard" className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline">
                View Full
              </Link>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Compete with classmates by completing assignments, solving daily challenges, and answering questions in the forum.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
