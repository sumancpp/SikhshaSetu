import React, { useState, useEffect } from 'react';
import { assignmentApi } from '../../api/assignment.api';
import { subjectApi } from '../../api/subject.api';
import { Assignment, Subject } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDateTime } from '../../utils/formatters';
import { FileText, Clock, Award, CheckCircle2, ArrowRight, UploadCloud, Download, Lock, FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AssignmentsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Student direct submission modal
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const isFacultyOrAdmin = user?.role === 'FACULTY' || user?.role === 'ADMIN';

  const fetchInitial = async () => {
    try {
      const res = await subjectApi.getSubjects();
      if (res.success && res.data.length > 0) {
        setSubjects(res.data);
        setSelectedSubjectId(res.data[0]._id);
      }
    } catch (err) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitial();
  }, []);

  const fetchAssignments = async () => {
    if (!selectedSubjectId) return;
    try {
      setLoading(true);
      const res = await assignmentApi.getAssignments(selectedSubjectId);
      if (res.success) {
        setAssignments(res.data);
      }
    } catch (err) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [selectedSubjectId]);

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !submissionFile) {
      error('Missing file', 'Please select a file to submit');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', submissionFile);
      if (submissionText) formData.append('submissionText', submissionText);

      const res = await assignmentApi.submitAssignment(selectedAssignment._id, formData);
      if (res.success) {
        success('Submission Received!', 'Your assignment has been submitted successfully.');
        setSelectedAssignment(null);
        setSubmissionFile(null);
        setSubmissionText('');
        fetchAssignments();
      }
    } catch (err: any) {
      error('Submission failed', err.response?.data?.message || 'Could not submit file');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
          Assignments &amp; Submissions
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Track upcoming coursework deadlines, submit project files, and view faculty marks &amp; feedback
        </p>
      </div>

      {/* Subject Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {subjects.map((sub) => (
          <button
            key={sub._id}
            onClick={() => setSelectedSubjectId(sub._id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedSubjectId === sub._id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            {sub.name} ({sub.code})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6" />}
          title="No assignments posted"
          description="There are no assignments due for this subject at the moment."
        />
      ) : (
        <div className="space-y-4">
          {assignments.map((asg) => (
            <Card
              key={asg._id}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 hover:border-blue-300 dark:hover:border-blue-800"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {asg.title}
                  </h3>
                  <Badge variant="gold" className="flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    +{asg.rewardPoints} pts
                  </Badge>
                  <Badge variant="gray">Max Marks: {asg.maxMarks}</Badge>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {asg.description || asg.instructions}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
                  <span className="flex items-center gap-1 text-red-500 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    Due: {formatDateTime(asg.dueDate)}
                  </span>
                  <span>Faculty: {asg.createdBy?.name || 'Instructor'}</span>
                  {asg.submissionsCount !== undefined && (
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      • {asg.submissionsCount} Submissions
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isFacultyOrAdmin ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/subjects/${asg.subjectId}`)}
                    leftIcon={<FileCheck className="w-4 h-4" />}
                  >
                    Review Submissions ({asg.submissionsCount || 0})
                  </Button>
                ) : (
                  <>
                    {asg.mySubmission ? (
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              asg.mySubmission.status === 'GRADED'
                                ? 'emerald'
                                : asg.mySubmission.status === 'LATE'
                                ? 'amber'
                                : 'blue'
                            }
                          >
                            {asg.mySubmission.status === 'GRADED'
                              ? `Graded: ${asg.mySubmission.marksObtained}/${asg.maxMarks}`
                              : asg.mySubmission.status === 'LATE'
                              ? 'Late Submission'
                              : 'Turned In'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAssignment(asg)}
                            leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
                          >
                            Resubmit
                          </Button>
                        </div>

                        {asg.mySubmission.fileName && (
                          <a
                            href={asg.mySubmission.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                          >
                            <span>Uploaded: {asg.mySubmission.fileName}</span>
                            <Download className="w-3 h-3" />
                          </a>
                        )}

                        {asg.mySubmission.feedback && (
                          <div className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-left max-w-xs mt-0.5">
                            <span className="font-semibold block">Faculty Feedback:</span>
                            &ldquo;{asg.mySubmission.feedback}&rdquo;
                          </div>
                        )}
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setSelectedAssignment(asg)}
                        leftIcon={<UploadCloud className="w-4 h-4" />}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                      >
                        Submit Your Assignment
                      </Button>
                    )}
                  </>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`/subjects/${asg.subjectId}`)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Workspace
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Direct Assignment Submission Modal */}
      <Modal
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        title={`Submit: ${selectedAssignment?.title}`}
        description="Upload your coursework file. Submissions are strictly confidential and only visible to the course faculty."
      >
        <form onSubmit={handleSubmitAssignment} className="space-y-4">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-300 text-xs">
            <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong className="font-bold">Confidential Submission:</strong> Only your course faculty can review and grade your submitted file. Other students cannot access your work.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Select Submission File (PDF, DOCX, ZIP, Code)
            </label>
            <input
              type="file"
              required
              onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-slate-800 dark:file:text-blue-300 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Submission Notes / GitHub Repository Link (Optional)
            </label>
            <textarea
              className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
              placeholder="Add any comments or notes for the faculty..."
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setSelectedAssignment(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
              Turn In Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
