import React, { useState, useEffect } from 'react';
import { classApi } from '../../api/class.api';
import { Class } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Layers,
  Plus,
  KeyRound,
  Copy,
  Check,
  Search,
  ArrowRight,
  BookOpen,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modals
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    department: 'Computer Science',
    academicYear: '2026-2027',
    semester: 6,
    section: 'A',
    description: '',
  });

  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await classApi.getClasses();
      if (res.success) {
        setClasses(res.data);
      }
    } catch (err: any) {
      error('Failed to load classes', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success('Copied!', `Class code ${code} copied to clipboard`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoinLoading(true);
    try {
      const res = await classApi.joinClass(joinCode.trim().toUpperCase());
      if (res.success) {
        success('Joined Class!', res.message || 'You are now enrolled in the class');
        setIsJoinOpen(false);
        setJoinCode('');
        fetchClasses();
      }
    } catch (err: any) {
      error('Could not join class', err.response?.data?.message || 'Invalid class code');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const res = await classApi.createClass(formData);
      if (res.success) {
        success('Class Created!', `Class ${formData.name} is ready`);
        setIsCreateOpen(false);
        setFormData({
          name: '',
          department: 'Computer Science',
          academicYear: '2026-2027',
          semester: 6,
          section: 'A',
          description: '',
        });
        fetchClasses();
      }
    } catch (err: any) {
      error('Failed to create class', err.response?.data?.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.department.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            Academic Classes
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Browse and manage department batches, subject curriculums, and student rosters
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsJoinOpen(true)}
            leftIcon={<KeyRound className="w-4 h-4" />}
          >
            Join by Code
          </Button>

          {user?.role === 'ADMIN' && (
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Class
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <Input
          placeholder="Search classes by name, code, or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : filteredClasses.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-6 h-6" />}
          title="No classes found"
          description={search ? 'No classes matched your search filter.' : 'You have not joined any classes yet.'}
          actionText="Join a Class with Code"
          onAction={() => setIsJoinOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((cls) => (
            <Card
              key={cls._id}
              hover
              onClick={() => navigate(`/classes/${cls._id}`)}
              className="flex flex-col justify-between space-y-4 border-t-4 border-t-blue-600"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <Badge variant="blue">Sem {cls.semester} {cls.section ? `• Sec ${cls.section}` : ''}</Badge>
                  {/* Class Join Code Pill */}
                  <button
                    onClick={(e) => handleCopyCode(cls.code, e)}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-[11px] font-mono text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                    title="Click to copy join code"
                  >
                    {copiedCode === cls.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    <span>{cls.code}</span>
                  </button>
                </div>

                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                  {cls.name}
                </h3>
                <p className="text-xs text-gray-400">{cls.department} &bull; Year {cls.academicYear}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                  {cls.description}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-gray-400 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  Subjects Hub
                </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  Enter Class <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Join Class by Code */}
      <Modal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        title="Join Class with Code"
        description="Enter the 6-character unique class join code provided by your instructor or department head."
      >
        <form onSubmit={handleJoinClass} className="space-y-4">
          <Input
            label="Class Join Code"
            placeholder="e.g. CS626A"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={10}
            required
            className="uppercase tracking-widest font-mono text-center text-lg font-bold"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsJoinOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={joinLoading}>
              Join Class
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Class (Admin Only) */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Academic Class"
        description="Establish a new departmental class grouping for faculties, subjects, and student cohorts."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateClass} className="space-y-4">
          <Input
            label="Class Title"
            placeholder="e.g. B.Tech Computer Science - Batch 2026"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              required
            />
            <Input
              label="Academic Year"
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Semester"
              type="number"
              min={1}
              max={10}
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) || 1 })}
              required
            />
            <Input
              label="Section (Optional)"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={3}
              placeholder="Provide a brief overview of this cohort..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createLoading}>
              Create Class
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
