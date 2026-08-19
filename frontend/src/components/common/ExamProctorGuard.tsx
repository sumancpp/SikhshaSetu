import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Eye, Lock, Copy } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';

interface ExamProctorGuardProps {
  violationsCount: number;
  maxViolations?: number;
  isWarningModalOpen: boolean;
  onDismissWarning: () => void;
  lastViolationType?: string | null;
  examTitle?: string;
}

export const ExamProctorGuard: React.FC<ExamProctorGuardProps> = ({
  violationsCount,
  maxViolations = 3,
  isWarningModalOpen,
  onDismissWarning,
  lastViolationType,
  examTitle = 'Evaluation',
}) => {
  const getViolationTitle = (type?: string | null) => {
    switch (type) {
      case 'TAB_SWITCH':
        return 'Tab Switch Detected';
      case 'WINDOW_BLUR':
        return 'Window Focus Lost';
      case 'COPY_ATTEMPT':
        return 'Copy Action Intercepted';
      case 'PASTE_ATTEMPT':
        return 'Paste Action Blocked';
      case 'DEVTOOLS_INSPECT':
        return 'DevTools Shortcut Blocked';
      case 'RIGHT_CLICK':
        return 'Context Menu Prohibited';
      default:
        return 'Academic Integrity Warning';
    }
  };

  return (
    <>
      {/* Visual Integrity Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl text-xs text-slate-300 select-none shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-bold text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>AI Proctoring Shield: ACTIVE</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
            <Lock className="w-3 h-3 text-purple-400" />
            Copy/Paste Disabled
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
            <Eye className="w-3 h-3 text-blue-400" />
            Tab Monitor On
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={violationsCount === 0 ? 'emerald' : violationsCount >= maxViolations - 1 ? 'red' : 'amber'}
            className="text-[10px] font-bold"
          >
            {violationsCount === 0
              ? '🟢 Clean Standing'
              : `⚠️ Warning ${violationsCount}/${maxViolations}`}
          </Badge>
        </div>
      </div>

      {/* Warning Modal */}
      {isWarningModalOpen && (
        <Modal
          isOpen={true}
          onClose={onDismissWarning}
          title="⚠️ Academic Integrity Notice"
        >
          <div className="space-y-4 text-center p-2">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8 animate-bounce" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {getViolationTitle(lastViolationType)}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">
                You performed an action restricted by the exam proctoring policy for <strong>{examTitle}</strong>.
              </p>
            </div>

            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-700 dark:text-red-300 font-semibold space-y-1">
              <div>
                Recorded Strikes: <span className="font-black text-sm">{violationsCount}</span> of {maxViolations} permitted
              </div>
              <p className="text-[11px] text-gray-500 font-normal">
                {violationsCount >= maxViolations
                  ? 'Exceeding limit will automatically lock this session and submit current answers.'
                  : `You have ${maxViolations - violationsCount} remaining warning(s) before automatic submission.`}
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={onDismissWarning}
                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold py-2.5"
              >
                I Understand &amp; Resume Assessment
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
