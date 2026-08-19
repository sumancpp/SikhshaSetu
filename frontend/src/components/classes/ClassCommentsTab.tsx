import React, { useState, useEffect } from 'react';
import { classCommentApi } from '../../api/classComment.api';
import { ClassComment, CommentVisibility, User } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { EmptyState } from '../common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSocket } from '../../context/SocketContext';
import {
  MessageSquare,
  Send,
  Lock,
  Users,
  UserCheck,
  Filter,
  Trash2,
  Paperclip,
  CheckCircle2,
} from 'lucide-react';

interface ClassCommentsTabProps {
  classId: string;
  members: any[];
}

export const ClassCommentsTab: React.FC<ClassCommentsTabProps> = ({ classId, members }) => {
  const [comments, setComments] = useState<ClassComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PRIVATE' | 'MY'>('ALL');

  // New comment composer state
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<CommentVisibility>('ALL');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  const { user } = useAuth();
  const { success, error } = useToast();
  const { socket } = useSocket();

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await classCommentApi.getComments(classId, { filter });
      if (res.success) {
        setComments(res.data);
      }
    } catch (err: any) {
      error('Failed to load comments', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [classId, filter]);

  // Real-time socket listener for new comments
  useEffect(() => {
    if (!socket) return;

    const handleNewComment = (newComment: ClassComment) => {
      if (newComment.classId === classId) {
        setComments((prev) => {
          if (prev.some((c) => c._id === newComment._id)) return prev;
          return [newComment, ...prev];
        });
      }
    };

    socket.on('class:comment:new', handleNewComment);

    return () => {
      socket.off('class:comment:new', handleNewComment);
    };
  }, [socket, classId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (visibility === 'SELECTED' && selectedStudentIds.length === 0) {
      error('Select Recipients', 'Please select at least one student or recipient for this selective comment.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await classCommentApi.createComment(classId, {
        content: content.trim(),
        visibility,
        targetUserIds: visibility === 'SELECTED' ? selectedStudentIds : undefined,
      });

      if (res.success) {
        setContent('');
        setVisibility('ALL');
        setSelectedStudentIds([]);
        setShowMemberPicker(false);
        setComments((prev) => [res.data, ...prev]);
        success('Comment Posted!', 'Your message has been dispatched according to audience privacy settings.');
      }
    } catch (err: any) {
      error('Post Failed', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await classCommentApi.deleteComment(commentId);
      if (res.success) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        success('Deleted', 'Comment removed.');
      }
    } catch (err: any) {
      error('Delete Failed', err.response?.data?.message);
    }
  };

  const toggleStudentSelection = (userId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const enrolledStudents = members.filter(
    (m) => m.role === 'STUDENT' || (m.userId && m.userId.role === 'STUDENT')
  );

  return (
    <div className="space-y-6">
      {/* Comment Composer */}
      <Card className="p-5 space-y-4 border-t-4 border-t-indigo-600 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
              Class Discussion &amp; Private Inquiries
            </h3>
          </div>

          {/* Visibility Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Audience:</span>
            <select
              value={visibility}
              onChange={(e) => {
                const val = e.target.value as CommentVisibility;
                setVisibility(val);
                if (val === 'SELECTED') setShowMemberPicker(true);
                else setShowMemberPicker(false);
              }}
              className="text-xs font-semibold rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">👥 Everyone in Class (Public)</option>
              <option value="TEACHER_ONLY">🔒 Private: Only Teacher / Faculty</option>
              <option value="SELECTED">🎯 Selected Specific Students</option>
            </select>
          </div>
        </div>

        {/* Selected Member Checkboxes if visibility === 'SELECTED' */}
        {visibility === 'SELECTED' && (
          <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
              <span>🎯 Choose Recipients ({selectedStudentIds.length} selected):</span>
              <button
                type="button"
                onClick={() =>
                  setSelectedStudentIds(
                    selectedStudentIds.length === enrolledStudents.length
                      ? []
                      : enrolledStudents.map((s) => s.userId?._id || s.userId)
                  )
                }
                className="text-[11px] text-indigo-600 hover:underline"
              >
                {selectedStudentIds.length === enrolledStudents.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-32 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 pr-1">
              {enrolledStudents.map((member) => {
                const u = member.userId || member;
                const isSelected = selectedStudentIds.includes(u._id);
                return (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => toggleStudentSelection(u._id)}
                    className={`px-2.5 py-1.5 rounded-xl text-left text-xs flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Avatar src={u.avatar} name={u.name} size="sm" />
                    <span className="truncate">{u.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={handlePostComment} className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              visibility === 'ALL'
                ? 'Share an announcement, question, or discussion point with everyone in this class...'
                : visibility === 'TEACHER_ONLY'
                ? 'Send a confidential inquiry or note directly to the class teacher/faculty...'
                : 'Send a targeted message to the selected students and instructor...'
            }
            className="w-full rounded-2xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none h-24"
            required
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {visibility === 'ALL' && (
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <Users className="w-3.5 h-3.5" /> Public to all class members
                </span>
              )}
              {visibility === 'TEACHER_ONLY' && (
                <span className="flex items-center gap-1 text-amber-600 font-medium">
                  <Lock className="w-3.5 h-3.5" /> Only Faculty &amp; Author can see
                </span>
              )}
              {visibility === 'SELECTED' && (
                <span className="flex items-center gap-1 text-indigo-600 font-medium">
                  <UserCheck className="w-3.5 h-3.5" /> Visible to {selectedStudentIds.length} chosen members
                </span>
              )}
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={submitting || !content.trim()}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={filter === 'ALL' ? 'primary' : 'outline'}
            onClick={() => setFilter('ALL')}
            className="text-xs h-8"
          >
            All Visible ({comments.length})
          </Button>
          <Button
            size="sm"
            variant={filter === 'PRIVATE' ? 'primary' : 'outline'}
            onClick={() => setFilter('PRIVATE')}
            className="text-xs h-8"
          >
            🔒 Private &amp; Inquiries
          </Button>
          <Button
            size="sm"
            variant={filter === 'MY' ? 'primary' : 'outline'}
            onClick={() => setFilter('MY')}
            className="text-xs h-8"
          >
            Sent by Me
          </Button>
        </div>
      </div>

      {/* Comment Stream */}
      {loading ? (
        <div className="text-center py-8 text-xs text-gray-400">Loading comments...</div>
      ) : comments.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-8 h-8 text-gray-400" />}
          title="No comments yet"
          description="Start a class-wide discussion or send a private note to the teacher above."
        />
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const isAuthor = comment.authorId?._id === user?._id;
            const isFacultyAuthor =
              comment.authorRole === 'FACULTY' || comment.authorRole === 'ADMIN';

            return (
              <Card
                key={comment._id}
                className={`p-4 space-y-2.5 transition-all ${
                  comment.visibility === 'TEACHER_ONLY'
                    ? 'border-l-4 border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/10'
                    : comment.visibility === 'SELECTED'
                    ? 'border-l-4 border-l-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10'
                    : 'border-l-4 border-l-gray-300 dark:border-l-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={comment.authorId?.avatar}
                      name={comment.authorId?.name || 'User'}
                      size="sm"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-900 dark:text-gray-100">
                          {comment.authorId?.name}
                        </span>
                        {isFacultyAuthor && (
                          <Badge variant="blue" className="text-[10px] py-0 px-1.5">
                            Faculty
                          </Badge>
                        )}
                        {comment.authorRole === 'PARENT' && (
                          <Badge variant="purple" className="text-[10px] py-0 px-1.5">
                            Parent
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {comment.visibility === 'ALL' ? (
                      <Badge variant="gray" className="text-[10px]">
                        👥 Class Public
                      </Badge>
                    ) : comment.visibility === 'TEACHER_ONLY' ? (
                      <Badge variant="amber" className="text-[10px] flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Private with Faculty
                      </Badge>
                    ) : (
                      <Badge variant="purple" className="text-[10px] flex items-center gap-1">
                        <UserCheck className="w-2.5 h-2.5" /> Selective (
                        {comment.targetUserIds?.length || 0})
                      </Badge>
                    )}

                    {(isAuthor || user?.role === 'ADMIN') && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Delete Comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap pl-10">
                  {comment.content}
                </p>

                {comment.visibility === 'SELECTED' && comment.targetUserIds?.length > 0 && (
                  <div className="pl-10 pt-1 flex items-center gap-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                    <span>Recipients:</span>
                    {comment.targetUserIds.map((t) => (
                      <span key={t._id} className="underline">
                        @{t.name}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
