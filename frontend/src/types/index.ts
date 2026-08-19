export type UserRole = 'ADMIN' | 'FACULTY' | 'STUDENT' | 'PARENT';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  department?: string;
  studentId?: string;
  points: number;
  streakDays: number;
  lastActiveDate?: string;
  isSuspended?: boolean;
  achievements?: Achievement[];
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  _id: string;
  name: string;
  code: string;
  description: string;
  academicYear: string;
  department: string;
  semester: number;
  section?: string;
  bannerImage?: string;
  isArchived: boolean;
  createdBy: User | string;
  stats?: {
    faculties?: number;
    students?: number;
    subjects?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FacultyPermission {
  facultyId: string;
  manageMaterials: boolean;
  createAssignments: boolean;
  gradeAssignments: boolean;
  createChallenges: boolean;
  moderateForum: boolean;
}

export interface Subject {
  _id: string;
  classId: Class | string;
  name: string;
  code: string;
  description: string;
  subjectImage?: string;
  semester: number;
  credits?: number;
  primaryFacultyId: User;
  coFaculties: User[];
  facultyPermissions: FacultyPermission[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MaterialType = 'NOTE' | 'BOOK' | 'MATERIAL' | 'SLIDES' | 'SYLLABUS' | 'OTHER';

export interface Material {
  _id: string;
  classId: string;
  subjectId: string;
  title: string;
  description?: string;
  type: MaterialType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: User;
  tags: string[];
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  _id: string;
  classId: string;
  subjectId: string;
  title: string;
  description?: string;
  instructions?: string;
  dueDate: string;
  maxMarks: number;
  rewardPoints: number;
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
  }[];
  allowedFileTypes?: string[];
  maxFileSizeMb?: number;
  allowLateSubmissions: boolean;
  createdBy: User;
  submissionsCount?: number;
  mySubmission?: Submission | null;
  createdAt: string;
  updatedAt: string;
}

export type SubmissionStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'LATE' | 'GRADED' | 'RETURNED';

export interface Submission {
  _id: string;
  assignmentId: string | Assignment;
  subjectId: string;
  classId: string;
  studentId: User;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  submissionText?: string;
  submittedAt: string;
  status: SubmissionStatus;
  marksObtained?: number;
  feedback?: string;
  gradedBy?: User;
  gradedAt?: string;
  pointsAwarded: number;
  plagiarismScore?: number;
  matchedSubmissionId?: string;
  matchedStudentName?: string;
  isDuplicateFlag?: boolean;
  similarityDetails?: {
    matchedExcerpts?: string[];
    commonKeywords?: string[];
    confidence?: number;
    comparisonSummary?: string;
  };
  aiEvaluation?: {
    suggestedMarks?: number;
    maxMarks?: number;
    rubricBreakdown?: {
      criterion: string;
      score: number;
      maxScore: number;
      comments: string;
    }[];
    strengths?: string[];
    areasForImprovement?: string[];
    suggestedFeedback?: string;
    evaluatedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type QuizType = 'NATIVE_MCQ' | 'GOOGLE_FORM';
export type QuestionType = 'MCQ' | 'MULTIPLE' | 'TF' | 'SHORT';

export interface QuizQuestion {
  questionIndex?: number;
  questionText: string;
  type: QuestionType;
  options: {
    text: string;
    isCorrect?: boolean;
  }[];
  explanation?: string;
  marks: number;
}

export interface Quiz {
  _id: string;
  classId: string;
  subjectId: string;
  title: string;
  description?: string;
  type: QuizType;
  googleFormUrl?: string;
  timeLimitMinutes: number;
  attemptLimit: number;
  rewardPoints: number;
  startDate?: string;
  endDate?: string;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  questions: QuizQuestion[];
  totalMarks: number;
  isPublished: boolean;
  createdBy: User;
  attemptsCount?: number;
  bestScore?: number | null;
  myAttempt?: QuizAttempt | null;
  status?: 'AVAILABLE' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  _id: string;
  quizId: string;
  subjectId: string;
  classId: string;
  studentId: string;
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string;
  score: number;
  maxScore: number;
  pointsAwarded: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'TIMED_OUT';
}

export type ChallengeCategory = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type ChallengeDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface ChallengeTask {
  question: string;
  options: string[];
  correctIndex?: number;
  explanation?: string;
  hint?: string;
}

export interface Challenge {
  _id: string;
  classId?: string;
  subjectId?: string;
  title: string;
  description?: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  tasks: ChallengeTask[];
  rewardPoints: number;
  timeLimitMinutes: number;
  startDate: string;
  endDate: string;
  attemptLimit: number;
  isActive: boolean;
  createdBy: User;
  isCompleted?: boolean;
  myAttempt?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  _id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  pointsRequired: number;
  category: 'CHALLENGE' | 'QUIZ' | 'FORUM' | 'STREAK' | 'GENERAL';
}

export type ForumAudience = 'ALL' | 'DEPARTMENT_ONLY' | 'FACULTY_AND_PARENTS' | 'FACULTY_ONLY';

export interface ForumPost {
  _id: string;
  classId: Class | string;
  subjectId?: Subject | string;
  title: string;
  description: string;
  tags: string[];
  attachments: string[];
  authorId: User;
  authorRole: UserRole;
  audience?: ForumAudience;
  targetDepartment?: string;
  allowedRoles?: string[];
  upvotesCount: number;
  downvotesCount: number;
  answersCount: number;
  hasAcceptedAnswer: boolean;
  isLocked: boolean;
  isHidden: boolean;
  userVote?: number; // 1, -1, 0
  createdAt: string;
  updatedAt: string;
}

export interface ForumAnswer {
  _id: string;
  postId: string;
  classId: string;
  subjectId?: string;
  content: string;
  authorId: User;
  authorRole: UserRole;
  upvotesCount: number;
  downvotesCount: number;
  isAccepted: boolean;
  userVote?: number;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'CLASS_INVITE'
  | 'SUBJECT_INVITE'
  | 'ASSIGNMENT_CREATED'
  | 'ASSIGNMENT_GRADED'
  | 'QUIZ_CREATED'
  | 'CHALLENGE_ACTIVE'
  | 'FORUM_ANSWER'
  | 'ANSWER_ACCEPTED'
  | 'ANSWER_UPVOTED'
  | 'POINTS_EARNED'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'SYSTEM_ANNOUNCEMENT';

export interface NotificationItem {
  _id: string;
  recipientId: string;
  senderId?: User;
  type: NotificationType;
  title: string;
  message: string;
  referenceUrl?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  student: {
    id: string;
    _id?: string;
    name: string;
    email: string;
    avatar?: string;
    department?: string;
    studentId?: string;
    points: number;
    streakDays: number;
  };
}

// ==========================================
// 🤖 AI Academic Superpowers Types
// ==========================================

export interface DoubtCitation {
  materialId?: string;
  materialTitle: string;
  pageOrSection: string;
  fileUrl: string;
  snippet: string;
}

export interface DoubtResponse {
  answer: string;
  citations: DoubtCitation[];
  suggestedFollowUps: string[];
  groundedInFilesCount: number;
}

export interface GeneratedQuizQuestion {
  questionText: string;
  type: 'MCQ' | 'MULTIPLE' | 'TF' | 'SHORT';
  options: {
    text: string;
    isCorrect: boolean;
  }[];
  explanation: string;
  marks: number;
}

export interface GeneratedFlashcard {
  front: string;
  back: string;
  keyTakeaway: string;
}

export interface GeneratedQuizResult {
  title: string;
  description: string;
  questions: GeneratedQuizQuestion[];
  flashcards: GeneratedFlashcard[];
}

export interface RubricCriterionScore {
  criterion: string;
  score: number;
  maxScore: number;
  comments: string;
}

export interface AiRubricEvaluation {
  suggestedMarks: number;
  maxMarks: number;
  rubricBreakdown: RubricCriterionScore[];
  strengths: string[];
  areasForImprovement: string[];
  suggestedFeedback: string;
}

// ==========================================
// 🚨 Smart Analytics & At-Risk Detection Types
// ==========================================

export type RiskTier = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'SAFE';

export interface StudentRiskProfile {
  studentId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  riskTier: RiskTier;
  atRiskScore: number;
  metrics: {
    totalAssignments: number;
    submittedAssignments: number;
    submissionRate: number;
    lateSubmissions: number;
    avgAssignmentPercentage: number;
    totalQuizzes: number;
    attemptedQuizzes: number;
    quizCompletionRate: number;
    avgQuizScorePercentage: number;
  };
  riskFactors: string[];
  aiInterventionSuggestion: string;
  lastActivityDate?: string;
}

export interface SubjectAtRiskSummary {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  totalEnrolledStudents: number;
  counts: {
    critical: number;
    high: number;
    moderate: number;
    safe: number;
  };
  averageClassSubmissionRate: number;
  averageClassQuizScore: number;
  students: StudentRiskProfile[];
}

export interface StudentAcademicHealth {
  studentId: string;
  name: string;
  overallHealthScore: number;
  overallRiskTier: RiskTier;
  totalSubjectsEnrolled: number;
  metrics: {
    totalAssignmentsAssigned: number;
    totalAssignmentsSubmitted: number;
    submissionRatePercentage: number;
    totalQuizzesCompleted: number;
    averageQuizScorePercentage: number;
  };
  proactiveTips: string[];
}

// ==========================================
// 💻 In-Browser Code Execution & Sandbox Types
// ==========================================

export interface CodeExecutionOutput {
  stdout: string;
  stderr: string;
  output: string;
  exitCode: number;
  executionTimeMs: number;
  status: 'SUCCESS' | 'RUNTIME_ERROR' | 'COMPILE_ERROR' | 'TIME_LIMIT_EXCEEDED';
}

export interface TestCaseItem {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface TestCaseResult {
  testCaseIndex: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  isHidden?: boolean;
  executionTimeMs: number;
  status: 'PASSED' | 'WRONG_ANSWER' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED';
  errorDetails?: string;
}

export interface TestCaseEvaluationReport {
  language: string;
  passedCount: number;
  totalCount: number;
  allPassed: boolean;
  scorePercentage: number;
  totalExecutionTimeMs: number;
  testCaseResults: TestCaseResult[];
}

// ==========================================
// ⚔️ Live 1v1 Quiz Arena Types
// ==========================================

export interface ArenaQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  timeLimitSeconds: number;
}

export interface ArenaMatchState {
  matchId: string;
  subjectName: string;
  player: {
    userId: string;
    name: string;
    avatarUrl?: string;
    score: number;
    streak: number;
  };
  opponent: {
    name: string;
    avatarUrl: string;
    isBot: boolean;
    score: number;
    streak: number;
    title: string;
  };
  currentQuestionIndex: number;
  totalQuestions: number;
  questions: ArenaQuestion[];
  status: 'IN_PROGRESS' | 'COMPLETED';
}

export interface ArenaRoundResult {
  playerCorrect: boolean;
  playerPointsEarned: number;
  opponentCorrect: boolean;
  opponentPointsEarned: number;
  correctIndex: number;
  explanation: string;
  isMatchOver: boolean;
  winner?: 'PLAYER' | 'OPPONENT' | 'TIE';
  xpAwarded?: number;
}

// ==========================================
// 💬 Granular Class Comment Types
// ==========================================

export type CommentVisibility = 'ALL' | 'TEACHER_ONLY' | 'SELECTED';

export interface ClassComment {
  _id: string;
  classId: string;
  authorId: User;
  authorRole: UserRole;
  content: string;
  visibility: CommentVisibility;
  targetUserIds: User[];
  attachments: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
  }[];
  isResolved?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 📍 Anti-Cheat Dynamic QR Attendance Types
// ==========================================

export type AttendanceSessionStatus = 'ACTIVE' | 'EXPIRED' | 'CLOSED';
export type AttendanceVerificationStatus =
  | 'PRESENT'
  | 'OUT_OF_RANGE'
  | 'SUSPICIOUS_TOKEN_EXPIRED'
  | 'REJECTED';

export interface AttendanceSession {
  _id: string;
  classId: string;
  subjectId?: string;
  facultyId: User;
  title: string;
  centerLatitude: number;
  centerLongitude: number;
  allowedRadiusMeters: number;
  startTime: string;
  endTime: string;
  status: AttendanceSessionStatus;
  attendanceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  _id: string;
  sessionId: string | AttendanceSession;
  classId: string | Class;
  subjectId?: string;
  studentId: User;
  scannedAt: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  distanceFromCenter: number;
  verificationStatus: AttendanceVerificationStatus;
  pointsAwarded: number;
  createdAt: string;
  updatedAt: string;
}

export interface LiveTokenResponse {
  token: string;
  sessionId: string;
  timeRemainingSeconds: number;
  rotationIntervalMs: number;
  active: boolean;
}

export interface PlagiarismPair {
  studentA: { id: string; name: string; submissionId: string };
  studentB: { id: string; name: string; submissionId: string };
  similarityScore: number;
  isDuplicate: boolean;
  comparisonSummary: string;
  commonKeywords: string[];
  matchedExcerpts: string[];
}

export interface PlagiarismReport {
  assignmentId: string;
  assignmentTitle: string;
  totalSubmissions: number;
  duplicatesDetectedCount: number;
  flaggedPairsCount: number;
  flaggedPairs: PlagiarismPair[];
  analyzedAt: string;
}


