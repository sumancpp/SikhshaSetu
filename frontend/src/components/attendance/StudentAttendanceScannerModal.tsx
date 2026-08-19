import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
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
  Keyboard,
  Sparkles,
  CameraOff,
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
  const [activeMode, setActiveMode] = useState<'CAMERA' | 'MANUAL'>('CAMERA');
  const [tokenInput, setTokenInput] = useState('');
  const [sessionIdInput, setSessionIdInput] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'IDLE' | 'LOCATING' | 'ACQUIRED' | 'ERROR'>('IDLE');
  const [locationError, setLocationError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verifiedRecord, setVerifiedRecord] = useState<AttendanceRecord | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const coordsRef = useRef<{ latitude: number; longitude: number; accuracy: number } | null>(null);

  const { success, error, info } = useToast();

  // Keep coordsRef in sync with coords state
  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  // Acquire high accuracy GPS location
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
        const newCoords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setCoords(newCoords);
        coordsRef.current = newCoords;
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

  // Submit attendance logic
  const submitWithData = async (sessionId: string, token: string) => {
    const currentCoords = coordsRef.current;
    if (!currentCoords) {
      error('GPS Required', 'Waiting for mobile GPS location lock. Please allow location access.');
      acquireLocation();
      return;
    }

    setSubmitting(true);
    try {
      const res = await attendanceApi.submitAttendance({
        sessionId,
        token,
        latitude: currentCoords.latitude,
        longitude: currentCoords.longitude,
        accuracyMeters: currentCoords.accuracy,
        deviceFingerprint: navigator.userAgent,
      });

      if (res.success) {
        setVerifiedRecord(res.data);
        triggerConfetti();
        stopScanner();
        success('Verified In-Class! 🎉', `Attendance recorded (${Math.round(res.data.distanceFromCenter)}m away). +5 points!`);
        if (onSuccess) onSuccess(res.data);
      }
    } catch (err: any) {
      error('Attendance Verification Failed', err.response?.data?.message || err.message || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Start live HTML5 QR Camera Scanner
  const startScanner = async () => {
    try {
      setCameraError('');
      const readerElement = document.getElementById('qr-camera-reader');
      if (!readerElement) return;

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-camera-reader');
      }

      if (isScanningRef.current) {
        return;
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Detected a QR code!
          try {
            let parsedSessionId = '';
            let parsedToken = '';

            if (decodedText.startsWith('{') && decodedText.endsWith('}')) {
              const payload = JSON.parse(decodedText);
              parsedSessionId = payload.sessionId;
              parsedToken = payload.token;
            } else {
              parsedToken = decodedText.trim();
            }

            if (parsedSessionId && parsedToken) {
              submitWithData(parsedSessionId, parsedToken);
            }
          } catch (e) {
            // Ignore non-JSON QR
          }
        },
        () => {
          // Ignore scanning frame errors
        }
      );

      isScanningRef.current = true;
      setCameraActive(true);
    } catch (err: any) {
      setCameraError(err.message || 'Camera permission denied or camera not found.');
      setCameraActive(false);
    }
  };

  // Stop camera
  const stopScanner = () => {
    if (html5QrCodeRef.current && isScanningRef.current) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          isScanningRef.current = false;
          setCameraActive(false);
        })
        .catch(() => {
          isScanningRef.current = false;
          setCameraActive(false);
        });
    }
  };

  useEffect(() => {
    if (isOpen) {
      setVerifiedRecord(null);
      setTokenInput('');
      setSessionIdInput('');
      setCameraError('');
      acquireLocation();

      if (activeMode === 'CAMERA') {
        const timer = setTimeout(() => {
          startScanner();
        }, 400);
        return () => clearTimeout(timer);
      }
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, activeMode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let sId = sessionIdInput.trim();
    let tok = tokenInput.trim();

    if (tokenInput.startsWith('{') && tokenInput.endsWith('}')) {
      try {
        const payload = JSON.parse(tokenInput);
        sId = payload.sessionId || sId;
        tok = payload.token || tok;
      } catch (err) {
        // Ignore
      }
    }

    if (!sId || !tok) {
      error('Missing Info', 'Please enter both Session ID and the live Security Token.');
      return;
    }

    submitWithData(sId, tok);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopScanner();
        onClose();
      }}
      title="📍 Live Attendance Check-In (GPS-Verified)"
      description="Point your mobile camera at the instructor's screen to automatically scan and verify your in-class attendance."
      maxWidth="md"
    >
      {verifiedRecord ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">
              Attendance Verified! 🎉
            </h3>
            <p className="text-xs text-gray-500">
              Your physical presence in the classroom was confirmed (
              {Math.round(verifiedRecord.distanceFromCenter)}m away from instructor).
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 inline-flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
            <Award className="w-4 h-4 text-amber-500" />
            +5 Academic Attendance Points Awarded
          </div>

          <div className="pt-4">
            <Button
              className="w-full"
              onClick={() => {
                stopScanner();
                onClose();
              }}
            >
              Done
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* GPS Location Status Bar */}
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
                    ? '🛰️ Mobile GPS Location Locked'
                    : locationStatus === 'LOCATING'
                    ? 'Acquiring high-precision device GPS...'
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

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-2">
            <button
              type="button"
              onClick={() => {
                setActiveMode('CAMERA');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeMode === 'CAMERA'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>📷 Live Camera Scanner</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopScanner();
                setActiveMode('MANUAL');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeMode === 'MANUAL'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>⌨️ Manual Code Entry</span>
            </button>
          </div>

          {/* Mode 1: Live Mobile Camera QR Scanner */}
          {activeMode === 'CAMERA' && (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-2xl bg-black border-2 border-indigo-500/50 aspect-square max-h-[300px] flex items-center justify-center mx-auto shadow-inner">
                {/* HTML5 QR Camera Container */}
                <div id="qr-camera-reader" className="w-full h-full object-cover"></div>

                {/* Viewfinder Target Box Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-dashed border-emerald-400 rounded-2xl relative animate-pulse">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-500 -mt-1 -ml-1"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-500 -mt-1 -mr-1"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-500 -mb-1 -ml-1"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-500 -mb-1 -mr-1"></div>
                  </div>
                </div>

                {submitting && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white space-y-2 z-20">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
                    <p className="text-xs font-bold">Verifying In-Class Coordinates...</p>
                  </div>
                )}
              </div>

              {cameraError ? (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <CameraOff className="w-4 h-4" />
                    Camera Access Failed
                  </div>
                  <p className="text-[11px]">
                    {cameraError}. You can switch to the <strong>"Manual Code Entry"</strong> tab above to type the live token shown on the screen.
                  </p>
                </div>
              ) : (
                <p className="text-center text-[11px] text-gray-500 dark:text-gray-400">
                  ⚡ Point camera at the live QR code on the teacher's screen. It will scan and check you in automatically!
                </p>
              )}
            </div>
          )}

          {/* Mode 2: Manual Code Entry Fallback */}
          {activeMode === 'MANUAL' && (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <Input
                label="Session ID (Displayed under teacher's QR)"
                placeholder="e.g. 66c3e1a0b..."
                value={sessionIdInput}
                onChange={(e) => setSessionIdInput(e.target.value)}
                required
              />

              <Input
                label="Live 16-Character Token (Rotates every 10s)"
                placeholder="e.g. a7b9e4f210c83d9a"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                required
              />

              <Button
                type="submit"
                disabled={submitting || locationStatus !== 'ACQUIRED'}
                className="w-full"
                leftIcon={<MapPin className="w-4 h-4" />}
              >
                {submitting ? 'Verifying GPS Coordinates...' : 'Verify & Submit Attendance'}
              </Button>
            </form>
          )}

          {/* Anti-Proxy Disclaimer */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-0.5">
            <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              Anti-Proxy Geolocation Protection
            </div>
            <p>
              Your current device location is verified against classroom perimeter. Submissions outside the room
              are automatically flagged as Out of Range.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};
