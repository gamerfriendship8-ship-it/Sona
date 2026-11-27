import { Phone, MessageSquare, ShieldAlert } from 'lucide-react';
import type { PendingPermissionAction } from '../types/sona';

interface PermissionConfirmModalProps {
  action: PendingPermissionAction | null;
  assistantName: string;
  bossName: string;
  onApprove: () => void;
  onCancel: () => void;
}

export function PermissionConfirmModal({
  action,
  assistantName,
  bossName,
  onApprove,
  onCancel,
}: PermissionConfirmModalProps) {
  if (!action) return null;

  const isCall = action.type === 'make_call';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="permission-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#E5D4F3] dark:border-[#3B215E] bg-[#FFFFFF] dark:bg-[#190B2E] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FDF2F8] dark:bg-[#2B124C] flex items-center justify-center text-[#DB2777] dark:text-[#F472B6] shrink-0">
            {isCall ? (
              <Phone className="w-5 h-5" aria-hidden="true" />
            ) : (
              <MessageSquare className="w-5 h-5" aria-hidden="true" />
            )}
          </div>
          <div>
            <h2
              id="permission-dialog-title"
              className="text-base font-semibold text-[#1D1029] dark:text-[#FAF5FF]"
            >
              {isCall ? 'Confirm Phone Call' : 'Confirm SMS Message'}
            </h2>
            <p className="text-xs text-[#6B5482] dark:text-[#C8B5DF]">
              Privacy-first permission check for {bossName}
            </p>
          </div>
        </div>

        <div className="rounded-xl p-4 bg-[#FCF7FF] dark:bg-[#10071D] border border-[#E5D4F3] dark:border-[#3B215E] space-y-1.5 text-sm text-[#1D1029] dark:text-[#FAF5FF]">
          <div>
            <span className="text-xs text-[#6B5482] dark:text-[#C8B5DF]">
              {isCall ? 'Recipient / Number:' : 'SMS Recipient:'}
            </span>{' '}
            <span className="font-semibold">{action.target}</span>
          </div>
          {!isCall && action.messageBody && (
            <div>
              <span className="text-xs text-[#6B5482] dark:text-[#C8B5DF]">
                Message:
              </span>{' '}
              <span>“{action.messageBody}”</span>
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 text-xs text-[#6B5482] dark:text-[#C8B5DF]">
          <ShieldAlert className="w-4 h-4 text-[#9333EA] dark:text-[#C084FC] shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            {assistantName} never dials calls or sends SMS silently. Approving
            opens your device {isCall ? 'Phone Dialer' : 'Messages app'} safely.
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E5D4F3] dark:border-[#3B215E] text-sm font-medium text-[#1D1029] dark:text-[#FAF5FF] hover:border-[#DB2777]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApprove}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-gradient-to-r from-[#DB2777] to-[#9333EA] hover:from-[#BE185D] hover:to-[#7E22CE] text-white text-sm font-medium transition-colors"
          >
            {isCall ? 'Allow & Dial' : 'Allow & Open SMS'}
          </button>
        </div>
      </div>
    </div>
  );
}
