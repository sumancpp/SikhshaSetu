import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../api/auth.api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Award, Flame, Trophy, ShieldCheck, CheckCircle2, Lock, Edit3 } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const SYSTEM_BADGES = [
  { code: 'FIRST_LOGIN', title: 'Pioneer Voyager', description: 'Signed in and joined the ShikshaSetu platform', icon: '🚀', pointsRequired: 10 },
  { code: 'FIRST_SUBMISSION', title: 'First Task Turn-In', description: 'Submitted your first assignment on time', icon: '📝', pointsRequired: 50 },
  { code: 'PERFECT_QUIZ', title: 'Quiz Ace', description: 'Scored 100% on a course quiz', icon: '💯', pointsRequired: 40 },
  { code: 'CHALLENGE_SOLVER', title: 'Problem Hunter', description: 'Successfully solved an academic challenge', icon: '🎯', pointsRequired: 50 },
  { code: 'STREAK_7', title: 'Weekly Scholar', description: 'Maintained a continuous 7-day study streak', icon: '🔥', pointsRequired: 70 },
  { code: 'FORUM_HELPER', title: 'Academic Mentor', description: 'Answered a question marked as the accepted solution', icon: '🌟', pointsRequired: 80 },
  { code: 'CENTURION', title: 'Centurion Master', description: 'Accumulated 100+ total academic points', icon: '👑', pointsRequired: 100 },
];

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { success, error } = useToast();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await authApi.updateProfile({ bio, department });
      if (res.success) {
        success('Profile Updated', 'Your profile details have been saved');
        setIsEditOpen(false);
        refreshUser();
      }
    } catch (err: any) {
      error('Failed to update', err.response?.data?.message);
    } finally {
      setIsSaving(false);
    }
  };

  const userPoints = user?.points || 0;

  return (
    <div className="space-y-8">
      {/* Profile Card Header */}
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar src={user?.avatar} name={user?.name} size="xl" className="ring-4 ring-blue-500/20" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
                  {user?.name}
                </h2>
                <Badge variant={user?.role === 'ADMIN' ? 'purple' : user?.role === 'FACULTY' ? 'blue' : 'emerald'}>
                  {user?.role}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              <p className="text-xs text-gray-400">
                {user?.department || 'Department of Computer Science'} {user?.studentId ? `• ID: ${user.studentId}` : ''}
              </p>
              {user?.bio && <p className="text-xs text-gray-600 dark:text-gray-300 italic pt-1">{user.bio}</p>}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBio(user?.bio || '');
              setDepartment(user?.department || '');
              setIsEditOpen(true);
            }}
            leftIcon={<Edit3 className="w-4 h-4" />}
          >
            Edit Profile
          </Button>
        </div>
      </Card>

      {/* Gamification Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Academic Points</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">{userPoints}</h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">Points Ledger Balance</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Learning Streak</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">{user?.streakDays || 1} Days</h3>
            <p className="text-[11px] text-orange-600 dark:text-orange-400 mt-0.5">Continuous Activity</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Badges Unlocked</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">
              {SYSTEM_BADGES.filter((b) => userPoints >= b.pointsRequired).length} / {SYSTEM_BADGES.length}
            </h3>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">Milestone Honors</p>
          </div>
        </Card>
      </div>

      {/* Badges & Achievements Grid */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Achievements &amp; Badges</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Badges are automatically awarded when point thresholds and academic milestones are achieved
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {SYSTEM_BADGES.map((badge) => {
            const isUnlocked = userPoints >= badge.pointsRequired;
            return (
              <Card
                key={badge.code}
                className={`space-y-3 text-center p-5 transition-all ${
                  isUnlocked
                    ? 'border-amber-300 dark:border-amber-700/60 bg-gradient-to-b from-amber-50/40 to-white dark:from-amber-950/20 dark:to-slate-900 shadow-sm'
                    : 'opacity-60 grayscale bg-gray-50 dark:bg-slate-900/40'
                }`}
              >
                <div className="text-3xl mx-auto">{badge.icon}</div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">{badge.title}</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                  {badge.description}
                </p>

                <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-center gap-1 text-[11px]">
                  {isUnlocked ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Unlocked
                    </span>
                  ) : (
                    <span className="text-gray-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Requires {badge.pointsRequired} pts
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Profile"
        description="Update your bio and department information."
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Academic Bio
            </label>
            <textarea
              className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your classmates about your academic interests..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
