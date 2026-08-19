import React, { useState, useEffect } from 'react';
import { userApi } from '../../api/report.api';
import { User } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { Input } from '../../components/common/Input';
import { Skeleton } from '../../components/common/Skeleton';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import { Users, Search, ShieldAlert, UserCheck, UserX } from 'lucide-react';

export const UsersManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const { success, error } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userApi.getUsers({
        role: roleFilter || undefined,
        search: search || undefined,
      });
      if (res.success) {
        setUsers(res.data.users);
      }
    } catch (err: any) {
      error('Failed to load users', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleToggleSuspend = async (userId: string) => {
    try {
      const res = await userApi.toggleSuspend(userId);
      if (res.success) {
        success('Status Updated', res.message);
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isSuspended: !u.isSuspended } : u))
        );
      }
    } catch (err: any) {
      error('Update failed', err.response?.data?.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
          User Directory &amp; Security Controls
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Admin portal for student rosters, faculty verification, and account suspensions
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {['', 'STUDENT', 'FACULTY', 'ADMIN'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                roleFilter === r
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {r ? `${r.charAt(0) + r.slice(1).toLowerCase()}s` : 'All Roles'}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <Card className="divide-y divide-gray-100 dark:divide-slate-800/80 p-0 overflow-hidden">
          <div className="p-4 bg-gray-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>User Details</span>
            <span>Role &amp; Status Action</span>
          </div>

          {users.map((u) => (
            <div
              key={u._id}
              className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar src={u.avatar} name={u.name} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">{u.name}</h4>
                    {u.isSuspended && (
                      <Badge variant="red" className="text-[10px]">
                        Suspended
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {u.email} &bull; {u.department || 'Computer Science'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={u.role === 'ADMIN' ? 'purple' : u.role === 'FACULTY' ? 'blue' : 'gray'}>
                  {u.role}
                </Badge>

                {u.role !== 'ADMIN' && (
                  <Button
                    size="sm"
                    variant={u.isSuspended ? 'outline' : 'danger'}
                    onClick={() => handleToggleSuspend(u._id)}
                    className="text-xs"
                  >
                    {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};
