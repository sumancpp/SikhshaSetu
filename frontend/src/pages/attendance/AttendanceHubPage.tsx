import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { classApi } from '../../api/class.api';
import { subjectApi } from '../../api/subject.api';
import { attendanceApi } from '../../api/attendance.api';
import { Class, Subject, AttendanceSession } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Tabs } from '../../components/common/Tabs';
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
  BookOpen,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Navigation,
  Clock,
  ExternalLink,
} from 'lucide-react';

export const AttendanceHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'subjects' | 'classes'>('subjects');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  // Target item for launching attendance
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subsRes, classRes] = await Promise.allSettled([
        subjectApi.getSubjects(),
        classApi.getClasses(),
      ]);

      if (subsRes.status === 'fulfilled' && subsRes.value.success) {
        setSubjects(subsRes.value.data);
      }
      if (classRes.status === 'fulfilled' && classRes.value.success) {
        setClasses(classRes.value.data);
      }
    } catch (err: any) {
      error('Failed to load data', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  const handleOpenSubjectModal = (sub: Subject) => {
    setSelectedSubject(sub);
    setSelectedClass(null);
    setSessionTitle(`${sub.name} (${sub.code}) - Lecture Attendance`);
    acquireFacultyGps();
    setIsStartModalOpen(true);
  };

  const handleOpenClassModal = (cls: Class) => {
    setSelectedClass(cls);
    setSelectedSubject(null);
    setSessionTitle(`${cls.name} - Live Session`);
    acquireFacultyGps();
    setIsStartModalOpen(true);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!facultyCoords) {
      error('Location Required', 'Please acquire classroom GPS location before launching session.');
      acquireFacultyGps();
      return;
    }

    setCreatingSession(true);
    try {
      let res;
      if (selectedSubject) {
        res = await attendanceApi.createSubjectSession(selectedSubject._id, {
          title: sessionTitle.trim(),
          centerLatitude: facultyCoords.latitude,
          centerLongitude: facultyCoords.longitude,
          allowedRadiusMeters: radiusMeters,
          durationMinutes: durationMinutes,
        });
      } else if (selectedClass) {
        res = await attendanceApi.createSession(selectedClass._id, {
          title: sessionTitle.trim(),
          centerLatitude: facultyCoords.latitude,
          centerLongitude: facultyCoords.longitude,
          allowedRadiusMeters: radiusMeters,
          durationMinutes: durationMinutes,
        });
      }

      if (res && res.success) {
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
                📍 Subject &amp; Class Geolocation Attendance
              </Badge>
              <span className="text-xs text-indigo-200">10-Sec Rotating Dynamic QR</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Live Classroom Attendance Hub
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 max-w-2xl leading-relaxed">
              Take lecture attendance for individual subjects or entire classes. Faculty and Admins can view
              student names, verify distances, and inspect exact real-time GPS locations on Google Maps.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isFacultyOrAdmin ? (
              <Button
                onClick={() => {
                  if (subjects.length > 0) {
                    handleOpenSubjectModal(subjects[0]);
                  } else if (classes.length > 0) {
                    handleOpenClassModal(classes[0]);
                  } else {
                    error('No Subjects', 'Please create or assign a subject first.');
                  }
                }}
                leftIcon={<QrCode className="w-4 h-4" />}
                className="shadow-lg shadow-indigo-500/30 text-xs font-bold"
              >
                🚀 Quick Start Subject QR
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
            QR token refreshes automatically every 10 seconds. Static screenshots forwarded to students at home expire immediately.
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
            Live Google Maps Inspection
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Faculty and Admins can view every student's name, verified proximity, and exact live GPS pin on Google Maps.
          </p>
        </Card>
      </div>

      {/* Tabs: Individual Subjects vs Classes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-2">
        <Tabs
          tabs={[
            { id: 'subjects', label: 'Individual Subjects', count: subjects.length, icon: <BookOpen className="w-4 h-4" /> },
            { id: 'classes', label: 'Entire Classes', count: classes.length, icon: <Layers className="w-4 h-4" /> },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as 'subjects' | 'classes')}
        />
      </div>

      {/* Subject List & Actions */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-xs text-gray-400">Loading subject workspaces...</div>
          ) : subjects.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-8 h-8 text-gray-400" />}
              title="No subjects found"
              description="No subject workspaces have been configured yet."
              actionText="Go to Subjects"
              onAction={() => navigate('/subjects')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {subjects.map((sub) => (
                <Card
                  key={sub._id}
                  className="p-5 flex flex-col justify-between border-t-4 border-t-emerald-600 space-y-4 hover:shadow-lg transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <Badge variant="emerald">{sub.code}</Badge>
                      <span className="text-[10px] text-gray-400 font-mono">
                        Sem {sub.semester} {sub.credits ? `• ${sub.credits} Credits` : ''}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                      {sub.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {sub.description || 'Subject curriculum, materials, and live lecture attendance.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    {isFacultyOrAdmin ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleOpenSubjectModal(sub)}
                          leftIcon={<QrCode className="w-3.5 h-3.5" />}
                          className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                        >
                          Start Subject QR
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/subjects/${sub._id}`)}
                          className="text-xs"
                        >
                          Open Hub
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
                          onClick={() => navigate(`/subjects/${sub._id}`)}
                          className="text-xs"
                        >
                          View Subject
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Class List & Actions */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
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
                          onClick={() => handleOpenClassModal(cls)}
                          leftIcon={<QrCode className="w-3.5 h-3.5" />}
                          className="text-xs font-bold"
                        >
                          Start Class QR
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
      )}

      {/* Modal: Launch Dynamic QR Session (Faculty) */}
      <Modal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        title={`🚀 Launch Dynamic Attendance for "${selectedSubject?.name || selectedClass?.name}"`}
        description="Establish a 5-minute time-window with real-time GPS coordinate perimeter checking."
        maxWidth="md"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <Input
            label="Session Title / Lecture Topic"
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
                <option value={50}>50 meters (Classroom / Lab)</option>
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
