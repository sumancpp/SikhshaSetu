import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '../context/ToastContext';

export interface ExamIntegrityOptions {
  enabled?: boolean;
  maxViolations?: number;
  onMaxViolationsExceeded?: () => void;
  preventCopyPaste?: boolean;
  detectTabSwitch?: boolean;
  preventShortcuts?: boolean;
  examName?: string;
}

export function useExamIntegrityGuard({
  enabled = true,
  maxViolations = 3,
  onMaxViolationsExceeded,
  preventCopyPaste = true,
  detectTabSwitch = true,
  preventShortcuts = true,
  examName = 'Assessment',
}: ExamIntegrityOptions = {}) {
  const { error, info } = useToast();
  const [violationsCount, setViolationsCount] = useState(0);
  const [lastViolationType, setLastViolationType] = useState<string | null>(null);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const hasExceededRef = useRef(false);

  const registerViolation = useCallback(
    (reason: string, details: string) => {
      if (!enabled) return;

      setViolationsCount((prev) => {
        const newCount = prev + 1;
        setLastViolationType(reason);
        setIsWarningModalOpen(true);

        error(
          `⚠️ Integrity Notice (${newCount}/${maxViolations})`,
          `${details}. All suspicious actions are recorded for faculty review.`
        );

        if (newCount >= maxViolations && !hasExceededRef.current) {
          hasExceededRef.current = true;
          if (onMaxViolationsExceeded) {
            onMaxViolationsExceeded();
          }
        }

        return newCount;
      });
    },
    [enabled, maxViolations, onMaxViolationsExceeded, error]
  );

  useEffect(() => {
    if (!enabled) return;

    // 1. Intercept Copy / Cut / Paste & Right-Click Context Menu
    const handleCopy = (e: ClipboardEvent) => {
      if (preventCopyPaste) {
        e.preventDefault();
        registerViolation('COPY_ATTEMPT', 'Copying question content is disabled during exams');
      }
    };

    const handleCut = (e: ClipboardEvent) => {
      if (preventCopyPaste) {
        e.preventDefault();
        registerViolation('CUT_ATTEMPT', 'Cutting content is disabled in proctored mode');
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (preventCopyPaste) {
        e.preventDefault();
        registerViolation('PASTE_ATTEMPT', 'Pasting external text is restricted during exams');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (preventCopyPaste) {
        e.preventDefault();
        registerViolation('RIGHT_CLICK', 'Right-click context menu is disabled in proctored mode');
      }
    };

    // 2. Intercept DevTools & Inspection Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!preventShortcuts) return;

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // F12 or Ctrl+Shift+I / Ctrl+Shift+J (DevTools)
      if (
        e.key === 'F12' ||
        (isCtrlOrMeta && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
      ) {
        e.preventDefault();
        registerViolation('DEVTOOLS_INSPECT', 'Opening Developer Tools is prohibited during live evaluation');
        return;
      }

      // Ctrl+U (View Source), Ctrl+S (Save page)
      if (isCtrlOrMeta && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        registerViolation('SOURCE_INSPECT', 'Viewing source code is disabled during exams');
        return;
      }

      // Ctrl+C / Ctrl+V / Ctrl+X if preventCopyPaste is active
      if (preventCopyPaste && isCtrlOrMeta && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V' || e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        registerViolation('SHORTCUT_CLIPBOARD', 'Clipboard keyboard shortcuts are disabled during exams');
      }
    };

    // 3. Tab Switching & Window Focus Loss Detection
    const handleVisibilityChange = () => {
      if (detectTabSwitch && document.hidden) {
        registerViolation('TAB_SWITCH', `Tab switch detected! You navigated away from the ${examName}`);
      }
    };

    const handleWindowBlur = () => {
      if (detectTabSwitch && !document.hidden) {
        registerViolation('WINDOW_BLUR', 'Exam window lost focus. Please remain in full screen.');
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [enabled, preventCopyPaste, detectTabSwitch, preventShortcuts, examName, registerViolation]);

  return {
    violationsCount,
    lastViolationType,
    isWarningModalOpen,
    dismissWarning: () => setIsWarningModalOpen(false),
    resetViolations: () => {
      setViolationsCount(0);
      hasExceededRef.current = false;
      setIsWarningModalOpen(false);
    },
    isIntegrityLocked: violationsCount >= maxViolations,
  };
}
