import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { classApi } from '../../api/class.api';
import { subjectApi } from '../../api/subject.api';
import { Class, Subject } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Tabs } from '../../components/common/Tabs';
import { Skeleton } from '../../components/common/Skeleton';
import { Avatar } from '../../components/common/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { ClassCommentsTab } from '../../components/classes/ClassCommentsTab';
import { ClassAttendanceTab } from '../../components/classes/ClassAttendanceTab';
import {
  BookOpen,
  Users,
  Plus,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  GraduationCap,
  Shield,
  MessageSquare,
  MapPin,
} from 'lucide-react';

export const ClassDetailPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [classData, setClassData] = useState<Class | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('subjects');
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    description: '',
    semester: 6,
    credits: 4,
  });

  const [isInviteFacultyOpen, setIsInviteFacultyOpen] = useState(false);
  const [facultyEmail, setFacultyEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const fetchClassDetails = async () => {
    if (!classId) return;
    try {
      setLoading(true);
      const res = await classApi.getClassById(classId);
      if (res.success) {
        setClassData(res.data.class);
        setSubjects(res.data.subjects || []);
        setMembers(res.data.members || []);
      }
    } catch (err: any) {
      error('Error loading class', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassDetails();
  }, [classId]);

  const handleCopyCode = () => {
    if (classData?.code) {
      navigator.clipboard.writeText(classData.code);
      setCopiedCode(true);
      success('Copied!', `Class join code ${classData.code} copied`);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleRegenerateCode = async () => {
    if (!classId) return;
    try {
      const res = await classApi.regenerateCode(classId);
      if (res.success) {
        success('Code Regenerated', `New class code: ${res.data.code}`);
        fetchClassDetails();
      }
    } catch (err: any) {
      error('Failed to regenerate code', err.response?.data?.message);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return;

    setSubjectLoading(true);
    try {
      const res = await subjectApi.createSubject({
        ...subjectForm,
        classId,
      });
      if (res.success) {
        success('Subject Created!', `${subjectForm.name} workspace initialized`);
        setIsCreateSubjectOpen(false);
        setSubjectForm({ name: '', code: '', description: '', semester: 6, credits: 4 });
        fetchClassDetails();
      }
    } catch (err: any) {
      error('Failed to create subject', err.response?.data?.message);
    } finally {
      setSubjectLoading(false);
    }
  };

  const handleInviteFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !facultyEmail) return;

    setInviteLoading(true);
    try {
      const res = await classApi.inviteFaculty(classId, facultyEmail);
      if (res.success) {
        success('Faculty Invited', res.message || 'Invitation sent successfully');
        setIsInviteFacultyOpen(false);
        setFacultyEmail('');
        fetchClassDetails();
      }
    } catch (err: any) {
      error('Invite failed', err.response?.data?.message);
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!classData) {
    return (
      <EmptyState
        title="Class Not Found"
        description="The requested class could not be found or you do not have permission to view it."
        actionText="Back to Classes"
        onAction={() => navigate('/classes')}
      />
    );
  }

  const isClassAdminOrFaculty = user?.role === 'ADMIN' || user?.role === 'FACULTY';

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Classes', to: '/classes' },
          { label: classData.name },
        ]}
      />

      {/* Class Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="blue" className="bg-blue-800/80 text-white border-blue-600 text-xs">
                {classData.department}
              </Badge>
              <span className="text-xs text-indigo-200">
                Semester {classData.semester} {classData.section ? `• Section ${classData.section}` : ''}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{classData.name}</h1>
            <p className="text-xs text-indigo-200 max-w-xl">{classData.description}</p>
          </div>

          {/* Join Code & Actions Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex flex-col gap-2.5 min-w-[220px]">
            <span className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">
              Class Join Code
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xl font-black text-white tracking-widest">
                {classData.code}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                title="Copy Join Code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {user?.role === 'ADMIN' && (
              <button
                onClick={handleRegenerateCode}
                className="flex items-center gap-1 text-[10px] text-indigo-200 hover:text-white transition-colors mt-1"
              >
                <RefreshCw className="w-3 h-3" />
                Regenerate Code
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs: Subjects, Comments, Attendance, Members */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-2">
        <Tabs
          tabs={[
            { id: 'subjects', label: 'Subjects Curricula', count: subjects.length, icon: <BookOpen className="w-4 h-4" /> },
            { id: 'comments', label: 'Comments & Inquiries', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'attendance', label: 'Live Attendance', icon: <MapPin className="w-4 h-4" /> },
            { id: 'members', label: 'Class Members', count: members.length, icon: <Users className="w-4 h-4" /> },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {isClassAdminOrFaculty && (
          <div className="flex items-center gap-2">
            {activeTab === 'subjects' && (
              <Button
                size="sm"
                onClick={() => setIsCreateSubjectOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Subject
              </Button>
            )}
            {activeTab === 'members' && user?.role === 'ADMIN' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsInviteFacultyOpen(true)}
                leftIcon={<GraduationCap className="w-4 h-4" />}
              >
                Invite Faculty
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tab Content: Subjects */}
      {activeTab === 'subjects' && (
        <>
          {subjects.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-6 h-6" />}
              title="No subjects yet"
              description="No subject workspaces have been configured for this class."
              actionText={isClassAdminOrFaculty ? 'Add First Subject' : undefined}
              onAction={() => setIsCreateSubjectOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {subjects.map((sub) => (
                <Card
                  key={sub._id}
                  hover
                  onClick={() => navigate(`/subjects/${sub._id}`)}
                  className="space-y-3 flex flex-col justify-between border-t-4 border-t-emerald-600"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <Badge variant="emerald">{sub.code}</Badge>
                      <span className="text-[11px] text-gray-400 font-medium">
                        {sub.credits ? `${sub.credits} Credits` : `Sem ${sub.semester}`}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                      {sub.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {sub.description || 'Access notes, assignments, and discussions.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-400">
                    <span>Faculty: {sub.primaryFacultyId?.name || 'Assigned Faculty'}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      Open Workspace <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab Content: Comments */}
      {activeTab === 'comments' && (
        <ClassCommentsTab classId={classData._id} members={members} />
      )}

      {/* Tab Content: Attendance */}
      {activeTab === 'attendance' && (
        <ClassAttendanceTab classId={classData._id} className={classData.name} />
      )}

      {/* Tab Content: Members */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <Card className="divide-y divide-gray-100 dark:divide-slate-800/80 p-0 overflow-hidden">
            {members.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={member.userId?.avatar} name={member.userId?.name} size="md" />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {member.userId?.name}
                    </h4>
                    <p className="text-xs text-gray-400">{member.userId?.email}</p>
                  </div>
                </div>

                <Badge
                  variant={
                    member.role === 'ADMIN'
                      ? 'purple'
                      : member.role === 'FACULTY'
                      ? 'blue'
                      : 'gray'
                  }
                >
                  {member.role}
                </Badge>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Modal: Create Subject */}
      <Modal
        isOpen={isCreateSubjectOpen}
        onClose={() => setIsCreateSubjectOpen(false)}
        title="Add Subject to Class"
        description="Establish a new subject workspace for syllabus, study materials, quizzes, and forum discussions."
      >
        <form onSubmit={handleCreateSubject} className="space-y-4">
          <Input
            label="Subject Name"
            placeholder="e.g. Distributed Operating Systems"
            value={subjectForm.name}
            onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Subject Code"
              placeholder="e.g. CS601"
              value={subjectForm.code}
              onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
              required
            />
            <Input
              label="Credits"
              type="number"
              min={1}
              max={10}
              value={subjectForm.credits}
              onChange={(e) => setSubjectForm({ ...subjectForm, credits: parseInt(e.target.value) || 4 })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Subject Overview
            </label>
            <textarea
              className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={3}
              placeholder="Brief course objectives..."
              value={subjectForm.description}
              onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsCreateSubjectOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={subjectLoading}>
              Create Subject Hub
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Invite Faculty */}
      <Modal
        isOpen={isInviteFacultyOpen}
        onClose={() => setIsInviteFacultyOpen(false)}
        title="Invite Faculty Member"
        description="Grant instructor privileges to an academic colleague for this class."
      >
        <form onSubmit={handleInviteFaculty} className="space-y-4">
          <Input
            label="Faculty Email Address"
            type="email"
            placeholder="prof.name@university.edu"
            value={facultyEmail}
            onChange={(e) => setFacultyEmail(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsInviteFacultyOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={inviteLoading}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
