import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../../api/attendance.api';
import { AttendanceRecord } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { useToast } from '../../context/ToastContext';
import { triggerConfetti } from '../../utils/helpers';
import {
  QrCode,
  MapPin,
  ShieldCheck,
  Award,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Camera,
  Navigation,
} from 'lucide-react';

interface StudentAttendanceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (record: AttendanceRecord) => void;
}

export const StudentAttendanceScannerModal: React.FC<StudentAttendanceScannerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [sessionIdInput, setSessionIdInput] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'IDLE' | 'LOCATING' | 'ACQUIRED' | 'ERROR'>('IDLE');
  const [locationError, setLocationError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verifiedRecord, setVerifiedRecord] = useState<AttendanceRecord | null>(null);

  const { success, error } = useToast();

  // Acquire high accuracy GPS location upon modal open
  const acquireLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('ERROR');
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('LOCATING');
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocationStatus('ACQUIRED');
      },
      (err) => {
        setLocationStatus('ERROR');
        setLocationError(
          err.message || 'GPS location permission denied. Please allow location access in your browser settings.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    if (isOpen) {
      setVerifiedRecord(null);
      setTokenInput('');
      setSessionIdInput('');
      acquireLocation();
    }
  }, [isOpen]);

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!coords) {
      error('GPS Required', 'Please enable and allow GPS location on your device to verify in-class attendance.');
      acquireLocation();
      return;
    }

    let parsedSessionId = sessionIdInput.trim();
    let parsedToken = tokenInput.trim();

    // Check if user pasted a JSON QR payload
    if (tokenInput.startsWith('{') && tokenInput.endsWith('}')) {
      try {
        const payload = JSON.parse(tokenInput);
        parsedSessionId = payload.sessionId || parsedSessionId;
        parsedToken = payload.token || parsedToken;
      } catch (err) {
        // Ignore
      }
    }

    if (!parsedSessionId || !parsedToken) {
      error('Missing Information', 'Please provide the Session ID and the live rotating QR Token displayed on the screen.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await attendanceApi.submitAttendance({
        sessionId: parsedSessionId,
        token: parsedToken,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracyMeters: coords.accuracy,
        deviceFingerprint: navigator.userAgent,
      });

      if (res.success) {
        setVerifiedRecord(res.data);
        triggerConfetti();
        success('Verified In-Class!', 'Attendance recorded successfully (+5 points awarded)');
        if (onSuccess) onSuccess(res.data);
      }
    } catch (err: any) {
      error('Attendance Failed', err.response?.data?.message || err.message || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📍 Scan In-Class Attendance (GPS-Verified)"
      description="Scan the live rotating QR code displayed on the instructor's screen or enter the live security token."
      maxWidth="md"
    >
      {verifiedRecord ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">
              Attendance Verified!
            </h3>
            <p className="text-xs text-gray-500">
              Your location was confirmed within classroom proximity (
              {Math.round(verifiedRecord.distanceFromCenter)}m away).
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 inline-flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
            <Award className="w-4 h-4 text-amber-500" />
            +5 Academic Points Awarded
          </div>

          <div className="pt-4">
            <Button className="w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitAttendance} className="space-y-4">
          {/* GPS Location Status Card */}
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
              locationStatus === 'ACQUIRED'
                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                : locationStatus === 'LOCATING'
                ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-300'
                : 'bg-red-50/60 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Navigation
                className={`w-4 h-4 ${
                  locationStatus === 'LOCATING' ? 'animate-spin text-blue-500' : ''
                }`}
              />
              <div>
                <div className="font-bold">
                  {locationStatus === 'ACQUIRED'
                    ? '🛰️ Mobile GPS Location Active'
                    : locationStatus === 'LOCATING'
                    ? 'Locating your device GPS coordinates...'
                    : 'GPS Permission Required'}
                </div>
                {coords && (
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">
                    Accuracy: ±{Math.round(coords.accuracy)}m ({coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)})
                  </div>
                )}
                {locationError && <div className="text-[10px] text-red-600 font-semibold">{locationError}</div>}
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={acquireLocation}
              disabled={locationStatus === 'LOCATING'}
              className="text-[11px] h-7 px-2"
            >
              <RefreshCw className={`w-3 h-3 ${locationStatus === 'LOCATING' ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="space-y-3">
            <Input
              label="Session ID (from instructor screen)"
              placeholder="e.g. 66c3e1a0b..."
              value={sessionIdInput}
              onChange={(e) => setSessionIdInput(e.target.value)}
              required
            />

            <Input
              label="Live Security Token (Rotates every 10s on QR)"
              placeholder="Enter 16-char token or paste full QR data"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              required
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              Anti-Proxy Geolocation Protection
            </div>
            <p>
              Your current device location is verified against the classroom radius. Submitting from outside the
              classroom will be flagged and rejected.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || locationStatus !== 'ACQUIRED'}
              leftIcon={<MapPin className="w-4 h-4" />}
            >
              {submitting ? 'Verifying Coordinates...' : 'Verify & Submit Attendance'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
