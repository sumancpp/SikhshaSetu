import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../api/analytics.api';
import { Subject, SubjectAtRiskSummary, StudentRiskProfile, RiskTier } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Skeleton } from '../common/Skeleton';
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Sparkles,
  Search,
  BookOpen,
  HelpCircle,
  Mail,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface AtRiskStudentDashboardProps {
  subject: Subject;
}

export const AtRiskStudentDashboard: React.FC<AtRiskStudentDashboardProps> = ({ subject }) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SubjectAtRiskSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');

  // Intervention Modal State
  const [selectedStudent, setSelectedStudent] = useState<StudentRiskProfile | null>(null);
  const [interventionMessage, setInterventionMessage] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [submittingIntervention, setSubmittingIntervention] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getSubjectAtRiskAnalytics(subject._id);
      if (res.success) {
        setData(res.data);
      }
    } catch (err: any) {
      error('Failed to load At-Risk analytics', err.response?.data?.message || 'Could not fetch data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [subject._id]);

  const handleOpenIntervention = (student: StudentRiskProfile) => {
    setSelectedStudent(student);
    setInterventionMessage(
      `Hello ${student.name}, I noticed your assignment submission rate in ${subject.name} has dipped to ${student.metrics.submissionRate}%. Let's work together to get you back on track before semester exams.`
    );
    setActionPlan(student.aiInterventionSuggestion);
    setSendEmailNotification(true);
  };

  const handleSendIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setSubmittingIntervention(true);
    try {
      const res = await analyticsApi.sendIntervention(subject._id, {
        studentId: selectedStudent.studentId,
        message: interventionMessage,
        actionPlan,
        sendEmailNotification,
      });
      if (res.success) {
        success('Intervention Sent 🚀', `Academic guidance delivered to ${selectedStudent.name}.`);
        setSelectedStudent(null);
      }
    } catch (err: any) {
      error('Failed to send intervention', err.response?.data?.message || 'Could not deliver alert.');
    } finally {
      setSubmittingIntervention(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="p-12 text-center border border-gray-200 dark:border-slate-800">
        <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No student performance data available for this subject.</p>
      </Card>
    );
  }

  const filteredStudents = data.students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = selectedTier === 'ALL' || s.riskTier === selectedTier;
    return matchesSearch && matchesTier;
  });

  const getTierBadge = (tier: RiskTier) => {
    switch (tier) {
      case 'CRITICAL':
        return <Badge variant="red" className="font-bold">🚨 Critical Attention</Badge>;
      case 'HIGH':
        return <Badge variant="amber" className="font-bold">⚠️ High Risk</Badge>;
      case 'MODERATE':
        return <Badge variant="purple" className="font-semibold">🟡 Moderate Risk</Badge>;
      default:
        return <Badge variant="emerald" className="font-semibold">🟢 On Track</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-600/10 via-amber-500/10 to-purple-600/10 border border-red-200 dark:border-red-900/40 rounded-3xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-red-600 text-white shadow-md">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                At-Risk Student Early Intervention Center
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              AI-driven multi-factor analytics detecting submission deficits, quiz dips, and tardiness before final exams.
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchAnalytics}
            className="self-start sm:self-auto bg-white/80 dark:bg-slate-800"
          >
            Refresh Analytics
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-l-red-600 bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/50">
          <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
            Critical Risk
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-red-700 dark:text-red-300">
              {data.counts.critical}
            </span>
            <span className="text-xs text-red-600 font-medium">Needs 1-on-1</span>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            High Risk
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-700 dark:text-amber-300">
              {data.counts.high}
            </span>
            <span className="text-xs text-amber-600 font-medium">Needs Nudge</span>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-purple-500 bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Moderate Risk
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-700 dark:text-purple-300">
              {data.counts.moderate}
            </span>
            <span className="text-xs text-purple-600 font-medium">Watchlist</span>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Safe / On Track
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
              {data.counts.safe}
            </span>
            <span className="text-xs text-emerald-600 font-medium">Good Standing</span>
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'SAFE'].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedTier === tier
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {tier === 'ALL' ? 'All Students' : tier}
            </button>
          ))}
        </div>
      </Card>

      {/* Student List */}
      <div className="space-y-4">
        {filteredStudents.length === 0 ? (
          <Card className="p-12 text-center border border-gray-200 dark:border-slate-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">No students match this filter</h4>
            <p className="text-xs text-gray-500 mt-1">All filtered students are in safe standing.</p>
          </Card>
        ) : (
          filteredStudents.map((student) => (
            <Card
              key={student.studentId}
              className={`p-6 border transition-all ${
                student.riskTier === 'CRITICAL'
                  ? 'border-red-300 dark:border-red-900/60 bg-red-50/10 dark:bg-red-950/10'
                  : student.riskTier === 'HIGH'
                  ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/10 dark:bg-amber-950/10'
                  : 'border-gray-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Student Info & Tier */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
                    {student.avatarUrl ? (
                      <img src={student.avatarUrl} alt={student.name} className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      student.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">{student.name}</h4>
                      {getTierBadge(student.riskTier)}
                    </div>
                    <p className="text-xs text-gray-500">{student.email}</p>

                    {student.riskFactors.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        {student.riskFactors.map((factor, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-red-100/80 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40"
                          >
                            <AlertCircle className="w-3 h-3 text-red-500" />
                            {factor}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance Meters */}
                <div className="grid grid-cols-3 gap-4 lg:w-96 text-center border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-6">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Submissions</span>
                    <p className="text-base font-bold text-gray-900 dark:text-gray-100 mt-1">
                      {student.metrics.submissionRate}%
                    </p>
                    <span className="text-[10px] text-gray-500">
                      {student.metrics.submittedAssignments}/{student.metrics.totalAssignments}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Quiz Average</span>
                    <p className="text-base font-bold text-gray-900 dark:text-gray-100 mt-1">
                      {student.metrics.avgQuizScorePercentage}%
                    </p>
                    <span className="text-[10px] text-gray-500">
                      {student.metrics.attemptedQuizzes}/{student.metrics.totalQuizzes} done
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Risk Index</span>
                    <p
                      className={`text-base font-extrabold mt-1 ${
                        student.atRiskScore >= 65
                          ? 'text-red-600 dark:text-red-400'
                          : student.atRiskScore >= 45
                          ? 'text-amber-500'
                          : 'text-emerald-500'
                      }`}
                    >
                      {student.atRiskScore}%
                    </p>
                    <span className="text-[10px] text-gray-400">Overall</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end lg:self-center">
                  <Button
                    size="sm"
                    onClick={() => handleOpenIntervention(student)}
                    className={`${
                      student.riskTier === 'CRITICAL' || student.riskTier === 'HIGH'
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    } rounded-xl px-4 text-xs font-semibold`}
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Send Intervention Alert
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Intervention Modal */}
      {selectedStudent && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedStudent(null)}
          title={`🚨 Academic Intervention: ${selectedStudent.name}`}
        >
          <form onSubmit={handleSendIntervention} className="space-y-4">
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-red-700 dark:text-red-300">
                  Student Risk Tier: {selectedStudent.riskTier} ({selectedStudent.atRiskScore}%)
                </span>
                <span className="text-gray-500">{selectedStudent.email}</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Submission Rate: {selectedStudent.metrics.submissionRate}% | Quiz Average: {selectedStudent.metrics.avgQuizScorePercentage}%
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <span>Instructor Guidance Note:</span>
                <span className="text-[10px] text-gray-400">Personalized encouragement</span>
              </label>
              <textarea
                rows={3}
                required
                value={interventionMessage}
                onChange={(e) => setInterventionMessage(e.target.value)}
                className="w-full p-3 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  AI Suggested Academic Recovery Action Plan:
                </span>
                <button
                  type="button"
                  onClick={() => setActionPlan(selectedStudent.aiInterventionSuggestion)}
                  className="text-[11px] text-purple-600 hover:underline"
                >
                  Reset AI Suggestion
                </button>
              </label>
              <textarea
                rows={3}
                value={actionPlan}
                onChange={(e) => setActionPlan(e.target.value)}
                className="w-full p-3 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={sendEmailNotification}
                onChange={(e) => setSendEmailNotification(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gray-500" />
                Also send formal academic notification email to {selectedStudent.email}
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedStudent(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submittingIntervention}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
              >
                {submittingIntervention ? 'Dispatching Notice...' : 'Send Intervention Alert'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
