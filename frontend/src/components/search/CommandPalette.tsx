import React, { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, Layers, FileText, Target, MessageSquare, Plus, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '../../api/search.api';
import { useAuth } from '../../context/AuthContext';

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({
    classes: [],
    subjects: [],
    materials: [],
    assignments: [],
    challenges: [],
    forumPosts: [],
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Global key listener: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ classes: [], subjects: [], materials: [], assignments: [], challenges: [], forumPosts: [] });
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ classes: [], subjects: [], materials: [], assignments: [], challenges: [], forumPosts: [] });
      return;
    }

    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchApi.globalSearch(query);
        if (res.success) {
          setResults(res.data);
        }
      } catch (err) {
        // Ignore
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [query]);

  const handleSelect = (url: string) => {
    setIsOpen(false);
    navigate(url);
  };

  if (!isOpen) return null;

  const hasResults =
    results.classes?.length > 0 ||
    results.subjects?.length > 0 ||
    results.materials?.length > 0 ||
    results.assignments?.length > 0 ||
    results.challenges?.length > 0 ||
    results.forumPosts?.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in-50">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search classes, subjects, assignments, materials, forum... (or type / for quick action)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-gray-500 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {!query && (
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">
                Quick Navigation
              </p>
              <button
                onClick={() => handleSelect('/classes')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/80 text-left text-sm text-gray-800 dark:text-gray-200 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-blue-500" />
                  View All Classes
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={() => handleSelect('/challenges')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/80 text-left text-sm text-gray-800 dark:text-gray-200 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Target className="w-4 h-4 text-amber-500" />
                  Daily & Weekly Challenges
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={() => handleSelect('/leaderboard')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/80 text-left text-sm text-gray-800 dark:text-gray-200 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-sm">🏆</span>
                  Points Leaderboard
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={() => handleSelect('/forum')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/80 text-left text-sm text-gray-800 dark:text-gray-200 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-purple-500" />
                  Community Q&A Forum
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          )}

          {loading && (
            <div className="p-8 text-center text-xs text-gray-400">Searching platform assets...</div>
          )}

          {query && !loading && !hasResults && (
            <div className="p-8 text-center text-xs text-gray-400">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Classes */}
          {results.classes?.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">
                Classes
              </p>
              {results.classes.map((c: any) => (
                <div
                  key={c._id}
                  onClick={() => handleSelect(`/classes/${c._id}`)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/60 dark:hover:bg-slate-800/80 cursor-pointer text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-blue-500" />
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{c.name}</span>
                      <span className="text-xs text-gray-400 ml-2">Code: {c.code}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </div>
              ))}
            </div>
          )}

          {/* Subjects */}
          {results.subjects?.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">
                Subjects
              </p>
              {results.subjects.map((s: any) => (
                <div
                  key={s._id}
                  onClick={() => handleSelect(`/subjects/${s._id}`)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/60 dark:hover:bg-slate-800/80 cursor-pointer text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-emerald-500" />
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{s.name}</span>
                      <span className="text-xs text-gray-400 ml-2">({s.code})</span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </div>
              ))}
            </div>
          )}

          {/* Assignments */}
          {results.assignments?.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">
                Assignments
              </p>
              {results.assignments.map((a: any) => (
                <div
                  key={a._id}
                  onClick={() => handleSelect(`/subjects/${a.subjectId?._id || a.subjectId}`)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/60 dark:hover:bg-slate-800/80 cursor-pointer text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{a.title}</span>
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 ml-2">+{a.rewardPoints} pts</span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </div>
              ))}
            </div>
          )}

          {/* Challenges */}
          {results.challenges?.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">
                Challenges
              </p>
              {results.challenges.map((ch: any) => (
                <div
                  key={ch._id}
                  onClick={() => handleSelect('/challenges')}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50/60 dark:hover:bg-slate-800/80 cursor-pointer text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <Target className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{ch.title}</span>
                      <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">+{ch.rewardPoints} pts</span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </div>
              ))}
            </div>
          )}

          {/* Forum */}
          {results.forumPosts?.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">
                Forum Discussions
              </p>
              {results.forumPosts.map((fp: any) => (
                <div
                  key={fp._id}
                  onClick={() => handleSelect(`/forum/${fp._id}`)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-purple-50/60 dark:hover:bg-slate-800/80 cursor-pointer text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-purple-500" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{fp.title}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
