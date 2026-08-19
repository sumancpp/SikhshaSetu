import React, { useState, useEffect } from 'react';
import { forumApi } from '../../api/forum.api';
import { subjectApi } from '../../api/subject.api';
import { ForumPost, Subject } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Avatar } from '../../components/common/Avatar';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import {
  MessageSquare,
  Plus,
  Search,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Tag,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ForumFeedPage: React.FC = () => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [audienceFilter, setAudienceFilter] = useState<'ALL' | 'DEPARTMENT_ONLY' | 'FACULTY_AND_PARENTS'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [trendingTags, setTrendingTags] = useState<any[]>([]);

  // Create post modal
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    tags: '',
    subjectId: '',
    audience: 'ALL' as 'ALL' | 'DEPARTMENT_ONLY' | 'FACULTY_AND_PARENTS',
    targetDepartment: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();
  const { success, error } = useToast();

  const isStudent = user?.role === 'STUDENT';

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await forumApi.getPosts({
        filter: filter !== 'ALL' ? filter : undefined,
        search: search || undefined,
        tag: selectedTag || undefined,
        audience: audienceFilter !== 'ALL' ? audienceFilter : undefined,
        department: audienceFilter === 'DEPARTMENT_ONLY' ? user?.department : undefined,
      });
      if (res.success) {
        setPosts(res.data.posts);
      }
    } catch (err) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filter, audienceFilter, selectedTag]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [tagsRes, subjectsRes] = await Promise.allSettled([
          forumApi.getTrendingTags(),
          subjectApi.getSubjects(),
        ]);
        if (tagsRes.status === 'fulfilled' && tagsRes.value.success) {
          setTrendingTags(tagsRes.value.data);
        }
        if (subjectsRes.status === 'fulfilled' && subjectsRes.value.success) {
          setSubjects(subjectsRes.value.data);
        }
      } catch (err) {
        // Ignore
      }
    };
    fetchInitialData();
  }, []);

  const handleVote = async (postId: string, voteValue: number) => {
    try {
      const res = await forumApi.handleVote(postId, 'POST', voteValue);
      if (res.success) {
        setPosts((prev) =>
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            Academic Community Forum
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Ask technical questions, share academic insights, and earn mentor points for accepted solutions
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsNewPostOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Ask Question
        </Button>
      </div>

      {/* Audience Board Switcher */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-x-auto">
        <button
          onClick={() => setAudienceFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            audienceFilter === 'ALL'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          🌐 All Campus Q&amp;A
        </button>

        <button
          onClick={() => setAudienceFilter('DEPARTMENT_ONLY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            audienceFilter === 'DEPARTMENT_ONLY'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          🏛️ My Department ({user?.department || 'General'})
        </button>

        {!isStudent ? (
          <button
            onClick={() => setAudienceFilter('FACULTY_AND_PARENTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              audienceFilter === 'FACULTY_AND_PARENTS'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40'
            }`}
          >
            👨‍🏫 Faculty &amp; Parents Community Board
          </button>
        ) : (
          <div
            title="Restricted: Visible only to Faculty, Administrators, and Parents."
            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 dark:text-slate-600 flex items-center gap-1.5 cursor-not-allowed shrink-0"
          >
            <span>🔒 Faculty &amp; Parents Board (Staff Only)</span>
          </div>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {['ALL', 'UNANSWERED', 'SOLVED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === f
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:border-gray-300'
              }`}
            >
              {f === 'ALL' ? 'All Questions' : f === 'UNANSWERED' ? 'Needs Answer' : 'Solved'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="w-full md:w-72">
          <Input
            placeholder="Search discussion threads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </form>
      </div>

      {/* Main Grid: Feed + Trending Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-3">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="w-6 h-6" />}
              title="No questions found"
              description="Be the first to post a query in this discussion board."
              actionText="Ask a Question"
              onAction={() => setIsNewPostOpen(true)}
            />
          ) : (
            posts.map((post) => (
              <Card key={post._id} className="flex items-start gap-4 p-5 hover:border-blue-300 dark:hover:border-blue-800">
                {/* Voting Column */}
                <div className="flex flex-col items-center gap-1 bg-gray-50 dark:bg-slate-800/80 rounded-xl p-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleVote(post._id, post.userVote === 1 ? 0 : 1)}
                    className={`p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors ${
                      post.userVote === 1 ? 'text-blue-600 font-bold' : 'text-gray-400'
                    }`}
                    title="Upvote"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    {post.upvotesCount - post.downvotesCount}
                  </span>
                  <button
                    onClick={() => handleVote(post._id, post.userVote === -1 ? 0 : -1)}
                    className={`p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors ${
                      post.userVote === -1 ? 'text-red-600 font-bold' : 'text-gray-400'
                    }`}
                    title="Downvote"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/forum/${post._id}`}
                      className="text-base font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                    >
                      {post.title}
                    </Link>

                    {post.audience === 'FACULTY_AND_PARENTS' && (
                      <Badge variant="purple" className="text-[10px]">
                        🔒 Faculty &amp; Parents
                      </Badge>
                    )}

                    {post.audience === 'DEPARTMENT_ONLY' && (
                      <Badge variant="blue" className="text-[10px]">
                        🏛️ {post.targetDepartment || 'Dept'} Only
                      </Badge>
                    )}

                    {post.hasAcceptedAnswer && (
                      <Badge variant="emerald" className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Accepted Solution
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {post.description}
                  </p>

                  {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {post.tags.map((tag, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                            selectedTag === tag
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Footer Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={post.authorId?.avatar}
                        name={post.authorId?.name || 'User'}
                        size="sm"
                      />
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {post.authorId?.name}
                      </span>
                      <span>•</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {post.answersCount} {post.answersCount === 1 ? 'answer' : 'answers'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Sidebar: Trending Tags */}
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Trending Topics
            </h3>

            {trendingTags.length === 0 ? (
              <p className="text-xs text-gray-400">No popular tags yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {trendingTags.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedTag(selectedTag === t._id ? '' : t._id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                      selectedTag === t._id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>#{t._id}</span>
                    <span className="text-[10px] opacity-60">({t.count})</span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal: New Forum Question */}
      <Modal
        isOpen={isNewPostOpen}
        onClose={() => setIsNewPostOpen(false)}
        title="Ask Academic Question / Discussion"
        description="Share your doubt with the community and earn points when participating."
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!postForm.title.trim() || !postForm.description.trim()) {
              error('Incomplete Question', 'Please provide a title and detailed description');
              return;
            }
            setIsSubmitting(true);
            try {
              const res = await forumApi.createPost({
                title: postForm.title.trim(),
                description: postForm.description.trim(),
                subjectId: postForm.subjectId || undefined,
                audience: postForm.audience,
                targetDepartment:
                  postForm.audience === 'DEPARTMENT_ONLY'
                    ? postForm.targetDepartment || user?.department
                    : undefined,
                tags: postForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
              });
              if (res.success) {
                success('Question Posted!', 'Your question is now live in the forum (+5 pts earned)');
                setIsNewPostOpen(false);
                setPostForm({
                  title: '',
                  description: '',
                  tags: '',
                  subjectId: '',
                  audience: 'ALL',
                  targetDepartment: '',
                });
                fetchPosts();
              }
            } catch (err: any) {
              error('Post failed', err.response?.data?.message || 'Unable to post question');
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="space-y-4"
        >
          <Input
            label="Question Title"
            placeholder="e.g. How does virtual memory paging prevent external fragmentation?"
            value={postForm.title}
            onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Target Board &amp; Audience
              </label>
              <select
                className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none"
                value={postForm.audience}
                onChange={(e) =>
                  setPostForm({
                    ...postForm,
                    audience: e.target.value as any,
                  })
                }
              >
                <option value="ALL">🌐 All Campus Public</option>
                <option value="DEPARTMENT_ONLY">
                  🏛️ Department Only ({user?.department || 'My Department'})
                </option>
                {!isStudent && (
                  <option value="FACULTY_AND_PARENTS">
                    👨‍🏫 Faculty &amp; Parents Exclusive Board
                  </option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Subject Category (Optional)
              </label>
              <select
                className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none"
                value={postForm.subjectId}
                onChange={(e) => setPostForm({ ...postForm, subjectId: e.target.value })}
              >
                <option value="">General Academic Community</option>
                {subjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Detailed Description
            </label>
            <textarea
              className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={4}
              placeholder="Include code snippets or problem context..."
              value={postForm.description}
              onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
              required
            />
          </div>

          <Input
            label="Tags (comma separated)"
            placeholder="operating-systems, memory, paging"
            value={postForm.tags}
            onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsNewPostOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Publish Question
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
