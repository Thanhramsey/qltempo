import React from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessageProps {
  toast: { type: ToastType; message: string } | null;
  onClose: () => void;
}

export default function ToastMessage({ toast, onClose }: ToastMessageProps) {
  if (!toast) return null;

  const configByType: Record<ToastType, { box: string; Icon: typeof Info }> = {
    success: {
      box: 'bg-emerald-50/95 border-emerald-200 text-emerald-800',
      Icon: CheckCircle2,
    },
    error: {
      box: 'bg-rose-50/95 border-rose-200 text-rose-800',
      Icon: AlertCircle,
    },
    info: {
      box: 'bg-indigo-50/95 border-indigo-200 text-indigo-800',
      Icon: Info,
    },
    warning: {
      box: 'bg-amber-50/95 border-amber-200 text-amber-800',
      Icon: TriangleAlert,
    },
  };

  const { box, Icon } = configByType[toast.type];

  return (
    <div className="print:hidden fixed top-5 right-5 z-50">
      <div
        className={`min-w-[320px] max-w-[460px] rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm flex items-start gap-2 ${box}`}
        role="status"
        aria-live="polite"
      >
        <Icon size={18} className="mt-0.5 shrink-0" />
        <div className="text-sm font-semibold leading-5">{toast.message}</div>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto p-1 rounded-md hover:bg-black/5 cursor-pointer"
          aria-label="Đóng thông báo"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
