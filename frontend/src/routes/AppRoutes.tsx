import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { DashboardRouter } from '../pages/dashboard/DashboardRouter';
import { ClassesPage } from '../pages/classes/ClassesPage';
import { ClassDetailPage } from '../pages/classes/ClassDetailPage';
import { SubjectsPage } from '../pages/subjects/SubjectsPage';
import { SubjectWorkspacePage } from '../pages/subjects/SubjectWorkspacePage';
import { AssignmentsPage } from '../pages/assignments/AssignmentsPage';
import { ChallengesPage } from '../pages/challenges/ChallengesPage';
import { LeaderboardPage } from '../pages/leaderboard/LeaderboardPage';
import { ForumFeedPage } from '../pages/forum/ForumFeedPage';
import { ForumPostDetailPage } from '../pages/forum/ForumPostDetailPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { UsersManagementPage } from '../pages/admin/UsersManagementPage';
import { ModerationReportsPage } from '../pages/admin/ModerationReportsPage';
import { AuditLogsPage } from '../pages/admin/AuditLogsPage';
import { QuizArenaPage } from '../pages/arena/QuizArenaPage';
import { CodePlaygroundPage } from '../pages/playground/CodePlaygroundPage';
import { AttendanceHubPage } from '../pages/attendance/AttendanceHubPage';
import { NotFoundPage } from '../pages/notfound/NotFoundPage';
import { Skeleton } from '../components/common/Skeleton';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-[#0b0f19]">
        <div className="space-y-4 w-72 text-center">
          <Skeleton className="h-10 w-10 rounded-full mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Authenticated Workspace Routes wrapped in AppLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardRouter />} />
        <Route path="attendance" element={<AttendanceHubPage />} />

        {/* Classes */}
        <Route path="classes" element={<ClassesPage />} />
        <Route path="classes/:classId" element={<ClassDetailPage />} />

        {/* Subjects & Google Classroom Tabbed Hub */}
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="subjects/:subjectId" element={<SubjectWorkspacePage />} />

        {/* Learning, Challenges, Leaderboard & Forum */}
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="challenges" element={<ChallengesPage />} />
        <Route path="arena" element={<QuizArenaPage />} />
        <Route path="playground" element={<CodePlaygroundPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="forum" element={<ForumFeedPage />} />
        <Route path="forum/:postId" element={<ForumPostDetailPage />} />

        {/* Profile & Badges */}
        <Route path="profile" element={<ProfilePage />} />

        {/* Admin Only Routes */}
        <Route
          path="admin/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UsersManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/reports"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ModerationReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
