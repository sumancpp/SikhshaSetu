import React, { useState, useEffect } from 'react';
import { leaderboardApi } from '../../api/leaderboard.api';
import { classApi } from '../../api/class.api';
import { LeaderboardEntry, Class } from '../../types';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import { useSocket } from '../../context/SocketContext';
import { Trophy, Flame, Award, Medal, Crown, Sparkles } from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      let res;
      if (selectedClassId) {
        res = await leaderboardApi.getClassLeaderboard(selectedClassId);
      } else {
        res = await leaderboardApi.getGlobalLeaderboard();
      }
      if (res.success) {
        setEntries(res.data);
      }
    } catch (err) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await classApi.getClasses();
        if (res.success) setClasses(res.data);
      } catch (err) {
        // Ignore
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchLeaderboard();

    if (socket) {
      socket.on('leaderboard:updated', () => {
        fetchLeaderboard();
      });
    }
  }, [selectedClassId, socket]);

  const topThree = entries.slice(0, 3);
  const restEntries = entries.slice(3);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-500 via-orange-600 to-yellow-500 text-white p-4 sm:p-6 md:p-8 shadow-xl">
        <div className="relative z-10 space-y-2">
          <Badge variant="gold" className="bg-white/20 text-white border-white/30 text-xs">
            Academic Hall of Fame
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-200" />
            Institutional Points &amp; Ranks
          </h2>
          <p className="text-xs sm:text-sm text-yellow-100 max-w-xl">
            Points are earned transparently through assignment submissions, quizzes, daily challenges, and verified forum solutions.
          </p>
        </div>
      </div>

      {/* Class Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedClassId('')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            !selectedClassId
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          Global Institution
        </button>
        {classes.map((cls) => (
          <button
            key={cls._id}
            onClick={() => setSelectedClassId(cls._id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedClassId === cls._id
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            {cls.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end pt-4">
              {/* Rank 2 */}
              {topThree[1] && (
                <Card className="order-2 md:order-1 text-center p-6 border-slate-300 dark:border-slate-700 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900 shadow-md">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-sm flex items-center justify-center mx-auto mb-3">
                    2
                  </div>
                  <Avatar
                    src={topThree[1].student.avatar}
                    name={topThree[1].student.name}
                    size="lg"
                    className="mx-auto ring-4 ring-slate-300 dark:ring-slate-700"
                  />
                  <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-3">
                    {topThree[1].student.name}
                  </h4>
                  <p className="text-xs text-gray-400">{topThree[1].student.department || 'CS Department'}</p>
                  <p className="text-lg font-black text-slate-700 dark:text-slate-300 mt-2">
                    {topThree[1].student.points} pts
                  </p>
                </Card>
              )}

              {/* Rank 1 (Champion) */}
              {topThree[0] && (
                <Card className="order-1 md:order-2 text-center p-8 border-2 border-amber-400 dark:border-amber-500 bg-gradient-to-b from-amber-50/60 to-white dark:from-amber-950/30 dark:to-slate-900 shadow-xl relative -mt-4">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-lg">
                    <Crown className="w-5 h-5 fill-slate-950" />
                  </div>
                  <Avatar
                    src={topThree[0].student.avatar}
                    name={topThree[0].student.name}
                    size="xl"
                    className="mx-auto ring-4 ring-amber-400 mt-2"
                  />
                  <h4 className="text-lg font-black text-gray-900 dark:text-gray-100 mt-3">
                    {topThree[0].student.name}
                  </h4>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                    🥇 Batch Champion
                  </p>
                  <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
                    {topThree[0].student.points} pts
                  </p>
                  <div className="flex items-center justify-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-bold mt-1">
                    <Flame className="w-3.5 h-3.5 fill-orange-500" />
                    {topThree[0].student.streakDays || 1} Day Streak
                  </div>
                </Card>
              )}

              {/* Rank 3 */}
              {topThree[2] && (
                <Card className="order-3 text-center p-6 border-amber-700/30 bg-gradient-to-b from-amber-50/30 to-white dark:from-slate-900 dark:to-slate-900 shadow-md">
                  <div className="w-10 h-10 rounded-full bg-amber-700/20 text-amber-700 dark:text-amber-400 font-black text-sm flex items-center justify-center mx-auto mb-3">
                    3
                  </div>
                  <Avatar
                    src={topThree[2].student.avatar}
                    name={topThree[2].student.name}
                    size="lg"
                    className="mx-auto ring-4 ring-amber-700/40"
                  />
                  <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-3">
                    {topThree[2].student.name}
                  </h4>
                  <p className="text-xs text-gray-400">{topThree[2].student.department || 'CS Department'}</p>
                  <p className="text-lg font-black text-amber-700 dark:text-amber-500 mt-2">
                    {topThree[2].student.points} pts
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* Ranks 4+ Table */}
          {restEntries.length > 0 && (
            <Card className="divide-y divide-gray-100 dark:divide-slate-800/80 p-0 overflow-hidden shadow-xs">
              <div className="p-4 bg-gray-50/60 dark:bg-slate-900/60 flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>Rank &amp; Student</span>
                <span>Points &amp; Streak</span>
              </div>
              {restEntries.map((entry) => (
                <div
                  key={entry.student.id || entry.student._id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 font-bold text-xs flex items-center justify-center">
                      {entry.rank}
                    </span>
                    <Avatar src={entry.student.avatar} name={entry.student.name} size="md" />
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {entry.student.name}
                      </h4>
                      <p className="text-xs text-gray-400">{entry.student.email}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {entry.student.points} pts
                    </span>
                    <div className="flex items-center justify-end gap-1 text-[11px] text-orange-500 font-medium">
                      <Flame className="w-3 h-3 fill-orange-500" />
                      {entry.student.streakDays || 1}d streak
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  );
};
