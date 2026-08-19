import React, { useState, useEffect } from 'react';
import { subjectApi } from '../../api/subject.api';
import { Subject } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { BookOpen, Search, ArrowRight, Layers, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const res = await subjectApi.getSubjects();
        if (res.success) {
          setSubjects(res.data);
        }
      } catch (err) {
        // Ignore
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const filtered = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
          Subject Workspaces
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          All active academic courses, syllabus materials, and assignments across your enrolled classes
        </p>
      </div>

      <div className="max-w-md">
        <Input
          placeholder="Filter subjects by name or course code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-6 h-6" />}
          title="No subjects found"
          description="You are not enrolled in any subjects yet or no match was found."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((sub) => (
            <Card
              key={sub._id}
              hover
              onClick={() => navigate(`/subjects/${sub._id}`)}
              className="space-y-3 flex flex-col justify-between border-t-4 border-t-blue-600"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <Badge variant="blue">{sub.code}</Badge>
                  <span className="text-[11px] text-gray-400 font-medium">Sem {sub.semester}</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                  {sub.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                  {sub.description || 'Access notes, assignments, and discussions.'}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {sub.primaryFacultyId?.name || 'Faculty'}
                </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  Open Workspace <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
