import React, { useState, useEffect } from 'react';
import { challengeApi } from '../../api/challenge.api';
import { Challenge } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import {
  Target,
  Flame,
  Award,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Zap,
  Plus,
} from 'lucide-react';

export const ChallengesPage: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Active challenge runner
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create Challenge Modal (for Teachers / Admins)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
    category: 'DAILY' as 'DAILY' | 'WEEKLY' | 'MONTHLY',
    difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
    rewardPoints: 25,
    timeLimitMinutes: 10,
    tasks: [
      {
        question: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        hint: '',
      },
    ],
  });

  const { user } = useAuth();
  const { success, error } = useToast();
  const isTeacherOrAdmin = user?.role === 'FACULTY' || user?.role === 'ADMIN';

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const res = await challengeApi.getChallenges({
        category: categoryFilter || undefined,
      });
      if (res.success) {
        setChallenges(res.data);
      }
    } catch (err: any) {
      error('Failed to load challenges', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [categoryFilter]);

  const handleAddTask = () => {
    setChallengeForm((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          question: '',
          options: ['', '', '', ''],
          correctIndex: 0,
          hint: '',
        },
      ],
    }));
  };

  const handleRemoveTask = (index: number) => {
    if (challengeForm.tasks.length <= 1) return;
    setChallengeForm((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index),
    }));
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeForm.title.trim()) {
      error('Title required', 'Please provide a title for the challenge');
      return;
    }

    // Validate tasks
    for (let i = 0; i < challengeForm.tasks.length; i++) {
      const task = challengeForm.tasks[i];
      if (!task.question.trim()) {
        error('Question required', `Task ${i + 1} needs a question text`);
        return;
      }
      const validOptions = task.options.filter((o) => o.trim().length > 0);
      if (validOptions.length < 2) {
        error('Options required', `Task ${i + 1} must have at least 2 options`);
        return;
      }
    }

    const now = new Date();
    const endDate = new Date();
    if (challengeForm.category === 'DAILY') {
      endDate.setDate(now.getDate() + 1);
    } else if (challengeForm.category === 'WEEKLY') {
      endDate.setDate(now.getDate() + 7);
    } else {
      endDate.setDate(now.getDate() + 30);
    }

    setCreateLoading(true);
    try {
      const res = await challengeApi.createChallenge({
        title: challengeForm.title.trim(),
        description: challengeForm.description.trim(),
        category: challengeForm.category,
        difficulty: challengeForm.difficulty,
        rewardPoints: Number(challengeForm.rewardPoints) || 25,
        timeLimitMinutes: Number(challengeForm.timeLimitMinutes) || 10,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        tasks: challengeForm.tasks.map((t) => ({
          question: t.question.trim(),
          options: t.options.filter((o) => o.trim().length > 0),
          correctIndex: t.correctIndex,
          hint: t.hint.trim(),
        })),
      });

      if (res.success) {
        success('Challenge Published!', `"${challengeForm.title}" is now available for students`);
        setIsCreateOpen(false);
        setChallengeForm({
          title: '',
          description: '',
          category: 'DAILY',
          difficulty: 'MEDIUM',
          rewardPoints: 25,
          timeLimitMinutes: 10,
          tasks: [
            {
              question: '',
              options: ['', '', '', ''],
              correctIndex: 0,
              hint: '',
            },
          ],
        });
        fetchChallenges();
      }
    } catch (err: any) {
      error('Failed to create challenge', err.response?.data?.message || 'Error publishing challenge');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStartChallenge = (ch: Challenge) => {
    setActiveChallenge(ch);
    setSelectedAnswers(new Array(ch.tasks.length).fill(-1));
  };

  const handleSelectOption = (taskIndex: number, optionIndex: number) => {
    const updated = [...selectedAnswers];
    updated[taskIndex] = optionIndex;
    setSelectedAnswers(updated);
  };

  const handleSubmitChallenge = async () => {
    if (!activeChallenge) return;

    if (selectedAnswers.includes(-1)) {
      error('Incomplete', 'Please answer all questions before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await challengeApi.submitChallenge(activeChallenge._id, selectedAnswers);
      if (res.success) {
        success(
          'Challenge Finished!',
          `Score: ${res.data.score}/${res.data.maxScore} (+${res.data.pointsAwarded} pts)`
        );
        setActiveChallenge(null);
        fetchChallenges();
      }
    } catch (err: any) {
      error('Submission error', err.response?.data?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Gamification Header Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 text-white p-4 sm:p-6 md:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold">
                Continuous Gamification Arena
              </span>
              <span className="flex items-center gap-1 text-xs text-yellow-200 font-bold">
                <Flame className="w-4 h-4 fill-yellow-200" />
                Streak: {user?.streakDays || 1} Days
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Academic Challenges &amp; Leaderboard Points
            </h2>
            <p className="text-xs sm:text-sm text-yellow-100 max-w-xl">
              Complete daily coding puzzles, weekly algorithmic challenges, and monthly department quests to climb the institutional ranks and earn badges.
            </p>
          </div>

          {isTeacherOrAdmin && (
            <div className="flex-shrink-0">
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="bg-white hover:bg-yellow-50 text-amber-900 font-bold shadow-lg border-0"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Post Challenge
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['', 'DAILY', 'WEEKLY', 'MONTHLY'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              categoryFilter === cat
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:border-gray-300'
            }`}
          >
            {cat ? `${cat} Challenges` : 'All Categories'}
          </button>
        ))}
      </div>

      {/* Challenges Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      ) : challenges.length === 0 ? (
        <EmptyState
          icon={<Target className="w-6 h-6" />}
          title="No challenges available"
          description="Check back shortly for new daily or weekly challenges."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {challenges.map((ch) => (
            <Card
              key={ch._id}
              className="space-y-4 flex flex-col justify-between border-t-4 border-t-amber-500"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <Badge
                    variant={
                      ch.difficulty === 'EASY'
                        ? 'emerald'
                        : ch.difficulty === 'MEDIUM'
                        ? 'amber'
                        : 'red'
                    }
                  >
                    {ch.difficulty}
                  </Badge>

                  <Badge variant="gold" className="flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    +{ch.rewardPoints} pts
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {ch.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                  {ch.description}
                </p>

                <div className="flex items-center gap-3 text-xs text-gray-400 pt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    {ch.timeLimitMinutes} mins
                  </span>
                  <span>{ch.tasks?.length || 3} Tasks</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
                {ch.isCompleted ? (
                  <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Completed (+{ch.rewardPoints} pts awarded)
                    </span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() => handleStartChallenge(ch)}
                    leftIcon={<Zap className="w-4 h-4" />}
                  >
                    Solve Challenge
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Interactive Challenge Runner Modal */}
      <Modal
        isOpen={!!activeChallenge}
        onClose={() => setActiveChallenge(null)}
        title={activeChallenge?.title}
        description={`Time limit: ${activeChallenge?.timeLimitMinutes} mins • Earn +${activeChallenge?.rewardPoints} Academic Points`}
        maxWidth="2xl"
      >
        <div className="space-y-6">
          {activeChallenge?.tasks?.map((task, tIndex) => (
            <div
              key={tIndex}
              className="space-y-3 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800"
            >
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-relaxed">
                Task {tIndex + 1}: {task.question}
              </p>

              <div className="space-y-2">
                {task.options?.map((opt, oIndex) => (
                  <button
                    key={oIndex}
                    type="button"
                    onClick={() => handleSelectOption(tIndex, oIndex)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                      selectedAnswers[tIndex] === oIndex
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold ring-2 ring-amber-500/20'
                        : 'border-gray-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700/50 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="font-bold mr-2">{String.fromCharCode(65 + oIndex)}.</span>
                    {opt}
                  </button>
                ))}
              </div>

              {task.hint && (
                <p className="text-[11px] text-gray-400 italic">💡 Hint: {task.hint}</p>
              )}
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setActiveChallenge(null)}>
              Exit
            </Button>
            <Button
              type="button"
              isLoading={isSubmitting}
              onClick={handleSubmitChallenge}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Submit Challenge &amp; Claim Points
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Challenge Modal (for Teachers and Admins) */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create & Post New Challenge"
        description="Publish algorithmic puzzles, quizzes, and tasks for students to solve and earn points."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateChallenge} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Challenge Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Daily Graph Theory: Shortest Path Puzzle"
              value={challengeForm.title}
              onChange={(e) => setChallengeForm({ ...challengeForm, title: e.target.value })}
              className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-gray-900 dark:text-gray-100 focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Description / Instructions
            </label>
            <textarea
              placeholder="Provide context or explanation for this challenge..."
              value={challengeForm.description}
              onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })}
              rows={2}
              className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-gray-900 dark:text-gray-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={challengeForm.category}
                onChange={(e) => setChallengeForm({ ...challengeForm, category: e.target.value as any })}
                className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-gray-900 dark:text-gray-100"
              >
                <option value="DAILY">Daily (24 hrs)</option>
                <option value="WEEKLY">Weekly (7 days)</option>
                <option value="MONTHLY">Monthly (30 days)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Difficulty
              </label>
              <select
                value={challengeForm.difficulty}
                onChange={(e) => setChallengeForm({ ...challengeForm, difficulty: e.target.value as any })}
                className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-gray-900 dark:text-gray-100"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Reward Points
              </label>
              <input
                type="number"
                min={5}
                value={challengeForm.rewardPoints}
                onChange={(e) => setChallengeForm({ ...challengeForm, rewardPoints: Number(e.target.value) })}
                className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Time (mins)
              </label>
              <input
                type="number"
                min={1}
                value={challengeForm.timeLimitMinutes}
                onChange={(e) => setChallengeForm({ ...challengeForm, timeLimitMinutes: Number(e.target.value) })}
                className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Tasks & Questions List */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                Challenge Tasks ({challengeForm.tasks.length})
              </h4>
              <Button type="button" size="sm" variant="outline" onClick={handleAddTask}>
                + Add Another Task
              </Button>
            </div>

            {challengeForm.tasks.map((task, tIndex) => (
              <div
                key={tIndex}
                className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    Task {tIndex + 1}
                  </span>
                  {challengeForm.tasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(tIndex)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Enter question or task prompt..."
                    value={task.question}
                    onChange={(e) => {
                      const updated = [...challengeForm.tasks];
                      updated[tIndex].question = e.target.value;
                      setChallengeForm({ ...challengeForm, tasks: updated });
                    }}
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-2 text-xs text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-gray-500">
                    Options (Select radio button for the correct answer):
                  </span>
                  {task.options.map((opt, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${tIndex}`}
                        checked={task.correctIndex === oIndex}
                        onChange={() => {
                          const updated = [...challengeForm.tasks];
                          updated[tIndex].correctIndex = oIndex;
                          setChallengeForm({ ...challengeForm, tasks: updated });
                        }}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <input
                        type="text"
                        placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...challengeForm.tasks];
                          updated[tIndex].options[oIndex] = e.target.value;
                          setChallengeForm({ ...challengeForm, tasks: updated });
                        }}
                        className="flex-1 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-1.5 text-xs text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Optional hint for students..."
                    value={task.hint}
                    onChange={(e) => {
                      const updated = [...challengeForm.tasks];
                      updated[tIndex].hint = e.target.value;
                      setChallengeForm({ ...challengeForm, tasks: updated });
                    }}
                    className="w-full rounded-xl border border-dashed border-gray-300 dark:border-slate-600 bg-white/50 dark:bg-slate-900/50 p-1.5 text-xs text-gray-600 dark:text-gray-400"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createLoading} className="bg-amber-500 hover:bg-amber-600 text-white">
              Publish Challenge
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
