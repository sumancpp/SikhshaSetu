import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { classApi } from '../../api/class.api';
import { attendanceApi } from '../../api/attendance.api';
import { Class, AttendanceSession } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { EmptyState } from '../../components/common/EmptyState';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { DynamicQrAttendanceModal } from '../../components/attendance/DynamicQrAttendanceModal';
import { StudentAttendanceScannerModal } from '../../components/attendance/StudentAttendanceScannerModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  QrCode,
  MapPin,
  Users,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Navigation,
  Clock,
  ExternalLink,
} from 'lucide-react';

export const AttendanceHubPage: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  // Active QR Session Modal (Faculty)
  const [activeQrSession, setActiveQrSession] = useState<AttendanceSession | null>(null);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);

  // Student Scanner Modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Session form
  const [sessionTitle, setSessionTitle] = useState('');
  const [radiusMeters, setRadiusMeters] = useState(100);
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [facultyCoords, setFacultyCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locatingFaculty, setLocatingFaculty] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);

  const { user } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  const isFacultyOrAdmin = user?.role === 'FACULTY' || user?.role === 'ADMIN';

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

  const acquireFacultyGps = () => {
    if (!navigator.geolocation) {
      error('Geolocation Not Supported', 'Your browser does not support GPS Geolocation.');
      return;
    }

    setLocatingFaculty(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFacultyCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocatingFaculty(false);
        info('GPS Coordinates Locked', `Classroom location: (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
      },
      (err) => {
        setLocatingFaculty(false);
        error('GPS Error', err.message || 'Please allow location permission in your browser.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleOpenStartModal = (cls: Class) => {
    setSelectedClass(cls);
    setSessionTitle(`${cls.name} - Live Lecture`);
    acquireFacultyGps();
    setIsStartModalOpen(true);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    if (!facultyCoords) {
      error('Location Required', 'Please acquire classroom GPS location before launching session.');
      acquireFacultyGps();
      return;
    }

    setCreatingSession(true);
    try {
      const res = await attendanceApi.createSession(selectedClass._id, {
        title: sessionTitle.trim(),
        centerLatitude: facultyCoords.latitude,
        centerLongitude: facultyCoords.longitude,
        allowedRadiusMeters: radiusMeters,
        durationMinutes: durationMinutes,
      });

      if (res.success) {
        setIsStartModalOpen(false);
        setActiveQrSession(res.data);
        success('Session Active!', '5-minute anti-cheat dynamic QR is now live on screen.');
      }
    } catch (err: any) {
      error('Failed to start session', err.response?.data?.message);
    } finally {
      setCreatingSession(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Live Attendance' }]} />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="blue" className="bg-indigo-600 text-white text-xs">
                📍 Geolocation &amp; Rotating HMAC
              </Badge>
              <span className="text-xs text-indigo-200">5-Minute Anti-Proxy Protocol</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Live Classroom Attendance Hub
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 max-w-2xl leading-relaxed">
              Launch dynamic 10-second rotating QR codes verified with mobile GPS coordinates to ensure student
              physical presence in the classroom without proxy cheating.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isFacultyOrAdmin ? (
              <Button
                onClick={() => {
                  if (classes.length > 0) {
                    handleOpenStartModal(classes[0]);
                  } else {
                    error('No Classes', 'Please create or join a class first.');
                  }
                }}
                leftIcon={<QrCode className="w-4 h-4" />}
                className="shadow-lg shadow-indigo-500/30 text-xs font-bold"
              >
                🚀 Quick Start QR Session
              </Button>
            ) : (
              <Button
                onClick={() => setIsScannerOpen(true)}
                leftIcon={<MapPin className="w-4 h-4" />}
                className="shadow-lg shadow-emerald-500/30 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-none"
              >
                📍 Scan QR &amp; Check In
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* How it works info strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-indigo-500 space-y-1">
          <div className="flex items-center gap-2 font-bold text-xs text-gray-900 dark:text-gray-100">
            <Clock className="w-4 h-4 text-indigo-500" />
            10-Second Dynamic Token
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            QR code updates automatically every 10 seconds. Static screenshots forwarded to students at home expire immediately.
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500 space-y-1">
          <div className="flex items-center gap-2 font-bold text-xs text-gray-900 dark:text-gray-100">
            <Navigation className="w-4 h-4 text-blue-500" />
            Haversine GPS Verification
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Compares mobile GPS coordinates with classroom center. Submissions outside the allowed radius (e.g. 100m) are rejected.
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500 space-y-1">
          <div className="flex items-center gap-2 font-bold text-xs text-gray-900 dark:text-gray-100">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Anti-Screen Capture Guard
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            High-frequency canvas animations and watermarks prevent clear camera recording and photo sharing.
          </p>
        </Card>
      </div>

      {/* Class List & Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            {isFacultyOrAdmin ? 'Select Class to Launch or View Attendance' : 'My Enrolled Classes & Attendance'}
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-gray-400">Loading classes...</div>
        ) : classes.length === 0 ? (
          <EmptyState
            icon={<Layers className="w-8 h-8 text-gray-400" />}
            title="No classes found"
            description="You are not assigned to any classes yet. Join or create a class first."
            actionText="Go to Classes"
            onAction={() => navigate('/classes')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {classes.map((cls) => (
              <Card
                key={cls._id}
                className="p-5 flex flex-col justify-between border-t-4 border-t-indigo-600 space-y-4 hover:shadow-lg transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <Badge variant="purple">{cls.code}</Badge>
                    <span className="text-[10px] text-gray-400 font-mono">
                      Sem {cls.semester} • {cls.department}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                    {cls.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {cls.description || 'Classroom workspace for lectures, curricula, and dynamic attendance.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {isFacultyOrAdmin ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleOpenStartModal(cls)}
                        leftIcon={<QrCode className="w-3.5 h-3.5" />}
                        className="text-xs font-bold"
                      >
                        Start QR Session
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/classes/${cls._id}`)}
                        className="text-xs"
                      >
                        View Tab
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={() => setIsScannerOpen(true)}
                        leftIcon={<MapPin className="w-3.5 h-3.5" />}
                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Check In Now
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/classes/${cls._id}`)}
                        className="text-xs"
                      >
                        View History
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Launch Dynamic QR Session (Faculty) */}
      <Modal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        title={`🚀 Launch Live Dynamic QR for "${selectedClass?.name}"`}
        description="Establish a 5-minute time-window with real-time GPS coordinate perimeter checking."
        maxWidth="md"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <Input
            label="Session Title"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Allowed Radius (meters)
              </label>
              <select
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-gray-800 dark:text-gray-200"
              >
                <option value={50}>50 meters (Standard Classroom)</option>
                <option value={100}>100 meters (Lecture Hall)</option>
                <option value={200}>200 meters (Auditorium / Complex)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Session Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-gray-800 dark:text-gray-200"
              >
                <option value={3}>3 minutes</option>
                <option value={5}>5 minutes (Recommended)</option>
                <option value={10}>10 minutes</option>
              </select>
            </div>
          </div>

          {/* GPS Status */}
          <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
            <div className="flex items-center gap-2">
              <Navigation className={`w-4 h-4 ${locatingFaculty ? 'animate-spin' : ''}`} />
              <div>
                <div className="font-bold">
                  {facultyCoords ? '📍 Classroom Coordinates Locked' : 'Locating classroom GPS...'}
                </div>
                {facultyCoords && (
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                    Lat: {facultyCoords.latitude.toFixed(4)}, Lng: {facultyCoords.longitude.toFixed(4)}
                  </div>
                )}
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={acquireFacultyGps}
              disabled={locatingFaculty}
              className="text-xs h-7"
            >
              Recalibrate
            </Button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsStartModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creatingSession || !facultyCoords}
              leftIcon={<QrCode className="w-4 h-4" />}
            >
              {creatingSession ? 'Starting Session...' : 'Start Dynamic QR Session'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Live Dynamic QR Presentation */}
      {activeQrSession && (
        <DynamicQrAttendanceModal
          isOpen={Boolean(activeQrSession)}
          onClose={() => setActiveQrSession(null)}
          session={activeQrSession}
        />
      )}

      {/* Modal: Student QR Scanner & GPS Check-In */}
      <StudentAttendanceScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
};
