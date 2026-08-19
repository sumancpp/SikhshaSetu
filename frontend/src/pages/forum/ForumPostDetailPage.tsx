import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { forumApi } from '../../api/forum.api';
import { ForumPost, ForumAnswer } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { Skeleton } from '../../components/common/Skeleton';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSocket } from '../../context/SocketContext';
import { formatDate, formatDateTime } from '../../utils/formatters';
import {
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  MessageSquare,
  Award,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

export const ForumPostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [answers, setAnswers] = useState<ForumAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerContent, setAnswerContent] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  const { user } = useAuth();
  const { success, error } = useToast();
  const { socket, joinForum, leaveForum } = useSocket();

  const fetchPostDetails = async () => {
    if (!postId) return;
    try {
      setLoading(true);
      const res = await forumApi.getPostById(postId);
      if (res.success) {
        setPost(res.data.post);
        setAnswers(res.data.answers || []);
      }
    } catch (err: any) {
      error('Failed to load thread', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetails();
    if (postId) {
      joinForum(postId);
    }
    return () => {
      if (postId) leaveForum(postId);
    };
  }, [postId]);

  useEffect(() => {
    if (socket) {
      const handleAnswerCreated = (data: any) => {
        const answer = data?.answer || data;
        if (answer && answer._id) {
          setAnswers((prev) => {
            if (prev.some((a) => a._id === answer._id)) return prev;
            return [...prev, answer];
          });
          setPost((prev) => (prev ? { ...prev, answersCount: prev.answersCount + 1 } : null));
        }
      };

      const handleAnswerAccepted = (data: { answerId: string; postId?: string }) => {
        if (data?.answerId) {
          setAnswers((prev) =>
            prev.map((a) => ({ ...a, isAccepted: a._id === data.answerId }))
          );
          setPost((prev) => (prev ? { ...prev, hasAcceptedAnswer: true } : null));
        }
      };

      const handleVoteUpdated = (data: { targetType: string; targetId: string; upvotesCount: number; downvotesCount: number }) => {
        if (data?.targetType === 'POST') {
          setPost((prev) =>
            prev && prev._id === data.targetId
              ? { ...prev, upvotesCount: data.upvotesCount, downvotesCount: data.downvotesCount }
              : prev
          );
        } else if (data?.targetType === 'ANSWER') {
          setAnswers((prev) =>
            prev.map((a) =>
              a._id === data.targetId
                ? { ...a, upvotesCount: data.upvotesCount, downvotesCount: data.downvotesCount }
                : a
            )
          );
        }
      };

      socket.on('forum:answer-created', handleAnswerCreated);
      socket.on('forum:answer_created', handleAnswerCreated);
      socket.on('forum:answer-accepted', handleAnswerAccepted);
      socket.on('forum:answer_accepted', handleAnswerAccepted);
      socket.on('forum:vote-updated', handleVoteUpdated);

      return () => {
        socket.off('forum:answer-created', handleAnswerCreated);
        socket.off('forum:answer_created', handleAnswerCreated);
        socket.off('forum:answer-accepted', handleAnswerAccepted);
        socket.off('forum:answer_accepted', handleAnswerAccepted);
        socket.off('forum:vote-updated', handleVoteUpdated);
      };
    }
  }, [socket]);

  const handleVote = async (id: string, targetType: 'POST' | 'ANSWER', voteValue: number) => {
    try {
      const res = await forumApi.handleVote(id, targetType, voteValue);
      if (res.success) {
        if (targetType === 'POST') {
          setPost((prev) =>
            prev
              ? {
                  ...prev,
                  upvotesCount: res.data.upvotesCount,
                  downvotesCount: res.data.downvotesCount,
                  userVote: res.data.userVote,
                }
              : null
          );
        } else {
          setAnswers((prev) =>
            prev.map((a) =>
              a._id === id
                ? {
                    ...a,
                    upvotesCount: res.data.upvotesCount,
                    downvotesCount: res.data.downvotesCount,
                    userVote: res.data.userVote,
                  }
                : a
            )
          );
        }
      }
    } catch (err: any) {
      error('Voting error', err.response?.data?.message);
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    if (!postId) return;
    try {
      const res = await forumApi.markAcceptedAnswer(postId, answerId);
      if (res.success) {
        success('Answer Accepted!', 'Marked as accepted solution (+20 bonus points awarded to author)');
        setAnswers((prev) =>
          prev.map((a) => ({ ...a, isAccepted: a._id === answerId }))
        );
        setPost((prev) => (prev ? { ...prev, hasAcceptedAnswer: true } : null));
      }
    } catch (err: any) {
      error('Action failed', err.response?.data?.message);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId || !answerContent.trim()) return;

    setIsSubmittingAnswer(true);
    try {
      const res = await forumApi.createAnswer(postId, answerContent.trim());
      if (res.success) {
        success('Answer Posted!', 'Your response was added (+10 contribution points earned)');
        setAnswerContent('');
        setAnswers((prev) => [...prev, res.data]);
        setPost((prev) => (prev ? { ...prev, answersCount: prev.answersCount + 1 } : null));
      }
    } catch (err: any) {
      error('Failed to post answer', err.response?.data?.message);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!post) {
    return <div className="p-8 text-center text-xs text-gray-400">Discussion thread not found.</div>;
  }

  const isPostAuthorOrFaculty =
    user?._id === (typeof post.authorId === 'object' ? post.authorId._id : post.authorId) ||
    user?.role === 'FACULTY' ||
    user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Community Forum', to: '/forum' },
          { label: post.title },
        ]}
      />

      {/* Main Question Card */}
      <Card className="flex items-start gap-5 p-6 border-l-4 border-l-blue-600">
        <div className="flex flex-col items-center gap-1 bg-gray-50 dark:bg-slate-800/80 rounded-2xl p-2 flex-shrink-0">
          <button
            onClick={() => handleVote(post._id, 'POST', post.userVote === 1 ? 0 : 1)}
            className={`p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors ${
              post.userVote === 1 ? 'text-blue-600 font-bold' : 'text-gray-400'
            }`}
            title="Upvote Question"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          <span className="text-sm font-black text-gray-900 dark:text-gray-100">
            {post.upvotesCount - post.downvotesCount}
          </span>
          <button
            onClick={() => handleVote(post._id, 'POST', post.userVote === -1 ? 0 : -1)}
            className={`p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors ${
              post.userVote === -1 ? 'text-red-600 font-bold' : 'text-gray-400'
            }`}
            title="Downvote Question"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
              {post.title}
            </h1>
            {post.hasAcceptedAnswer && (
              <Badge variant="emerald" className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Solved
              </Badge>
            )}
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {post.description}
          </p>

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-xs text-gray-600 dark:text-gray-400 font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Avatar src={post.authorId?.avatar} name={post.authorId?.name} size="sm" />
              <div>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{post.authorId?.name}</span>
                <span className="ml-2 text-gray-400">Asked on {formatDateTime(post.createdAt)}</span>
              </div>
            </div>
            <Badge variant="gray">{post.authorRole}</Badge>
          </div>
        </div>
      </Card>

      {/* Answers Section */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
        </h3>

        {answers.map((ans) => (
          <Card
            key={ans._id}
            className={`flex items-start gap-4 p-5 transition-all ${
              ans.isAccepted
                ? 'border-2 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-md'
                : ''
            }`}
          >
            {/* Answer Votes */}
            <div className="flex flex-col items-center gap-1 bg-gray-50 dark:bg-slate-800/80 rounded-xl p-1.5 flex-shrink-0">
              <button
                onClick={() => handleVote(ans._id, 'ANSWER', ans.userVote === 1 ? 0 : 1)}
                className={`p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors ${
                  ans.userVote === 1 ? 'text-blue-600 font-bold' : 'text-gray-400'
                }`}
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {ans.upvotesCount - ans.downvotesCount}
              </span>
              <button
                onClick={() => handleVote(ans._id, 'ANSWER', ans.userVote === -1 ? 0 : -1)}
                className={`p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors ${
                  ans.userVote === -1 ? 'text-red-600 font-bold' : 'text-gray-400'
                }`}
              >
                <ChevronDown className="w-5 h-5" />
              </button>

              {ans.isAccepted && (
                <div className="mt-1 text-emerald-600 dark:text-emerald-400" title="Accepted Solution">
                  <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
                </div>
              )}
            </div>

            {/* Answer Body */}
            <div className="flex-1 min-w-0 space-y-3">
              {ans.isAccepted && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified Solution
                </div>
              )}

              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                {ans.content}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Avatar src={ans.authorId?.avatar} name={ans.authorId?.name} size="sm" />
                  <span>{ans.authorId?.name}</span>
                  <span className="text-[11px]">&bull; {formatDateTime(ans.createdAt)}</span>
                </div>

                {isPostAuthorOrFaculty && !ans.isAccepted && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAcceptAnswer(ans._id)}
                    leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    className="text-xs"
                  >
                    Accept as Solution (+20 pts)
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Answer Composer Box */}
      <Card className="space-y-4 p-6">
        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
          Your Answer &amp; Explanation
        </h4>
        <form onSubmit={handleSubmitAnswer} className="space-y-3">
          <textarea
            className="w-full rounded-2xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
            rows={5}
            placeholder="Write a clear, academic solution to help your peer..."
            value={answerContent}
            onChange={(e) => setAnswerContent(e.target.value)}
            required
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
              Earn +10 points for answering &amp; +20 points if your answer is accepted!
            </span>
            <Button type="submit" isLoading={isSubmittingAnswer}>
              Post Your Answer
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
