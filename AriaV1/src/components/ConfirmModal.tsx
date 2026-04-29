import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-red-600',
          iconBg: 'bg-red-100',
          button: 'bg-red-600 hover:bg-red-700 shadow-red-200'
        };
      case 'info':
        return {
          icon: 'text-indigo-600',
          iconBg: 'bg-indigo-100',
          button: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
        };
      default:
        return {
          icon: 'text-amber-600',
          iconBg: 'bg-amber-100',
          button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex items-start space-x-4 mb-6">
            <div className={`p-3 ${colors.iconBg} rounded-2xl`}>
              {type === 'info' ? (
                <CheckCircle2 size={28} className={colors.icon} />
              ) : (
                <AlertCircle size={28} className={colors.icon} />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={onCancel}
              className="py-3 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`py-3 px-4 text-sm font-bold text-white rounded-xl transition-all shadow-lg ${colors.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

