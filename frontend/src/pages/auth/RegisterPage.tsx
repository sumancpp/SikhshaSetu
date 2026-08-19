import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { Mail, Lock, User, GraduationCap, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'FACULTY' | 'ADMIN'>('STUDENT');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      error('Missing information', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name,
        email,
        password,
        role,
        studentId: studentId || undefined,
        department,
      });
      success('Account created!', 'Welcome to ShikshaSetu');
      navigate('/dashboard');
    } catch (err: any) {
      error('Registration failed', err.response?.data?.message || 'Error creating account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50/40 to-purple-50 dark:from-[#0b0f19] dark:via-[#0f172a] dark:to-[#0b0f19]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-md mb-1">
            <img src="/logo.png" alt="ShikshaSetu Logo" className="w-14 h-14 object-contain rounded-xl" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-gray-100">
            Shiksha<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600">Setu</span>
          </h1>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide uppercase">
            Join the Next-Gen Academic Community
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                I am joining as a:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setRole('STUDENT')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-[11px] sm:text-xs font-bold transition-all ${
                    role === 'STUDENT'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                      : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <User className="w-3.5 h-3.5 mb-0.5" />
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('FACULTY')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-[11px] sm:text-xs font-bold transition-all ${
                    role === 'FACULTY'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                      : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 mb-0.5" />
                  Faculty
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-[11px] sm:text-xs font-bold transition-all ${
                    role === 'ADMIN'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                      : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 mb-0.5" />
                  Admin
                </button>
              </div>
            </div>

            <Input
              label="Full Name"
              placeholder="e.g. Suman Roy"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Institutional Email"
              type="email"
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Department"
                placeholder="e.g. Computer Science"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
              <Input
                label={role === 'STUDENT' ? 'Roll / Student ID' : role === 'FACULTY' ? 'Faculty ID' : 'Staff / Admin ID'}
                placeholder={role === 'STUDENT' ? 'e.g. CS2026-081' : role === 'FACULTY' ? 'e.g. FAC-2026-01' : 'e.g. ADM-01'}
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full mt-2">
              Complete Registration
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
