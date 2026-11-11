import React, { useState } from 'react';
import { Award, Plus, Trash2, Edit2, Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import { Prize, WinnerRecord } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface PrizeManagerProps {
  prizes: Prize[];
  onUpdatePrizes: (prizes: Prize[]) => void;
  onResetDefault: () => void;
  winners: WinnerRecord[];
}

const COLOR_OPTIONS = [
  { label: '賽博青', value: '#06B6D4' },
  { label: '霓虹金', value: '#F59E0B' },
  { label: '量子藍', value: '#3B82F6' },
  { label: '激光粉', value: '#EC4899' },
  { label: '離子紫', value: '#8B5CF6' },
  { label: '核光綠', value: '#10B981' },
  { label: '赤紅光', value: '#EF4444' },
];

export const PrizeManager: React.FC<PrizeManagerProps> = ({
  prizes,
  onUpdatePrizes,
  onResetDefault,
  winners,
}) => {
  // Add form states
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [quota, setQuota] = useState<number>(1);
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editQuota, setEditQuota] = useState<number>(1);
  const [editColor, setEditColor] = useState('');

  // Custom Confirm Modal state (bypasses iframe restrictions)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    type?: 'danger' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Handle Add
  const handleAddPrize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatusMessage({ type: 'error', text: '請填寫獎項名稱！' });
      return;
    }
    if (!content.trim()) {
      setStatusMessage({ type: 'error', text: '請填寫獎品內容！' });
      return;
    }
    if (quota <= 0) {
      setStatusMessage({ type: 'error', text: '名額必須大於 0！' });
      return;
    }

    const newPrize: Prize = {
      id: `prize-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: name.trim(),
      content: content.trim(),
      quota: Number(quota),
      color: color,
      batchSize: 1,
    };

    onUpdatePrizes([...prizes, newPrize]);
    setName('');
    setContent('');
    setQuota(1);
    setStatusMessage({ type: 'success', text: `成功新增獎項「${newPrize.name}」！` });
  };

  // Start Edit
  const handleStartEdit = (p: Prize) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditContent(p.content);
    setEditQuota(p.quota);
    setEditColor(p.color || '#06B6D4');
  };

  // Save Edit
  const handleSaveEdit = (id: string) => {
    if (!editName.trim() || !editContent.trim()) {
      setStatusMessage({ type: 'error', text: '獎項名稱與獎品內容不可為空！' });
      return;
    }
    if (editQuota <= 0) {
      setStatusMessage({ type: 'error', text: '名額必須大於 0！' });
      return;
    }

    const updated = prizes.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          name: editName.trim(),
          content: editContent.trim(),
          quota: Number(editQuota),
          color: editColor,
        };
      }
      return p;
    });

    onUpdatePrizes(updated);
    setEditingId(null);
    setStatusMessage({ type: 'success', text: '已儲存獎項變更！' });
  };

  // Delete Prize with ConfirmModal
  const handleDelete = (id: string) => {
    const p = prizes.find((item) => item.id === id);
    if (!p) return;

    const drawnCount = winners.filter((w) => w.prizeId === id).length;
    const msg = drawnCount > 0
      ? `⚠️ 警告：該獎項已有 ${drawnCount} 位中獎者，刪除將保留中獎清冊但無法繼續抽取此獎，確定刪除「${p.name}」嗎？`
      : `確定要刪除獎項「${p.name}」嗎？`;

    setConfirmDialog({
      isOpen: true,
      title: '確認刪除獎項',
      message: msg,
      confirmText: '確定刪除',
      type: 'danger',
      onConfirm: () => {
        onUpdatePrizes(prizes.filter((item) => item.id !== id));
        setStatusMessage({ type: 'success', text: `已刪除獎項：${p.name}` });
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Reset default prizes with ConfirmModal
  const handleResetDefaultConfirm = () => {
    setConfirmDialog({
      isOpen: true,
      title: '恢復預設獎項',
      message: '確定要將獎項恢復為預設範例（特等獎、頭獎等）嗎？\n自訂獎項將被重置。',
      confirmText: '確認恢復',
      type: 'warning',
      onConfirm: () => {
        onResetDefault();
        setStatusMessage({ type: 'success', text: '已恢復為預設獎項設定！' });
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <div id="prize-manager-section" className="w-full max-w-5xl mx-auto py-4 px-4">
      {/* Header Banner - Cyber Blue Theme */}
      <div className="bg-[#09153a]/90 rounded-2xl p-6 border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.15)] mb-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cyan-500/20">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-cyan-400" />
              獎項及內容設定 (科技獎池)
            </h2>
            <p className="text-sm text-cyan-200/70 mt-1">
              可自行新增、修改各獎項名稱（如特等獎、頭獎）、獎品細項與中獎名額數量。
            </p>
          </div>

          <button
            id="btn-reset-default-prizes"
            onClick={handleResetDefaultConfirm}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            重設預設獎項
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-xl text-sm font-medium flex items-center justify-between ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-xs underline opacity-70 hover:opacity-100 cursor-pointer">
              關閉
            </button>
          </div>
        )}

        {/* Add Prize Form */}
        <form onSubmit={handleAddPrize} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-5">
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-cyan-300 mb-1">
              獎項名稱 <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="如: 特等獎 / 總裁特別獎"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0c1a47] border border-cyan-500/30 text-white placeholder-slate-400 text-sm focus:outline-hidden focus:border-cyan-400"
              required
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-bold text-cyan-300 mb-1">
              獎品內容說明 <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="如: iPhone 16 Pro 256GB / 現金兩萬元"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0c1a47] border border-cyan-500/30 text-white placeholder-slate-400 text-sm focus:outline-hidden focus:border-cyan-400"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-cyan-300 mb-1">名額數量</label>
            <input
              type="number"
              min="1"
              max="999"
              value={quota}
              onChange={(e) => setQuota(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 rounded-xl bg-[#0c1a47] border border-cyan-500/30 text-white text-sm font-bold focus:outline-hidden focus:border-cyan-400"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-xs font-bold text-cyan-300 mb-1">標籤色彩</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 rounded-xl bg-[#0c1a47] border border-cyan-500/30 p-1 cursor-pointer"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)] transition active:scale-98 cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" />
              新增獎項
            </button>
          </div>
        </form>
      </div>

      {/* Prize Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prizes.map((p, index) => {
          const isEditing = editingId === p.id;
          const drawnCount = winners.filter((w) => w.prizeId === p.id).length;
          const leftQuota = Math.max(0, p.quota - drawnCount);

          return (
            <div
              key={p.id}
              className="bg-[#09153a]/90 rounded-2xl p-5 border shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all flex flex-col justify-between text-white"
              style={{ borderColor: p.color || '#06B6D4' }}
            >
              {isEditing ? (
                /* Edit Mode */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300">編輯獎項 #{index + 1}</span>
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="w-8 h-8 rounded-lg bg-[#0c1a47] border border-cyan-500/30 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-cyan-300 font-semibold">獎項名稱</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0c1a47] border border-cyan-500/30 text-white text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-cyan-300 font-semibold">獎品內容</label>
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0c1a47] border border-cyan-500/30 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-cyan-300 font-semibold">名額數量</label>
                    <input
                      type="number"
                      min="1"
                      value={editQuota}
                      onChange={(e) => setEditQuota(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 px-2.5 py-1.5 rounded-lg bg-[#0c1a47] border border-cyan-500/30 text-white text-sm font-bold"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-cyan-500/20">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleSaveEdit(p.id)}
                      className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-black shadow-[0_0_10px_rgba(6,182,212,0.4)] cursor-pointer"
                    >
                      儲存變更
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal View */
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-black text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                        style={{ backgroundColor: p.color || '#06B6D4' }}
                      >
                        {p.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(p)}
                        className="p-1.5 rounded-lg text-cyan-300 hover:text-white hover:bg-cyan-500/20 transition cursor-pointer"
                        title="編輯"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
                        title="刪除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-base font-bold text-slate-100 my-2">
                    🎁 {p.content}
                  </p>

                  {/* Quota Progress */}
                  <div className="mt-4 pt-3 border-t border-cyan-500/20">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                      <span>已抽 {drawnCount} 人</span>
                      <span>
                        剩餘{' '}
                        <strong className={leftQuota > 0 ? 'text-amber-400' : 'text-slate-500'}>
                          {leftQuota}
                        </strong>{' '}
                        / {p.quota} 名額
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-cyan-500/20">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: p.color || '#06B6D4',
                          width: `${Math.min(100, (drawnCount / p.quota) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom Confirm Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
