import React, { useState, useEffect, useRef } from 'react';
import { attendanceApi } from '../../api/attendance.api';
import { AttendanceSession, AttendanceRecord, LiveTokenResponse } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { useToast } from '../../context/ToastContext';
import { useSocket } from '../../context/SocketContext';
import {
  QrCode,
  MapPin,
  Clock,
  ShieldCheck,
  Users,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  CameraOff,
} from 'lucide-react';

interface DynamicQrAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: AttendanceSession;
}

export const DynamicQrAttendanceModal: React.FC<DynamicQrAttendanceModalProps> = ({
  isOpen,
  onClose,
  session,
}) => {
  const [tokenData, setTokenData] = useState<LiveTokenResponse | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [outOfRangeCount, setOutOfRangeCount] = useState(0);
  const [totalEnrolled, setTotalEnrolled] = useState(0);
  const [loading, setLoading] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState(300);
  const [tokenRotationCounter, setTokenRotationCounter] = useState(10);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { success, error, info } = useToast();
  const { socket } = useSocket();

  // Fetch live rotating token from server
  const fetchRotatingToken = async () => {
    try {
      const res = await attendanceApi.getLiveToken(session._id);
      if (res.success) {
        setTokenData(res.data);
        setSecondsRemaining(res.data.timeRemainingSeconds);
        setTokenRotationCounter(10);
      }
    } catch (err: any) {
      console.warn('Token fetch error:', err);
    }
  };

  // Fetch session details & attendee list
  const fetchSessionDetails = async () => {
    try {
      const res = await attendanceApi.getSessionDetails(session._id);
      if (res.success) {
        setRecords(res.data.records);
        setVerifiedCount(res.data.verifiedPresentCount);
        setOutOfRangeCount(res.data.outOfRangeCount);
        setTotalEnrolled(res.data.totalEnrolledStudents);
      }
    } catch (err: any) {
      console.warn('Session details fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    fetchRotatingToken();
    fetchSessionDetails();

    // Rotate token every 10 seconds
    const tokenInterval = setInterval(() => {
      fetchRotatingToken();
    }, 10000);

    // 1-second countdown clock & token countdown
    const secondTimer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
      setTokenRotationCounter((prev) => (prev > 1 ? prev - 1 : 10));
    }, 1000);

    return () => {
      clearInterval(tokenInterval);
      clearInterval(secondTimer);
    };
  }, [isOpen, session._id]);

  // Real-time WebSocket listener for new attendee check-ins
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleRecordCreated = (newRecord: AttendanceRecord) => {
      if (
        typeof newRecord.sessionId === 'string'
          ? newRecord.sessionId === session._id
          : newRecord.sessionId?._id === session._id
      ) {
        setRecords((prev) => {
          if (prev.some((r) => r._id === newRecord._id)) return prev;
          return [newRecord, ...prev];
        });

        if (newRecord.verificationStatus === 'PRESENT') {
          setVerifiedCount((c) => c + 1);
          info(
            `📍 Attendance Recorded!`,
            `${newRecord.studentId?.name || 'Student'} (${Math.round(newRecord.distanceFromCenter)}m away)`
          );
        } else {
          setOutOfRangeCount((c) => c + 1);
        }
      }
    };

    socket.on('attendance:record-created', handleRecordCreated);

    return () => {
      socket.off('attendance:record-created', handleRecordCreated);
    };
  }, [socket, isOpen, session._id]);

  // Render QR Code on canvas with Anti-Screenshot dynamic optical watermark
  useEffect(() => {
    if (!tokenData?.token || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw QR payload
    const qrPayload = JSON.stringify({
      sessionId: session._id,
      token: tokenData.token,
      title: session.title,
      ts: Date.now(),
    });

    // Use quick QR code generator URL to render image into canvas
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
      qrPayload
    )}&margin=10`;

    qrImg.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(qrImg, 0, 0, 320, 320);

      // Anti-Screenshot Optical Watermark Guard Layer
      ctx.fillStyle = 'rgba(79, 70, 229, 0.12)';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`LIVE DYNAMIC NONCE: ${tokenData.token}`, 20, 20);
      ctx.fillText(`ROTATING TOKEN • DO NOT FORWARD`, 20, 305);

      // Center security seal
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.arc(160, 160, 22, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#4F46E5';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#4F46E5';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LIVE', 160, 164);
    };
  }, [tokenData?.token]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleExportCSV = () => {
    if (records.length === 0) {
      error('No Records', 'No student attendance records to export yet.');
      return;
    }

    const headers = ['Student Name', 'Student ID', 'Email', 'Time', 'Distance (m)', 'Status', 'Points Awarded'];
    const rows = records.map((r) => [
      `"${r.studentId?.name || 'N/A'}"`,
      `"${r.studentId?.studentId || 'N/A'}"`,
      `"${r.studentId?.email || 'N/A'}"`,
      `"${new Date(r.scannedAt).toLocaleTimeString()}"`,
      r.distanceFromCenter,
      r.verificationStatus,
      r.pointsAwarded,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_${session.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Exported!', 'Attendance CSV downloaded.');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📍 Live Dynamic QR Attendance (Anti-Proxy Verified)"
      description="Students must scan the rotating QR code with active mobile GPS within the classroom radius."
      maxWidth="3xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Dynamic QR & Anti-Proxy Guard */}
        <div className="lg:col-span-5 flex flex-col items-center justify-between p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Session Active
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-amber-300">
              <Clock className="w-3.5 h-3.5" />
              {formatSeconds(secondsRemaining)}
            </div>
          </div>

          {/* QR Canvas with Screen-Capture Guard */}
          <div className="relative group p-3 rounded-2xl bg-white shadow-2xl overflow-hidden border-4 border-indigo-500/50">
            <canvas ref={canvasRef} width={320} height={320} className="w-[260px] h-[260px] rounded-xl block" />

            {/* Anti-Screen Photo Overlay Watermark */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 text-[9px] font-mono text-indigo-900/40 select-none">
              <div className="flex justify-between">
                <span>GEO-LOCK: {session.allowedRadiusMeters}m</span>
                <span>TOKEN: {tokenData?.token}</span>
              </div>
              <div className="text-center font-bold tracking-widest text-[10px] text-indigo-900/30">
                ROTATING EVERY 10S • LIVE ATTENDANCE
              </div>
              <div className="flex justify-between">
                <span>{new Date().toLocaleTimeString()}</span>
                <span>SEC-VERIFIED ✅</span>
              </div>
            </div>
          </div>

          {/* Token Rotation Indicator */}
          <div className="w-full space-y-2 text-center">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                Token Rotates In:
              </span>
              <span className="font-mono font-bold text-indigo-400">{tokenRotationCounter}s</span>
            </div>

            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full transition-all duration-1000"
                style={{ width: `${(tokenRotationCounter / 10) * 100}%` }}
              ></div>
            </div>

            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Forwarded screenshots expire within 10 seconds.
            </p>
          </div>

          <div className="w-full pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Radius: <strong>{session.allowedRadiusMeters}m</strong></span>
            <span>GPS: <strong>{session.centerLatitude.toFixed(4)}, {session.centerLongitude.toFixed(4)}</strong></span>
          </div>
        </div>

        {/* Right Col: Live Attendance Feed & Stats */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-center">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {verifiedCount}
              </div>
              <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Verified Present
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-center">
              <div className="text-2xl font-black text-red-600 dark:text-red-400">
                {outOfRangeCount}
              </div>
              <div className="text-xs font-semibold text-red-800 dark:text-red-300">
                Out of Range
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-center">
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {totalEnrolled > 0 ? Math.round((verifiedCount / totalEnrolled) * 100) : 0}%
              </div>
              <div className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                Turnout Rate
              </div>
            </div>
          </div>

          {/* Attendee Live Stream */}
          <div className="space-y-2 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-500" />
                Live Scanned Attendees ({records.length})
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportCSV}
                leftIcon={<Download className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Export CSV
              </Button>
            </div>

            <div className="flex-1 max-h-[300px] overflow-y-auto space-y-2 pr-1 rounded-2xl border border-gray-100 dark:border-slate-800 p-2 bg-gray-50/50 dark:bg-slate-900/50">
              {records.length === 0 ? (
                <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <QrCode className="w-8 h-8 opacity-40 animate-pulse text-indigo-500" />
                  <p className="text-xs">Waiting for students to scan QR code...</p>
                </div>
              ) : (
                records.map((rec) => {
                  const isPresent = rec.verificationStatus === 'PRESENT';
                  return (
                    <div
                      key={rec._id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                        isPresent
                          ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/60 shadow-sm'
                          : 'bg-red-50/60 dark:bg-red-950/40 border-red-200 dark:border-red-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          src={rec.studentId?.avatar}
                          name={rec.studentId?.name || 'Student'}
                          size="sm"
                        />
                        <div>
                          <div className="font-bold text-xs text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                            {rec.studentId?.name}
                            {rec.studentId?.studentId && (
                              <span className="text-[10px] font-normal text-gray-500 font-mono">
                                ({rec.studentId.studentId})
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400 flex items-center gap-2">
                            <span>{new Date(rec.scannedAt).toLocaleTimeString()}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 text-indigo-500" />
                              {Math.round(rec.distanceFromCenter)}m away
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {isPresent ? (
                          <Badge variant="emerald" className="text-[10px] font-bold">
                            ✅ Verified
                          </Badge>
                        ) : (
                          <Badge variant="red" className="text-[10px] font-bold">
                            ⚠️ Out of Range ({Math.round(rec.distanceFromCenter)}m)
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-end">
            <Button onClick={onClose}>Close Attendance Dashboard</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
