import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, RotateCcw, X, Check } from 'lucide-react';

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

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = '確定',
  cancelText = '取消',
  type = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="custom-confirm-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#030717]/80 backdrop-blur-sm p-4 select-none"
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md bg-[#09153a] rounded-2xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-cyan-500/40 text-white overflow-hidden"
        >
          {/* Ambient Glow */}
          <div
            className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
              type === 'danger' ? 'bg-rose-500/20' : 'bg-cyan-500/20'
            }`}
          />

          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                type === 'danger'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              }`}
            >
              {type === 'danger' ? (
                <Trash2 className="w-6 h-6 text-rose-400" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-black text-white">{title}</h3>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed whitespace-pre-line">
                {message}
              </p>
            </div>

            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-cyan-500/20">
            <button
              id="confirm-modal-cancel-btn"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              id="confirm-modal-confirm-btn"
              onClick={onConfirm}
              className={`px-5 py-2 rounded-xl text-white text-sm font-black transition shadow-lg cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                type === 'danger'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-900/40'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-cyan-900/40'
              }`}
            >
              {type === 'danger' ? <Trash2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
