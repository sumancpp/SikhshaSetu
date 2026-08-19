import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../../api/attendance.api';
import { AttendanceSession, AttendanceRecord, Subject } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { EmptyState } from '../common/EmptyState';
import { DynamicQrAttendanceModal } from '../attendance/DynamicQrAttendanceModal';
import { StudentAttendanceScannerModal } from '../attendance/StudentAttendanceScannerModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  MapPin,
  QrCode,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Navigation,
  Sparkles,
  ShieldCheck,
  Calendar,
  Percent,
  ExternalLink,
} from 'lucide-react';

interface SubjectAttendanceTabProps {
  subject: Subject;
}

export const SubjectAttendanceTab: React.FC<SubjectAttendanceTabProps> = ({ subject }) => {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [studentHistory, setStudentHistory] = useState<{
    records: AttendanceRecord[];
    totalPresent: number;
    attendancePercentage: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isStartSessionOpen, setIsStartSessionOpen] = useState(false);
  const [activeQrSession, setActiveQrSession] = useState<AttendanceSession | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Faculty session form
  const [sessionTitle, setSessionTitle] = useState(
    `${subject.name} (${subject.code}) - Lecture Attendance`
  );
  const [radiusMeters, setRadiusMeters] = useState(100);
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [facultyCoords, setFacultyCoords] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [locatingFaculty, setLocatingFaculty] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);

  const { user } = useAuth();
  const { success, error, info } = useToast();

  const isFacultyOrAdmin = user?.role === 'FACULTY' || user?.role === 'ADMIN';

  const fetchData = async () => {
    try {
      setLoading(true);
      if (isFacultyOrAdmin) {
        const res = await attendanceApi.getSubjectHistory(subject._id);
        if (res.success) {
          setSessions(res.data);
        }
      } else {
        const res = await attendanceApi.getStudentHistory({ subjectId: subject._id });
        if (res.success) {
          setStudentHistory(res.data);
        }
      }
    } catch (err: any) {
      error('Failed to load attendance', err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [subject._id, isFacultyOrAdmin]);

  // Acquire Faculty's current GPS location
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
        info(
          'Classroom Coordinates Locked',
          `GPS locked: (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
        );
      },
      (err) => {
        setLocatingFaculty(false);
        error('GPS Error', err.message || 'Please enable location access in your browser.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!facultyCoords) {
      error('Location Required', 'Please lock classroom GPS coordinates before starting session.');
      acquireFacultyGps();
      return;
    }

    setCreatingSession(true);
    try {
      const res = await attendanceApi.createSubjectSession(subject._id, {
        title: sessionTitle.trim(),
        centerLatitude: facultyCoords.latitude,
        centerLongitude: facultyCoords.longitude,
        allowedRadiusMeters: radiusMeters,
        durationMinutes: durationMinutes,
      });

      if (res.success) {
        setIsStartSessionOpen(false);
        setActiveQrSession(res.data);
        fetchData();
        success('Subject Attendance Live!', '5-minute dynamic QR code is now active on screen.');
      }
    } catch (err: any) {
      error('Failed to start session', err.response?.data?.message);
    } finally {
      setCreatingSession(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 shadow-xl border border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="blue" className="bg-indigo-600 text-white text-xs">
                {subject.code} Attendance Hub
              </Badge>
              <span className="text-xs text-indigo-200">Anti-Proxy Rotating Dynamic QR</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              {subject.name} - Subject Attendance
            </h2>
            <p className="text-xs text-indigo-200 max-w-xl">
              Track lecture attendance for {subject.name}. Faculty and Admins can view the live student roster
              with exact verified GPS coordinates and Google Maps pin locations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isFacultyOrAdmin ? (
              <Button
                onClick={() => {
                  acquireFacultyGps();
                  setIsStartSessionOpen(true);
                }}
                leftIcon={<QrCode className="w-4 h-4" />}
                className="shadow-lg shadow-indigo-500/30 text-xs font-bold"
              >
                🚀 Start Subject QR Session
              </Button>
            ) : (
              <Button
                onClick={() => setIsScannerOpen(true)}
                leftIcon={<MapPin className="w-4 h-4" />}
                className="shadow-lg shadow-indigo-500/30 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-none"
              >
                📍 Scan QR &amp; Check In
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Student Personal Stats Card */}
      {!isFacultyOrAdmin && studentHistory && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 border-l-4 border-l-emerald-500 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 font-semibold">Subject Attendance Rate</span>
              <div className="text-2xl font-black text-emerald-600">
                {studentHistory.attendancePercentage}%
              </div>
            </div>
            <Percent className="w-8 h-8 text-emerald-500/30" />
          </Card>

          <Card className="p-4 border-l-4 border-l-blue-500 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 font-semibold">Lectures Attended</span>
              <div className="text-2xl font-black text-blue-600">
                {studentHistory.totalPresent} Sessions
              </div>
            </div>
            <CheckCircle2 className="w-8 h-8 text-blue-500/30" />
          </Card>

          <Card className="p-4 border-l-4 border-l-amber-500 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 font-semibold">Earned Points</span>
              <div className="text-2xl font-black text-amber-600">
                +{studentHistory.totalPresent * 5} pts
              </div>
            </div>
            <Sparkles className="w-8 h-8 text-amber-500/30" />
          </Card>
        </div>
      )}

      {/* Session History & Live Attendance Table */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-500" />
          {isFacultyOrAdmin
            ? `Past Attendance Sessions for ${subject.code}`
            : `My ${subject.name} Attendance History`}
        </h3>

        {loading ? (
          <div className="text-center py-8 text-xs text-gray-400">Loading attendance data...</div>
        ) : isFacultyOrAdmin ? (
          sessions.length === 0 ? (
            <EmptyState
              icon={<QrCode className="w-8 h-8 text-gray-400" />}
              title="No attendance sessions recorded yet"
              description={`Launch a 5-minute dynamic attendance session for ${subject.name} above.`}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-gray-200 dark:border-slate-800 text-gray-500 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Session Title</th>
                    <th className="py-2.5 px-3">Date &amp; Time</th>
                    <th className="py-2.5 px-3">Allowed Radius</th>
                    <th className="py-2.5 px-3">Turnout</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Roster &amp; GPS Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {sessions.map((sess) => {
                    const isLive =
                      sess.status === 'ACTIVE' && new Date(sess.endTime).getTime() > Date.now();
                    return (
                      <tr key={sess._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/50">
                        <td className="py-3 px-3 font-bold text-gray-900 dark:text-gray-100">
                          {sess.title}
                        </td>
                        <td className="py-3 px-3 text-gray-500">
                          {new Date(sess.startTime).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-gray-500 font-mono">
                          {sess.allowedRadiusMeters}m
                        </td>
                        <td className="py-3 px-3 font-semibold text-emerald-600">
                          {sess.attendanceCount} verified
                        </td>
                        <td className="py-3 px-3">
                          {isLive ? (
                            <Badge variant="emerald" className="animate-pulse">
                              🟢 Live Now
                            </Badge>
                          ) : (
                            <Badge variant="gray">Completed</Badge>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveQrSession(sess)}
                            className="text-[11px] h-7"
                          >
                            View Student GPS Roster
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Student Records List */
          !studentHistory || studentHistory.records.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="w-8 h-8 text-gray-400" />}
              title="No records yet"
              description={`Your verified check-ins for ${subject.name} will appear here.`}
            />
          ) : (
            <div className="space-y-2">
              {studentHistory.records.map((rec) => (
                <div
                  key={rec._id}
                  className="p-3 rounded-xl border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-gray-100">
                        {typeof rec.sessionId === 'object'
                          ? (rec.sessionId as any)?.title
                          : 'Subject Lecture Attendance'}
                      </div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-2 flex-wrap">
                        <span>{new Date(rec.scannedAt).toLocaleString()}</span>
                        <span>•</span>
                        <span>Distance: {Math.round(rec.distanceFromCenter)}m away</span>
                        {rec.latitude && rec.longitude && (
                          <span className="font-mono text-gray-500">
                            ({rec.latitude.toFixed(4)}, {rec.longitude.toFixed(4)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {rec.latitude && rec.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${rec.latitude},${rec.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-1 rounded-lg font-semibold"
                      >
                        <MapPin className="w-3 h-3 text-blue-500" />
                        <span>GPS Pin</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    <Badge variant="emerald">Verified Present (+5 pts)</Badge>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </Card>

      {/* Modal: Start Dynamic Attendance Session for Subject (Faculty) */}
      <Modal
        isOpen={isStartSessionOpen}
        onClose={() => setIsStartSessionOpen(false)}
        title={`🚀 Launch Dynamic Attendance for ${subject.name}`}
        description="Generates a 10-second rotating cryptographic QR code with real-time GPS geolocation verification."
        maxWidth="md"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <Input
            label="Lecture Title / Topic"
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
                className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-gray-800 dark:text-gray-200 font-medium"
              >
                <option value={100}>100 meters (Classroom / Lab)</option>
                <option value={250}>250 meters (Department / Floor)</option>
                <option value={500}>500 meters (Campus Building / Wi-Fi Offset ⭐)</option>
                <option value={1000}>1000 meters (1 km - Campus Wide / Testing)</option>
                <option value={2000}>2000 meters (2 km - Extended Perimeter)</option>
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

          {/* GPS Location Status */}
          <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
            <div className="flex items-center gap-2">
              <Navigation className={`w-4 h-4 ${locatingFaculty ? 'animate-spin' : ''}`} />
              <div>
                <div className="font-bold">
                  {facultyCoords ? '📍 Classroom GPS Coordinates Locked' : 'Locating classroom GPS...'}
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
            <Button type="button" variant="outline" onClick={() => setIsStartSessionOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creatingSession || !facultyCoords}
              leftIcon={<QrCode className="w-4 h-4" />}
            >
              {creatingSession ? 'Starting Session...' : 'Start 5-Min QR Session'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Live Dynamic QR Display & Live Roster */}
      {activeQrSession && (
        <DynamicQrAttendanceModal
          isOpen={Boolean(activeQrSession)}
          onClose={() => {
            setActiveQrSession(null);
            fetchData();
          }}
          session={activeQrSession}
        />
      )}

      {/* Modal: Student QR Scanner & Geolocation Submit */}
      <StudentAttendanceScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSuccess={() => {
          setIsScannerOpen(false);
          fetchData();
        }}
      />
    </div>
  );
};
