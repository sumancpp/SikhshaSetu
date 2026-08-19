import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { subjectApi } from '../../api/subject.api';
import { materialApi } from '../../api/material.api';
import { assignmentApi } from '../../api/assignment.api';
import { quizApi } from '../../api/quiz.api';
import { forumApi } from '../../api/forum.api';
import { Subject, Material, Assignment, Quiz, ForumPost, LeaderboardEntry, AiRubricEvaluation } from '../../types';
import { aiApi } from '../../api/ai.api';
import { AiDoubtAssistant } from '../../components/ai/AiDoubtAssistant';
import { AiFlashcardsDeck } from '../../components/ai/AiFlashcardsDeck';
import { AiQuizGeneratorModal } from '../../components/ai/AiQuizGeneratorModal';
import { AtRiskStudentDashboard } from '../../components/analytics/AtRiskStudentDashboard';
import { StudentAcademicHealthCard } from '../../components/analytics/StudentAcademicHealthCard';
import { useExamIntegrityGuard } from '../../hooks/useExamIntegrityGuard';
import { ExamProctorGuard } from '../../components/common/ExamProctorGuard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Tabs } from '../../components/common/Tabs';
import { Skeleton } from '../../components/common/Skeleton';
import { Avatar } from '../../components/common/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSocket } from '../../context/SocketContext';
import { formatDate, formatDateTime, formatFileSize } from '../../utils/formatters';
import {
  BookOpen,
  FileText,
  HelpCircle,
  MessageSquare,
  Users,
  Trophy,
  Plus,
  Download,
  Eye,
  Calendar,
  Award,
  UploadCloud,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Sparkles,
  FileCheck,
  UserPlus,
  Search,
  Trash2,
  GraduationCap,
  Lock,
  BarChart3,
  XCircle,
  Percent,
  AlertTriangle,
} from 'lucide-react';

export const SubjectWorkspacePage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('materials');

  // Materials Filter, Search & Upload Modal
  const [materialTypeFilter, setMaterialTypeFilter] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  const [isUploadMaterialOpen, setIsUploadMaterialOpen] = useState(false);
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    type: 'NOTE',
    tags: '',
  });
  const [materialUploading, setMaterialUploading] = useState(false);

  // People Tab Student Search & Enrollment Modal
  const [studentSearch, setStudentSearch] = useState('');
  const [isEnrollStudentOpen, setIsEnrollStudentOpen] = useState(false);
  const [enrollStudentInput, setEnrollStudentInput] = useState('');
  const [enrollingStudent, setEnrollingStudent] = useState(false);

  // Assignment Creation Modal
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxMarks: 100,
    rewardPoints: 50,
    allowLateSubmissions: true,
  });
  const [assignmentCreating, setAssignmentCreating] = useState(false);

  // Student Assignment Submission Modal
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Faculty Grading Modal
  const [gradingAssignment, setGradingAssignment] = useState<Assignment | null>(null);
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingMarks, setGradingMarks] = useState<Record<string, number>>({});
  const [gradingFeedback, setGradingFeedback] = useState<Record<string, string>>({});

  // Quiz Modal (Runner)
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // 🛡️ Academic Integrity Guard for Quizzes
  const quizIntegrity = useExamIntegrityGuard({
    enabled: Boolean(activeQuiz),
    examName: activeQuiz?.title || 'Course Quiz Assessment',
    maxViolations: 3,
    onMaxViolationsExceeded: () => {
      handleCompleteQuiz();
    },
  });

  // Quiz Creation Modal
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false);
  const [quizCreating, setQuizCreating] = useState(false);
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    type: 'NATIVE_MCQ' as 'NATIVE_MCQ' | 'GOOGLE_FORM',
    googleFormUrl: '',
    timeLimitMinutes: 15,
    attemptLimit: 1,
    rewardPoints: 30,
    questions: [
      {
        questionText: '',
        type: 'MCQ' as const,
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
        explanation: '',
        marks: 1,
      },
    ],
  });

  // Forum New Post Modal
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [postForm, setPostForm] = useState({ title: '', description: '', tags: '' });
  const [postingForum, setPostingForum] = useState(false);

  // Quiz Results Modal (Faculty & Admin)
  const [selectedQuizForResults, setSelectedQuizForResults] = useState<Quiz | null>(null);
  const [quizResultsData, setQuizResultsData] = useState<any | null>(null);
  const [loadingQuizResults, setLoadingQuizResults] = useState(false);

  // AI Superpowers State
  const [isAiQuizGeneratorOpen, setIsAiQuizGeneratorOpen] = useState(false);
  const [aiSubMode, setAiSubMode] = useState<'doubt' | 'flashcards'>('doubt');
  const [loadingAiRubric, setLoadingAiRubric] = useState<Record<string, boolean>>({});
  const [aiRubricData, setAiRubricData] = useState<Record<string, AiRubricEvaluation>>({});

  const { user } = useAuth();
  const { success, error, info } = useToast();
  const { joinSubject, leaveSubject } = useSocket();

  const fetchAllWorkspaceData = async () => {
    if (!subjectId) return;
    try {
      setLoading(true);
      const res = await subjectApi.getSubjectWorkspace(subjectId);
      if (res.success) {
        setSubject(res.data.subject);
        setMaterials(res.data.materials || []);
        setAssignments(res.data.assignments || []);
        setQuizzes(res.data.quizzes || []);
        setForumPosts(res.data.forumPosts || []);
        setLeaderboard(res.data.leaderboard || []);
        setStudents(res.data.students || []);
        setFaculties(res.data.faculties || []);
      }
    } catch (err: any) {
      error('Failed to load subject workspace', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllWorkspaceData();
    if (subjectId) {
      joinSubject(subjectId);
    }
    return () => {
      if (subjectId) leaveSubject(subjectId);
    };
  }, [subjectId]);

  // Handle Material Upload
  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !materialFile) {
      error('Missing file', 'Please select a file to upload');
      return;
    }

    setMaterialUploading(true);
    try {
      const formData = new FormData();
      formData.append('subjectId', subjectId);
      formData.append('classId', typeof subject?.classId === 'object' ? subject.classId._id : subject?.classId || '');
      formData.append('title', materialForm.title);
      formData.append('description', materialForm.description);
      formData.append('type', materialForm.type);
      formData.append('tags', materialForm.tags);
      formData.append('file', materialFile);

      const res = await materialApi.uploadMaterial(formData);
      if (res.success) {
        success('Material Uploaded!', `${materialForm.title} is now published`);
        setIsUploadMaterialOpen(false);
        setMaterialFile(null);
        setMaterialForm({ title: '', description: '', type: 'NOTE', tags: '' });
        fetchAllWorkspaceData();
      }
    } catch (err: any) {
      error('Upload failed', err.response?.data?.message);
    } finally {
      setMaterialUploading(false);
    }
  };

  // Handle Delete Material
  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this study material?')) return;
    try {
      const res = await materialApi.deleteMaterial(materialId);
      if (res.success) {
        success('Material Deleted', 'Study material removed successfully');
        fetchAllWorkspaceData();
      }
    } catch (err: any) {
      error('Delete failed', err.response?.data?.message);
    }
  };

  // Handle Student Enrollment
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = enrollStudentInput.trim();
    if (!subjectId || !input) {
      error('Missing input', 'Please enter student email or ID');
      return;
    }

    setEnrollingStudent(true);
    try {
      const isEmail = input.includes('@');
      const res = await subjectApi.enrollStudent(
        subjectId,
        isEmail ? { email: input } : { studentId: input }
      );
      if (res.success) {
        success('Student Enrolled!', 'Student has been added to this subject');
        setIsEnrollStudentOpen(false);
        setEnrollStudentInput('');
        fetchAllWorkspaceData();
      }
    } catch (err: any) {
      error('Enrollment Failed', err.response?.data?.message || 'Could not find or enroll student');
    } finally {
      setEnrollingStudent(false);
    }
  };

  // Handle Assignment Creation
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) return;

    setAssignmentCreating(true);
    try {
      const res = await assignmentApi.createAssignment({
        ...assignmentForm,
        subjectId,
        classId: typeof subject?.classId === 'object' ? subject.classId._id : subject?.classId,
      });
      if (res.success) {
        success('Assignment Created!', `Assignment posted with +${assignmentForm.rewardPoints} reward points`);
        setIsCreateAssignmentOpen(false);
        setAssignmentForm({
          title: '',
          description: '',
          dueDate: '',
          maxMarks: 100,
          rewardPoints: 50,
          allowLateSubmissions: true,
        });
        fetchAllWorkspaceData();
      }
    } catch (err: any) {
      error('Failed to create assignment', err.response?.data?.message);
    } finally {
      setAssignmentCreating(false);
    }
  };

  // Handle Student Assignment Submission
  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !submissionFile) {
      error('Missing file', 'Please select a document or code file to submit');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', submissionFile);
      if (submissionText) formData.append('submissionText', submissionText);

      const res = await assignmentApi.submitAssignment(selectedAssignment._id, formData);
      if (res.success) {
        success('Submission Received!', 'Your assignment has been submitted successfully');
        setSelectedAssignment(null);
        setSubmissionFile(null);
        setSubmissionText('');
        fetchAllWorkspaceData();
      }
    } catch (err: any) {
      error('Submission failed', err.response?.data?.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Open Faculty Grading view
  const handleOpenGrading = async (assignment: Assignment) => {
    setGradingAssignment(assignment);
    setLoadingSubmissions(true);
    try {
      const res = await assignmentApi.getSubmissions(assignment._id);
      if (res.success) {
        setSubmissionsList(res.data);
      }
    } catch (err: any) {
      error('Failed to load submissions', err.response?.data?.message);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Grade individual submission
  const handleGradeSubmission = async (submissionId: string) => {
    const marks = gradingMarks[submissionId];
    const feedback = gradingFeedback[submissionId];

    if (marks === undefined || isNaN(marks)) {
      error('Invalid marks', 'Please enter marks obtained');
      return;
    }

    try {
      const res = await assignmentApi.gradeSubmission(submissionId, {
        marksObtained: marks,
        feedback,
      });
      if (res.success) {
        success('Graded!', `Awarded ${res.data.pointsAwarded || 0} points to student`);
        // Refresh list
        if (gradingAssignment) handleOpenGrading(gradingAssignment);
      }
    } catch (err: any) {
      error('Failed to save grade', err.response?.data?.message);
    }
  };

  // AI Rubric Evaluation Handler
  const handleAiRubricGrade = async (assignmentId: string, submissionId: string) => {
    setLoadingAiRubric((prev) => ({ ...prev, [submissionId]: true }));
    try {
      const res = await aiApi.gradeSubmission({ assignmentId, submissionId });
      if (res.success && res.data) {
        setAiRubricData((prev) => ({ ...prev, [submissionId]: res.data }));
        setGradingMarks((prev) => ({ ...prev, [submissionId]: res.data.suggestedMarks }));
        setGradingFeedback((prev) => ({ ...prev, [submissionId]: res.data.suggestedFeedback }));
        success('AI Rubric Analysis Complete! 🤖', `Suggested Score: ${res.data.suggestedMarks}/${res.data.maxMarks}`);
      }
    } catch (err: any) {
      error('AI Evaluation Failed', err.response?.data?.message || 'Could not evaluate submission with AI.');
    } finally {
      setLoadingAiRubric((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  // Quiz Creation Helpers
  const handleAddQuestion = () => {
    setQuizForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: '',
          type: 'MCQ',
          options: [
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
          ],
          explanation: '',
          marks: 1,
        },
      ],
    }));
  };

  const handleRemoveQuestion = (qIndex: number) => {
    if (quizForm.questions.length <= 1) {
      error('Cannot remove', 'A quiz must contain at least 1 question');
      return;
    }
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== qIndex),
    }));
  };

  const handleQuestionTextChange = (qIndex: number, text: string) => {
    setQuizForm((prev) => {
      const updated = [...prev.questions];
      updated[qIndex] = { ...updated[qIndex], questionText: text };
      return { ...prev, questions: updated };
    });
  };

  const handleOptionTextChange = (qIndex: number, optIndex: number, text: string) => {
    setQuizForm((prev) => {
      const updatedQuestions = [...prev.questions];
      const updatedOptions = [...updatedQuestions[qIndex].options];
      updatedOptions[optIndex] = { ...updatedOptions[optIndex], text };
      updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], options: updatedOptions };
      return { ...prev, questions: updatedQuestions };
    });
  };

  const handleOptionCorrectChange = (qIndex: number, correctOptIndex: number) => {
    setQuizForm((prev) => {
      const updatedQuestions = [...prev.questions];
      const updatedOptions = updatedQuestions[qIndex].options.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === correctOptIndex,
      }));
      updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], options: updatedOptions };
      return { ...prev, questions: updatedQuestions };
    });
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) return;

    if (!quizForm.title.trim()) {
      error('Title required', 'Please enter a title for the quiz');
      return;
    }

    if (quizForm.type === 'NATIVE_MCQ') {
      for (let i = 0; i < quizForm.questions.length; i++) {
        const q = quizForm.questions[i];
        if (!q.questionText.trim()) {
          error('Incomplete Question', `Question ${i + 1} text cannot be empty`);
          return;
        }
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].text.trim()) {
            error('Incomplete Option', `Question ${i + 1}, Option ${String.fromCharCode(65 + j)} cannot be empty`);
            return;
          }
        }
      }
    } else if (quizForm.type === 'GOOGLE_FORM' && !quizForm.googleFormUrl.trim()) {
      error('Missing Link', 'Please enter a valid Google Form URL');
      return;
    }

    setQuizCreating(true);
    try {
      const res = await quizApi.createQuiz({
        ...quizForm,
        subjectId,
        classId: typeof subject?.classId === 'object' ? subject.classId._id : subject?.classId,
      });
      if (res.success) {
        success('Quiz Created!', `Quiz has been scheduled with +${quizForm.rewardPoints} points reward`);
        setIsCreateQuizOpen(false);
        setQuizForm({
          title: '',
          description: '',
          type: 'NATIVE_MCQ',
          googleFormUrl: '',
          timeLimitMinutes: 15,
          attemptLimit: 1,
          rewardPoints: 30,
          questions: [
            {
              questionText: '',
              type: 'MCQ',
              options: [
                { text: '', isCorrect: true },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
              ],
              explanation: '',
              marks: 1,
            },
          ],
        });
        fetchAllWorkspaceData();
      }
    } catch (err: any) {
      error('Failed to create quiz', err.response?.data?.message || 'Error occurred while saving quiz');
    } finally {
      setQuizCreating(false);
    }
  };

  // Handle MCQ Quiz submission
  const handleCompleteQuiz = async () => {
    if (!activeQuiz) return;
    setSubmittingQuiz(true);
    try {
      const answersArray = (activeQuiz.questions || []).map((q, idx) => ({
        questionIndex: idx,
        selectedOptionIndices: quizAnswers[idx] !== undefined ? [quizAnswers[idx]] : [],
        selectedOptionIndex: quizAnswers[idx] !== undefined ? quizAnswers[idx] : -1,
      }));

      const res = await quizApi.submitQuizAttempt(activeQuiz._id, answersArray);
      if (res.success) {
        success('Quiz Completed!', `Scored ${res.data.score}/${res.data.maxScore} (+${res.data.pointsAwarded} pts)`);
        setActiveQuiz(null);
        setQuizAnswers({});
        fetchAllWorkspaceData();
      }
    } catch (err: any) {
      error('Quiz submission failed', err.response?.data?.message || 'Unable to submit answers');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // Handle Faculty & Admin Opening Quiz Results
  const handleOpenQuizResults = async (quiz: Quiz) => {
    setSelectedQuizForResults(quiz);
    setLoadingQuizResults(true);
    try {
      const res = await quizApi.getQuizResults(quiz._id);
      if (res.success) {
        setQuizResultsData(res.data);
      }
    } catch (err: any) {
      error('Failed to load quiz results', err.response?.data?.message || 'Could not fetch results');
    } finally {
      setLoadingQuizResults(false);
    }
  };

  // Handle Forum Post creation
  const handleCreateForumPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) return;

    setPostingForum(true);
    try {
      const res = await forumApi.createPost({
        ...postForm,
        subjectId,
        classId: typeof subject?.classId === 'object' ? subject.classId._id : subject?.classId,
        tags: postForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      if (res.success) {
        success('Discussion Started!', 'Your question was posted to the subject forum');
        setIsNewPostOpen(false);
        setPostForm({ title: '', description: '', tags: '' });
        fetchAllWorkspaceData();
      }
    } catch (err: any) {
      error('Failed to post question', err.response?.data?.message);
    } finally {
      setPostingForum(false);
    }
  };

  // Handle Forum Post voting
  const handleVotePost = async (postId: string, voteValue: number) => {
    try {
      const res = await forumApi.handleVote(postId, 'POST', voteValue);
      if (res.success) {
        setForumPosts((prev) =>
          prev.map((p) =>
            p._id === postId
              ? {
                  ...p,
                  upvotesCount: res.data.upvotesCount,
                  downvotesCount: res.data.downvotesCount,
                  userVote: res.data.userVote,
                }
              : p
          )
        );
      }
    } catch (err: any) {
      error('Voting failed', err.response?.data?.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!subject) {
    return (
      <EmptyState
        title="Subject Not Found"
        description="The requested subject workspace does not exist or you do not have permission to view it."
      />
    );
  }

  const isFacultyOrAdmin = user?.role === 'ADMIN' || user?.role === 'FACULTY';
  const classNameStr = typeof subject.classId === 'object' ? subject.classId.name : 'Class';
  const classIdStr = typeof subject.classId === 'object' ? subject.classId._id : subject.classId;

  const filteredMaterials = materials.filter((m) => {
    const matchesType = !materialTypeFilter || m.type === materialTypeFilter;
    const matchesSearch =
      !materialSearch ||
      m.title?.toLowerCase().includes(materialSearch.toLowerCase()) ||
      m.description?.toLowerCase().includes(materialSearch.toLowerCase()) ||
      m.tags?.some((t) => t.toLowerCase().includes(materialSearch.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const filteredStudents = students.filter((s) => {
    if (!studentSearch) return true;
    const q = studentSearch.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.studentId?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Classes', to: '/classes' },
          { label: classNameStr, to: `/classes/${classIdStr}` },
          { label: subject.name },
        ]}
      />

      {/* Subject Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-sky-900 text-white p-4 sm:p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="blue" className="bg-white/20 text-white border-white/30 text-xs">
                {subject.code}
              </Badge>
              <span className="text-xs text-blue-200">
                Semester {subject.semester} {subject.credits ? `• ${subject.credits} Credits` : ''}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{subject.name}</h1>
            <p className="text-xs text-blue-200 max-w-xl">{subject.description}</p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <Avatar src={subject.primaryFacultyId?.avatar} name={subject.primaryFacultyId?.name} size="lg" />
            <div>
              <p className="text-[11px] text-blue-200 uppercase font-semibold tracking-wider">Instructor</p>
              <p className="text-sm font-bold text-white">{subject.primaryFacultyId?.name || 'Prof. Faculty'}</p>
              <p className="text-xs text-blue-300">{subject.primaryFacultyId?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-2">
        <Tabs
          tabs={[
            { id: 'materials', label: 'Study Materials', count: materials.length, icon: <BookOpen className="w-4 h-4" /> },
            { id: 'assignments', label: 'Assignments', count: assignments.length, icon: <FileText className="w-4 h-4" /> },
            { id: 'quizzes', label: 'Quizzes', count: quizzes.length, icon: <HelpCircle className="w-4 h-4" /> },
            { id: 'ai-tutor', label: 'AI Knowledge Tutor', icon: <Sparkles className="w-4 h-4 text-purple-500" /> },
            ...(isFacultyOrAdmin
              ? [{ id: 'at-risk', label: 'At-Risk Radar', icon: <AlertTriangle className="w-4 h-4 text-red-500" /> }]
              : []),
            { id: 'forum', label: 'Discussions', count: forumPosts.length, icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'leaderboard', label: 'Leaderboard', count: leaderboard.length, icon: <Trophy className="w-4 h-4" /> },
            { id: 'people', label: 'People', count: (faculties.length || (subject?.coFaculties?.length || 0) + 1) + students.length, icon: <Users className="w-4 h-4" /> },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Tab-Scoped Action Buttons */}
        <div className="flex items-center gap-2">
          {activeTab === 'materials' && isFacultyOrAdmin && (
            <Button
              size="sm"
              onClick={() => setIsUploadMaterialOpen(true)}
              leftIcon={<UploadCloud className="w-4 h-4" />}
            >
              Upload Material
            </Button>
          )}

          {activeTab === 'assignments' && isFacultyOrAdmin && (
            <Button
              size="sm"
              onClick={() => setIsCreateAssignmentOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Assignment
            </Button>
          )}

          {activeTab === 'quizzes' && isFacultyOrAdmin && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setIsAiQuizGeneratorOpen(true)}
                leftIcon={<Sparkles className="w-4 h-4 text-yellow-300" />}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-sm"
              >
                ⚡ Generate with AI
              </Button>
              <Button
                size="sm"
                onClick={() => setIsCreateQuizOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Create Quiz
              </Button>
            </div>
          )}

          {activeTab === 'people' && isFacultyOrAdmin && (
            <Button
              size="sm"
              onClick={() => setIsEnrollStudentOpen(true)}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Enroll Student
            </Button>
          )}

          {activeTab === 'forum' && (
            <Button
              size="sm"
              onClick={() => setIsNewPostOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Ask Question
            </Button>
          )}
        </div>
      </div>

      {/* ===================== TAB 1: STUDY MATERIALS ===================== */}
      {activeTab === 'materials' && (
        <div className="space-y-5">
          {/* Controls: Category Pills & Instant Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {['', 'NOTE', 'BOOK', 'SLIDES', 'SYLLABUS', 'MATERIAL'].map((type) => (
                <button
                  key={type}
                  onClick={() => setMaterialTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    materialTypeFilter === type
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {type ? `${type.charAt(0) + type.slice(1).toLowerCase()}s` : 'All Materials'}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-64">
              <Input
                placeholder="Search notes, slides, tags..."
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                leftIcon={<Search className="w-3.5 h-3.5" />}
              />
            </div>
          </div>

          {filteredMaterials.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-6 h-6" />}
              title="No materials found"
              description={
                materials.length === 0
                  ? "No study notes, slides, or reference materials have been uploaded for this subject yet."
                  : "No study materials match your search or filter."
              }
              actionText={isFacultyOrAdmin && materials.length === 0 ? 'Upload First File' : undefined}
              onAction={() => setIsUploadMaterialOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMaterials.map((mat) => (
                <Card
                  key={mat._id}
                  hover
                  className="space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <Badge
                        variant={
                          mat.type === 'NOTE'
                            ? 'blue'
                            : mat.type === 'BOOK'
                            ? 'purple'
                            : mat.type === 'SLIDES'
                            ? 'amber'
                            : 'emerald'
                        }
                      >
                        {mat.type}
                      </Badge>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {formatFileSize(mat.fileSize)}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                      {mat.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {mat.description || mat.fileName}
                    </p>

                    {mat.uploadedBy && (
                      <div className="flex items-center gap-1.5 pt-1 text-[11px] text-gray-400">
                        <Avatar src={mat.uploadedBy.avatar} name={mat.uploadedBy.name} size="sm" />
                        <span className="truncate">Uploaded by {mat.uploadedBy.name}</span>
                      </div>
                    )}

                    {mat.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {mat.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-[10px] text-gray-600 dark:text-gray-400 font-medium"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-gray-400 text-[11px]">
                      <span className="flex items-center gap-1" title="Views">
                        <Eye className="w-3.5 h-3.5" />
                        {mat.viewCount}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isFacultyOrAdmin && (
                        <button
                          onClick={() => handleDeleteMaterial(mat._id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Delete Material"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <a
                        href={mat.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        download={mat.fileName || mat.title}
                        onClick={() => materialApi.incrementView(mat._id)}
                        className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 transition-colors"
                      >
                        <span>Download</span>
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: ASSIGNMENTS ===================== */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-6 h-6" />}
              title="No assignments posted"
              description="There are currently no active assignments or homework tasks for this subject."
              actionText={isFacultyOrAdmin ? 'Post an Assignment' : undefined}
              onAction={() => setIsCreateAssignmentOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {assignments.map((asg) => (
                <Card
                  key={asg._id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                        {asg.title}
                      </h4>
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
                      <span>Posted by {asg.createdBy?.name || 'Faculty'}</span>
                    </div>
                  </div>

                  {/* Student vs Faculty Action */}
                  <div className="flex items-center gap-2">
                    {isFacultyOrAdmin ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenGrading(asg)}
                        leftIcon={<FileCheck className="w-4 h-4" />}
                      >
                        Submissions ({asg.submissionsCount || 0})
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
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 3: QUIZZES ===================== */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          {quizzes.length === 0 ? (
            <EmptyState
              icon={<HelpCircle className="w-6 h-6" />}
              title="No quizzes scheduled"
              description="No active MCQ quizzes or Google Form assessments are available for this subject."
              actionText={isFacultyOrAdmin ? 'Create First Quiz' : undefined}
              onAction={() => setIsCreateQuizOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {quizzes.map((quiz) => (
                <Card
                  key={quiz._id}
                  className="space-y-3 flex flex-col justify-between border-t-4 border-t-purple-600"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <Badge variant="purple">{quiz.type === 'NATIVE_MCQ' ? 'Interactive MCQ' : 'Google Form'}</Badge>
                      <Badge variant="gold">+{quiz.rewardPoints} pts</Badge>
                    </div>

                    <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {quiz.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {quiz.description || 'Test your knowledge on this subject module.'}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
                      <span>Time: {quiz.timeLimitMinutes} mins</span>
                      <span>Questions: {quiz.questions?.length || 5}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    {isFacultyOrAdmin ? (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Badge variant="gray" className="text-xs">
                            {quiz.attemptsCount || 0} Submissions
                          </Badge>
                          {quiz.type === 'GOOGLE_FORM' && (
                            <a
                              href={quiz.googleFormUrl || 'https://forms.google.com'}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <span>Form Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenQuizResults(quiz)}
                          leftIcon={<BarChart3 className="w-4 h-4" />}
                        >
                          View Results ({quiz.attemptsCount || 0})
                        </Button>
                      </div>
                    ) : (
                      <>
                        {quiz.bestScore !== null && quiz.bestScore !== undefined ? (
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <Badge variant="emerald" className="font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Score: {quiz.bestScore} / {quiz.totalMarks}
                              </Badge>
                              <Badge variant="gray">1 Attempt Completed</Badge>
                            </div>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              Answers Submitted
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs text-gray-400">1 Attempt Allowed</span>

                            {quiz.type === 'GOOGLE_FORM' ? (
                              <a
                                href={quiz.googleFormUrl || 'https://forms.google.com'}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors"
                              >
                                <span>Open Google Form</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setActiveQuiz(quiz);
                                  setQuizAnswers({});
                                }}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                              >
                                Start Quiz
                              </Button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB: AI KNOWLEDGE TUTOR ===================== */}
      {activeTab === 'ai-tutor' && subject && (
        <div className="space-y-6">
          {!isFacultyOrAdmin && <StudentAcademicHealthCard />}

          {/* Sub-mode Switcher */}
          <div className="flex items-center justify-center">
            <div className="inline-flex p-1 rounded-2xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setAiSubMode('doubt')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  aiSubMode === 'doubt'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Course RAG Doubt Assistant</span>
              </button>
              <button
                type="button"
                onClick={() => setAiSubMode('flashcards')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  aiSubMode === 'flashcards'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                <span>Interactive Revision Flashcards</span>
              </button>
            </div>
          </div>

          {aiSubMode === 'doubt' ? (
            <AiDoubtAssistant subject={subject} materials={materials} />
          ) : (
            <AiFlashcardsDeck subject={subject} />
          )}
        </div>
      )}

      {/* ===================== TAB: AT-RISK ANALYTICS ===================== */}
      {activeTab === 'at-risk' && subject && isFacultyOrAdmin && (
        <AtRiskStudentDashboard subject={subject} />
      )}

      {/* ===================== TAB 4: DISCUSSIONS (FORUM) ===================== */}
      {activeTab === 'forum' && (
        <div className="space-y-4">
          {forumPosts.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="w-6 h-6" />}
              title="No questions asked yet"
              description="Be the first to ask a doubt or start an academic discussion in this subject."
              actionText="Ask a Question"
              onAction={() => setIsNewPostOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {forumPosts.map((post) => (
                <Card key={post._id} className="flex items-start gap-4 p-4">
                  {/* Upvote / Downvote column */}
                  <div className="flex flex-col items-center gap-1 bg-gray-50 dark:bg-slate-800/80 rounded-xl p-1.5">
                    <button
                      onClick={() => handleVotePost(post._id, post.userVote === 1 ? 0 : 1)}
                      className={`p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors ${
                        post.userVote === 1 ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-400'
                      }`}
                      title="Upvote"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {post.upvotesCount - post.downvotesCount}
                    </span>
                    <button
                      onClick={() => handleVotePost(post._id, post.userVote === -1 ? 0 : -1)}
                      className={`p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors ${
                        post.userVote === -1 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-400'
                      }`}
                      title="Downvote"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Question Content */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/forum/${post._id}`}
                        className="text-base font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                      >
                        {post.title}
                      </Link>
                      {post.hasAcceptedAnswer && (
                        <Badge variant="emerald" className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Accepted Answer
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {post.description}
                    </p>

                    {post.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {post.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-[10px] text-gray-500 font-medium"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-400 pt-2">
                      <div className="flex items-center gap-2">
                        <Avatar src={post.authorId?.avatar} name={post.authorId?.name} size="sm" />
                        <span>{post.authorId?.name}</span>
                        <span>&bull; {formatDate(post.createdAt)}</span>
                      </div>
                      <Link
                        to={`/forum/${post._id}`}
                        className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {post.answersCount} Answers
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 5: LEADERBOARD ===================== */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <Card className="divide-y divide-gray-100 dark:divide-slate-800/80 p-0 overflow-hidden">
            <div className="p-4 bg-gray-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
              <span>Rank &amp; Student</span>
              <span>Points &amp; Streak</span>
            </div>
            {leaderboard.map((entry) => (
              <div
                key={entry.student.id || entry.student._id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      entry.rank === 1
                        ? 'bg-amber-400 text-slate-950 shadow-glow'
                        : entry.rank === 2
                        ? 'bg-slate-300 text-slate-900'
                        : entry.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
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
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                    {entry.student.points} pts
                  </span>
                  <p className="text-[10px] text-gray-400">{entry.student.streakDays || 1} day streak</p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ===================== TAB 6: PEOPLE ===================== */}
      {activeTab === 'people' && (
        <div className="space-y-8">
          {/* Section 1: Instructors & Faculty */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span>Instructors &amp; Faculty ({faculties.length || (subject.coFaculties?.length || 0) + 1})</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Faculty */}
              <Card className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={subject.primaryFacultyId?.avatar} name={subject.primaryFacultyId?.name} size="lg" />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                      {subject.primaryFacultyId?.name || 'Primary Faculty'}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subject.primaryFacultyId?.email}</p>
                    {subject.primaryFacultyId?.department && (
                      <p className="text-[11px] text-gray-400">{subject.primaryFacultyId.department}</p>
                    )}
                  </div>
                </div>
                <Badge variant="blue">Lead Faculty</Badge>
              </Card>

              {/* Co-Faculties */}
              {subject.coFaculties?.map((cf) => (
                <Card key={cf._id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={cf.avatar} name={cf.name} size="lg" />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{cf.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{cf.email}</p>
                    </div>
                  </div>
                  <Badge variant="purple">Co-Faculty</Badge>
                </Card>
              ))}
            </div>
          </div>

          {/* Section 2: Enrolled Students & Classmates */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Enrolled Students ({students.length})</span>
              </h3>

              {students.length > 0 && (
                <div className="w-full sm:w-64">
                  <Input
                    placeholder="Search by student name or roll..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    leftIcon={<Search className="w-3.5 h-3.5" />}
                  />
                </div>
              )}
            </div>

            {filteredStudents.length === 0 ? (
              <EmptyState
                icon={<Users className="w-6 h-6" />}
                title={students.length === 0 ? "No students enrolled yet" : "No matching students"}
                description={
                  students.length === 0
                    ? "Students who join the parent class or this subject workspace will appear here."
                    : "No students match your search query."
                }
                actionText={isFacultyOrAdmin && students.length === 0 ? "Enroll Student" : undefined}
                onAction={() => setIsEnrollStudentOpen(true)}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map((st: any) => (
                  <Card key={st._id || st.email} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={st.avatar} name={st.name} size="md" />
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                          {st.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{st.email}</p>
                        {st.studentId && (
                          <span className="inline-block mt-1 text-[10px] font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                            {st.studentId}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge variant="emerald">Student</Badge>
                      {st.points !== undefined && (
                        <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400">
                          {st.points} pts
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== MODALS ===================== */}

      {/* Modal: Upload Material */}
      <Modal
        isOpen={isUploadMaterialOpen}
        onClose={() => setIsUploadMaterialOpen(false)}
        title="Upload Study Material"
        description="Share lecture notes, slides, books, or sample question papers with enrolled students."
      >
        <form onSubmit={handleUploadMaterial} className="space-y-4">
          <Input
            label="Material Title"
            placeholder="e.g. Unit 3: Concurrency & Synchronization"
            value={materialForm.title}
            onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Material Category
              </label>
              <select
                className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={materialForm.type}
                onChange={(e) => setMaterialForm({ ...materialForm, type: e.target.value })}
              >
                <option value="NOTE">Lecture Notes</option>
                <option value="SLIDES">Slide Deck (PDF/PPT)</option>
                <option value="BOOK">Reference E-Book</option>
                <option value="SYLLABUS">Syllabus / Guide</option>
                <option value="MATERIAL">General Material</option>
              </select>
            </div>

            <Input
              label="Topic Tags (comma separated)"
              placeholder="locks, semaphores, mutex"
              value={materialForm.tags}
              onChange={(e) => setMaterialForm({ ...materialForm, tags: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Select Document File (PDF, DOCX, PPTX, ZIP)
            </label>
            <input
              type="file"
              required
              onChange={(e) => setMaterialFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-slate-800 dark:file:text-blue-300 hover:file:bg-blue-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsUploadMaterialOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={materialUploading}>
              Publish Material
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Assignment */}
      <Modal
        isOpen={isCreateAssignmentOpen}
        onClose={() => setIsCreateAssignmentOpen(false)}
        title="Create Course Assignment"
        description="Assign coursework, set deadlines, and configure bonus gamification reward points."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <Input
            label="Assignment Title"
            placeholder="e.g. Lab 4: Multi-Threaded Cache Implementation"
            value={assignmentForm.title}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Detailed Instructions
            </label>
            <textarea
              className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={3}
              placeholder="Outline project deliverables, format requirements, and grading criteria..."
              value={assignmentForm.description}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Submission Deadline"
              type="datetime-local"
              value={assignmentForm.dueDate}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
              required
            />

            <Input
              label="Max Marks"
              type="number"
              value={assignmentForm.maxMarks}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, maxMarks: parseInt(e.target.value) || 100 })}
              required
            />

            <Input
              label="Reward Points"
              type="number"
              value={assignmentForm.rewardPoints}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, rewardPoints: parseInt(e.target.value) || 50 })}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsCreateAssignmentOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={assignmentCreating}>
              Publish Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Student Submit Assignment */}
      <Modal
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        title={`Submit: ${selectedAssignment?.title}`}
        description="Upload your document, PDF, or zip file for instructor evaluation. Submissions are strictly confidential and only visible to the course faculty."
      >
        <form onSubmit={handleSubmitAssignment} className="space-y-4">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-300 text-xs">
            <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong className="font-bold">Confidential Submission:</strong> Only your course instructor/faculty can view, download, and evaluate your submitted answer file. Other students cannot access your work.
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

      {/* Modal: Faculty Grade Submissions */}
      <Modal
        isOpen={!!gradingAssignment}
        onClose={() => setGradingAssignment(null)}
        title={`Grading: ${gradingAssignment?.title}`}
        description="Review student submissions, provide qualitative feedback, and allocate marks."
        maxWidth="2xl"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {loadingSubmissions ? (
            <div className="p-8 text-center text-xs text-gray-400">Loading student submissions...</div>
          ) : submissionsList.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">No students have submitted this assignment yet.</div>
          ) : (
            submissionsList.map((sub) => (
              <Card key={sub._id} className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={sub.studentId?.avatar} name={sub.studentId?.name} size="sm" />
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{sub.studentId?.name}</p>
                      <p className="text-[10px] text-gray-400">Submitted on {formatDateTime(sub.submittedAt)}</p>
                    </div>
                  </div>

                  <a
                    href={sub.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Work
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-slate-800">
                  <Input
                    label={`Marks (out of ${gradingAssignment?.maxMarks || 100})`}
                    type="number"
                    defaultValue={sub.marksObtained ?? ''}
                    onChange={(e) =>
                      setGradingMarks({ ...gradingMarks, [sub._id]: parseInt(e.target.value) || 0 })
                    }
                  />

                  <Input
                    label="Instructor Feedback"
                    placeholder="e.g. Excellent logic and comments."
                    defaultValue={sub.feedback || ''}
                    onChange={(e) =>
                      setGradingFeedback({ ...gradingFeedback, [sub._id]: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => gradingAssignment && handleAiRubricGrade(gradingAssignment._id, sub._id)}
                    disabled={loadingAiRubric[sub._id]}
                    leftIcon={<Sparkles className={`w-3.5 h-3.5 text-purple-500 ${loadingAiRubric[sub._id] ? 'animate-spin' : ''}`} />}
                    className="border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-semibold"
                  >
                    {loadingAiRubric[sub._id] ? 'Evaluating with AI Rubric...' : '🤖 AI Rubric Grade & Feedback'}
                  </Button>

                  <Button size="sm" onClick={() => handleGradeSubmission(sub._id)}>
                    Save Grade &amp; Award Points
                  </Button>
                </div>

                {/* AI Rubric Breakdown Card if generated */}
                {aiRubricData[sub._id] && (
                  <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        AI Rubric Evaluation Breakdown
                      </span>
                      <Badge variant="purple" className="font-bold">
                        Suggested: {aiRubricData[sub._id].suggestedMarks} / {aiRubricData[sub._id].maxMarks} marks
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {aiRubricData[sub._id].rubricBreakdown.map((crit, crIdx) => (
                        <div key={crIdx} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/40 space-y-0.5">
                          <div className="flex items-center justify-between font-semibold text-gray-800 dark:text-gray-200">
                            <span className="truncate">{crit.criterion}</span>
                            <span className="text-purple-600 shrink-0 ml-1">{crit.score}/{crit.maxScore}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">{crit.comments}</p>
                        </div>
                      ))}
                    </div>

                    {aiRubricData[sub._id].strengths.length > 0 && (
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                        ✅ <strong>Key Strengths:</strong> {aiRubricData[sub._id].strengths.join(' • ')}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </Modal>

      {/* Modal: Create Quiz */}
      <Modal
        isOpen={isCreateQuizOpen}
        onClose={() => setIsCreateQuizOpen(false)}
        title="Create & Schedule Quiz"
        description="Build an interactive MCQ assessment or link an external Google Form for enrolled students."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateQuiz} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <Input
            label="Quiz Title"
            placeholder="e.g. Unit 2: Process Scheduling & Deadlocks Quiz"
            value={quizForm.title}
            onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Description / Instructions
            </label>
            <textarea
              className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
              placeholder="Instructions or topic coverage..."
              value={quizForm.description}
              onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Quiz Format
              </label>
              <select
                className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:outline-none"
                value={quizForm.type}
                onChange={(e) => setQuizForm({ ...quizForm, type: e.target.value as any })}
              >
                <option value="NATIVE_MCQ">Interactive MCQ</option>
                <option value="GOOGLE_FORM">Google Form</option>
              </select>
            </div>

            <Input
              label="Time Limit (Mins)"
              type="number"
              value={quizForm.timeLimitMinutes}
              onChange={(e) => setQuizForm({ ...quizForm, timeLimitMinutes: parseInt(e.target.value) || 15 })}
              required
            />

            <Input
              label="Reward Points"
              type="number"
              value={quizForm.rewardPoints}
              onChange={(e) => setQuizForm({ ...quizForm, rewardPoints: parseInt(e.target.value) || 30 })}
              required
            />
          </div>

          {quizForm.type === 'GOOGLE_FORM' ? (
            <Input
              label="Google Form URL"
              placeholder="https://docs.google.com/forms/d/e/..."
              value={quizForm.googleFormUrl}
              onChange={(e) => setQuizForm({ ...quizForm, googleFormUrl: e.target.value })}
              required
            />
          ) : (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  Questions ({quizForm.questions.length})
                </h4>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddQuestion}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Add Question
                </Button>
              </div>

              {quizForm.questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      Question #{qIdx + 1}
                    </span>
                    {quizForm.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="text-gray-400 hover:text-red-600 text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>

                  <Input
                    placeholder="Enter question text..."
                    value={q.questionText}
                    onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                    required
                  />

                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] font-semibold text-gray-500">
                      Options (select radio button for the correct answer):
                    </p>
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-option-${qIdx}`}
                          checked={opt.isCorrect}
                          onChange={() => handleOptionCorrectChange(qIdx, optIdx)}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          title="Mark as correct answer"
                        />
                        <span className="text-xs font-bold text-gray-500 w-4">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <input
                          type="text"
                          className="flex-1 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:outline-none"
                          placeholder={`Option ${String.fromCharCode(65 + optIdx)} text...`}
                          value={opt.text}
                          onChange={(e) => handleOptionTextChange(qIdx, optIdx, e.target.value)}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsCreateQuizOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={quizCreating}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Publish Quiz
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Interactive MCQ Quiz Runner */}
      <Modal
        isOpen={!!activeQuiz}
        onClose={() => setActiveQuiz(null)}
        title={activeQuiz?.title}
        description={`Time limit: ${activeQuiz?.timeLimitMinutes} minutes • +${activeQuiz?.rewardPoints} Points on completion`}
        maxWidth="lg"
      >
        <div className="space-y-6 select-none">
          {/* Proctoring Status Shield */}
          <ExamProctorGuard
            violationsCount={quizIntegrity.violationsCount}
            maxViolations={3}
            isWarningModalOpen={quizIntegrity.isWarningModalOpen}
            onDismissWarning={quizIntegrity.dismissWarning}
            lastViolationType={quizIntegrity.lastViolationType}
            examTitle={activeQuiz?.title}
          />

          {activeQuiz?.questions?.map((q, qIndex) => (
            <div key={qIndex} className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                Question {qIndex + 1}: {q.questionText}
              </p>

              <div className="space-y-2">
                {q.options.map((opt, optIndex) => (
                  <button
                    key={optIndex}
                    type="button"
                    onClick={() => setQuizAnswers({ ...quizAnswers, [qIndex]: optIndex })}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                      quizAnswers[qIndex] === optIndex
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold ring-2 ring-purple-500/20'
                        : 'border-gray-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700/60 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="font-bold mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                    {opt.text}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setActiveQuiz(null)}>
              Exit
            </Button>
            <Button
              type="button"
              isLoading={submittingQuiz}
              onClick={handleCompleteQuiz}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Submit Quiz Answers
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: New Forum Post */}
      <Modal
        isOpen={isNewPostOpen}
        onClose={() => setIsNewPostOpen(false)}
        title="Ask Question in Forum"
        description="Collaborate with peers and instructors to resolve doubts and earn discussion points."
      >
        <form onSubmit={handleCreateForumPost} className="space-y-4">
          <Input
            label="Question Title"
            placeholder="e.g. How does Dijkstra algorithm handle negative edge weights?"
            value={postForm.title}
            onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Detailed Question Description
            </label>
            <textarea
              className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={4}
              placeholder="Explain the context and where you are getting stuck..."
              value={postForm.description}
              onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
              required
            />
          </div>

          <Input
            label="Tags (comma separated)"
            placeholder="algorithms, shortest-path, graphs"
            value={postForm.tags}
            onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsNewPostOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={postingForum}>
              Post to Forum
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Enroll Student */}
      <Modal
        isOpen={isEnrollStudentOpen}
        onClose={() => setIsEnrollStudentOpen(false)}
        title="Enroll Student in Subject"
        description="Add a registered student directly to this subject and parent class using their Email or Student ID."
      >
        <form onSubmit={handleEnrollStudent} className="space-y-4">
          <Input
            label="Student Email or Student/Roll ID"
            placeholder="e.g. student@shikshasetu.edu or CS2026-081"
            value={enrollStudentInput}
            onChange={(e) => setEnrollStudentInput(e.target.value)}
            required
            autoFocus
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEnrollStudentOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={enrollingStudent}>
              Enroll Student
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Faculty & Admin Quiz Results */}
      <Modal
        isOpen={!!selectedQuizForResults}
        onClose={() => {
          setSelectedQuizForResults(null);
          setQuizResultsData(null);
        }}
        title={`Quiz Results: ${selectedQuizForResults?.title || ''}`}
        description="Student scores, evaluation statistics, and completion metrics."
        maxWidth="2xl"
      >
        {loadingQuizResults ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading student scores and statistics...</div>
        ) : !quizResultsData ? (
          <div className="p-8 text-center text-xs text-gray-400">No result data available.</div>
        ) : (
          <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
            {/* Summary Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60">
                <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">
                  <Users className="w-3.5 h-3.5" />
                  Total Attempts
                </div>
                <p className="text-xl font-black text-purple-900 dark:text-purple-100">
                  {quizResultsData.stats?.totalAttempts || 0}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
                <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Average Score
                </div>
                <p className="text-xl font-black text-blue-900 dark:text-blue-100">
                  {quizResultsData.stats?.averageScore || 0} / {quizResultsData.stats?.maxMarks || 0}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1">
                  <Trophy className="w-3.5 h-3.5" />
                  Highest Score
                </div>
                <p className="text-xl font-black text-amber-900 dark:text-amber-100">
                  {quizResultsData.stats?.highestScore || 0} / {quizResultsData.stats?.maxMarks || 0}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                  <Percent className="w-3.5 h-3.5" />
                  Pass Rate
                </div>
                <p className="text-xl font-black text-emerald-900 dark:text-emerald-100">
                  {quizResultsData.stats?.passRate || 0}%
                </p>
              </div>
            </div>

            {/* Student Results Table / List */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                Student Submissions ({quizResultsData.attempts?.length || 0})
              </h4>

              {!quizResultsData.attempts || quizResultsData.attempts.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-slate-800">
                  No students have submitted this quiz yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {quizResultsData.attempts.map((att: any) => (
                    <div
                      key={att._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar src={att.student?.avatar} name={att.student?.name} size="sm" />
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                            {att.student?.name || 'Student'}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {att.student?.email} {att.student?.studentId ? `• ID: ${att.student.studentId}` : ''}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Submitted: {formatDateTime(att.submittedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <span className="text-xs font-black text-gray-900 dark:text-gray-100 block">
                            {att.score} / {att.maxScore} marks
                          </span>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                            +{att.pointsAwarded} pts
                          </span>
                        </div>

                        <Badge variant={att.passed ? 'emerald' : 'red'}>
                          {att.percentage}% • {att.passed ? 'Passed' : 'Failed'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: 1-Click AI Quiz & Flashcard Generator */}
      {subject && (
        <AiQuizGeneratorModal
          isOpen={isAiQuizGeneratorOpen}
          onClose={() => setIsAiQuizGeneratorOpen(false)}
          subject={subject}
          materials={materials}
          onQuizPublished={fetchAllWorkspaceData}
        />
      )}
    </div>
  );
};
