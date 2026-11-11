import React, { useState, useRef } from 'react';
import { Upload, Download, Plus, Trash2, Edit2, Check, X, FileSpreadsheet, RefreshCw, Search, Users, AlertCircle } from 'lucide-react';
import { Participant } from '../types';
import { parseExcelParticipants, exportParticipantsTemplate, exportParticipantsToExcel } from '../utils/excel';
import { ConfirmModal } from './ConfirmModal';

interface ParticipantManagerProps {
  participants: Participant[];
  onUpdateParticipants: (participants: Participant[]) => void;
  onResetDefault: () => void;
  winnerIds: Set<string>;
}

export const ParticipantManager: React.FC<ParticipantManagerProps> = ({
  participants,
  onUpdateParticipants,
  onResetDefault,
  winnerIds,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states
  const [newSeq, setNewSeq] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newDept, setNewDept] = useState<string>('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSeq, setEditSeq] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editDept, setEditDept] = useState<string>('');

  // Batch paste modal
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchText, setBatchText] = useState('');

  // Search & message states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Custom Confirm Modal State (replaces iframe-blocked window.confirm)
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

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const parsed = await parseExcelParticipants(file);
      onUpdateParticipants(parsed);
      setStatusMessage({
        type: 'success',
        text: `成功從 Excel 匯入 ${parsed.length} 筆人員名單！`,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '讀取檔案失敗';
      setStatusMessage({
        type: 'error',
        text: errorMessage,
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Add single participant
  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setStatusMessage({ type: 'error', text: '請填寫姓名！' });
      return;
    }

    const nextSeqNum = participants.length > 0
      ? Math.max(...participants.map((p) => (typeof p.sequence === 'number' ? p.sequence : 0))) + 1
      : 1;

    const finalSeq = newSeq.trim() ? (isNaN(Number(newSeq)) ? newSeq.trim() : Number(newSeq)) : nextSeqNum;

    const newPerson: Participant = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      sequence: finalSeq,
      name: newName.trim(),
      department: newDept.trim() || '未分組',
    };

    onUpdateParticipants([...participants, newPerson]);
    setNewSeq('');
    setNewName('');
    setNewDept('');
    setStatusMessage({
      type: 'success',
      text: `已新增：${newPerson.name} (${newPerson.department})`,
    });
  };

  // Start edit
  const handleStartEdit = (p: Participant) => {
    setEditingId(p.id);
    setEditSeq(String(p.sequence));
    setEditName(p.name);
    setEditDept(p.department);
  };

  // Save edit
  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) {
      setStatusMessage({ type: 'error', text: '姓名不能為空！' });
      return;
    }

    const updated = participants.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          sequence: isNaN(Number(editSeq)) ? editSeq.trim() : Number(editSeq),
          name: editName.trim(),
          department: editDept.trim() || '未分組',
        };
      }
      return p;
    });

    onUpdateParticipants(updated);
    setEditingId(null);
    setStatusMessage({ type: 'success', text: '已儲存人員修改內容！' });
  };

  // Delete single with custom ConfirmModal
  const handleDelete = (id: string) => {
    const target = participants.find((p) => p.id === id);
    if (!target) return;
    setConfirmDialog({
      isOpen: true,
      title: '確認刪除人員',
      message: `確定要刪除「${target.name}」（序號/球號: #${target.sequence}）嗎？`,
      confirmText: '確定刪除',
      type: 'danger',
      onConfirm: () => {
        onUpdateParticipants(participants.filter((p) => p.id !== id));
        setStatusMessage({ type: 'success', text: `已刪除人員：${target.name}` });
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Clear all with custom ConfirmModal
  const handleClearAll = () => {
    if (participants.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: '確認清空名單',
      message: `⚠️ 警告：確定要清空整份人員名單（共 ${participants.length} 人）嗎？\n此操作無法還原！`,
      confirmText: '確定清空',
      type: 'danger',
      onConfirm: () => {
        onUpdateParticipants([]);
        setStatusMessage({ type: 'success', text: '已成功清空所有人員名單！' });
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Reset default confirm
  const handleResetConfirm = () => {
    setConfirmDialog({
      isOpen: true,
      title: '重設為範例名單',
      message: '確定要將人員名單重設為預設範例名單（30人）嗎？\n現有名單將會被替換。',
      confirmText: '確認重設',
      type: 'warning',
      onConfirm: () => {
        onResetDefault();
        setStatusMessage({ type: 'success', text: '已恢復為範例人員名單！' });
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Handle batch paste submit
  const handleBatchSubmit = () => {
    if (!batchText.trim()) return;

    const lines = batchText.split('\n');
    const newAdditions: Participant[] = [];
    let autoSeq = participants.length > 0
      ? Math.max(...participants.map((p) => (typeof p.sequence === 'number' ? p.sequence : 0))) + 1
      : 1;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      const parts = line.split(/[\t,，\s]+/).filter(Boolean);
      if (parts.length === 1) {
        newAdditions.push({
          id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          sequence: autoSeq++,
          name: parts[0],
          department: '未分組',
        });
      } else if (parts.length === 2) {
        if (!isNaN(Number(parts[0]))) {
          newAdditions.push({
            id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            sequence: Number(parts[0]),
            name: parts[1],
            department: '未分組',
          });
        } else {
          newAdditions.push({
            id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            sequence: autoSeq++,
            name: parts[0],
            department: parts[1],
          });
        }
      } else {
        const seqParsed = !isNaN(Number(parts[0])) ? Number(parts[0]) : parts[0];
        newAdditions.push({
          id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          sequence: seqParsed,
          name: parts[1],
          department: parts[2] || '未分組',
        });
      }
    }

    if (newAdditions.length > 0) {
      onUpdateParticipants([...participants, ...newAdditions]);
      setStatusMessage({
        type: 'success',
        text: `批次新增了 ${newAdditions.length} 位人員！`,
      });
      setBatchText('');
      setShowBatchModal(false);
    }
  };

  // Filtered participants list
  const filteredParticipants = participants.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.sequence).includes(searchQuery)
  );

  return (
    <div id="participant-manager-section" className="w-full max-w-5xl mx-auto py-4 px-4">
      {/* Header & Actions Banner - Cyber Blue Theme */}
      <div className="bg-[#09153a]/90 rounded-2xl p-6 border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.15)] mb-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cyan-500/20">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-cyan-400" />
              人員名單管理 (科技資料庫)
            </h2>
            <p className="text-sm text-cyan-200/70 mt-1">
              可載入 Excel (.xlsx / .xls) 名單，或直接在線上新增、編輯修改各欄位資料。
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-[#0c1a47] text-cyan-200 border border-cyan-500/30 text-xs font-semibold">
              總名額：<strong className="text-white">{participants.length}</strong> 人
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-cyan-950/60 text-cyan-300 border border-cyan-400/40 text-xs font-semibold">
              已中獎：<strong>{participants.filter((p) => winnerIds.has(String(p.sequence))).length}</strong> 人
            </span>
          </div>
        </div>

        {/* Excel Import / Export Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
              id="excel-file-input"
            />

            {/* Upload Button */}
            <button
              id="btn-upload-excel"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {isProcessing ? '讀取中...' : '載入 EXCEL 名單'}
            </button>

            {/* Download Template */}
            <button
              id="btn-download-template"
              onClick={exportParticipantsTemplate}
              className="px-3.5 py-2 rounded-xl bg-[#0c1a47] hover:bg-[#102258] text-cyan-200 border border-cyan-500/30 text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer"
              title="下載標準Excel名單範本格式"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              下載範本檔
            </button>

            {/* Export Current List */}
            <button
              id="btn-export-current-participants"
              onClick={() => exportParticipantsToExcel(participants)}
              disabled={participants.length === 0}
              className="px-3.5 py-2 rounded-xl bg-[#0c1a47] hover:bg-[#102258] text-cyan-200 border border-cyan-500/30 text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              匯出名單
            </button>

            {/* Batch Paste */}
            <button
              id="btn-batch-paste-participants"
              onClick={() => setShowBatchModal(true)}
              className="px-3.5 py-2 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-500/40 text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              批次貼上名單
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Reset Default */}
            <button
              id="btn-reset-default-participants"
              onClick={handleResetConfirm}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              重設範例
            </button>

            {/* Clear All */}
            <button
              id="btn-clear-all-participants"
              onClick={handleClearAll}
              disabled={participants.length === 0}
              className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 text-xs font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              清空
            </button>
          </div>
        </div>

        {/* Status notification */}
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
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              關閉
            </button>
          </div>
        )}
      </div>

      {/* Manual Input Form - Cyber Blue Theme */}
      <div className="bg-[#09153a]/90 rounded-2xl p-6 border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.15)] mb-6 text-white">
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-cyan-400" />
          自行新增單筆人員 (序號、姓名、部門)
        </h3>
        <form onSubmit={handleAddSingle} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-cyan-300 mb-1">序號 (可選填)</label>
            <input
              type="text"
              placeholder={`如: ${participants.length + 1}`}
              value={newSeq}
              onChange={(e) => setNewSeq(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0c1a47] border border-cyan-500/30 text-white placeholder-slate-400 text-sm focus:outline-hidden focus:border-cyan-400"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-bold text-cyan-300 mb-1">
              姓名 <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="如: 王小明"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0c1a47] border border-cyan-500/30 text-white placeholder-slate-400 text-sm focus:outline-hidden focus:border-cyan-400"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-cyan-300 mb-1">部門 / 單位</label>
            <input
              type="text"
              placeholder="如: 行銷企劃部"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0c1a47] border border-cyan-500/30 text-white placeholder-slate-400 text-sm focus:outline-hidden focus:border-cyan-400"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)] transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              加入名冊
            </button>
          </div>
        </form>
      </div>

      {/* Participants Table Container */}
      <div className="bg-[#09153a]/90 rounded-2xl border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.15)] overflow-hidden text-slate-200">
        {/* Table Search Header */}
        <div className="p-4 bg-[#07112e] border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜尋序號、姓名、部門..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0c1a47] border border-cyan-500/30 text-white placeholder-slate-400 text-sm focus:outline-hidden focus:border-cyan-400"
            />
          </div>
          <div className="text-xs text-cyan-300">
            顯示 {filteredParticipants.length} / {participants.length} 筆
          </div>
        </div>

        {/* Table Body */}
        {filteredParticipants.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="font-semibold text-slate-300">尚無人員名單</p>
            <p className="text-xs mt-1 text-slate-500">請載入 Excel 檔案或於上方手動輸入新增</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="sticky top-0 bg-[#07112e] text-xs font-bold text-cyan-300 uppercase tracking-wider border-b border-cyan-500/30">
                <tr>
                  <th className="px-4 py-3 w-24 text-red-400">球號 / 序號</th>
                  <th className="px-4 py-3">姓名</th>
                  <th className="px-4 py-3">部門</th>
                  <th className="px-4 py-3 w-24">狀態</th>
                  <th className="px-4 py-3 w-28 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10">
                {filteredParticipants.map((p) => {
                  const isEditing = editingId === p.id;
                  const isWon = winnerIds.has(String(p.sequence));

                  return (
                    <tr key={p.id} className="hover:bg-[#0c1a47]/60 transition-colors">
                      {/* Sequence / Ball Number (Bright Red Display) */}
                      <td className="px-4 py-3 font-mono font-bold">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editSeq}
                            onChange={(e) => setEditSeq(e.target.value)}
                            className="w-16 px-2 py-1 bg-[#050b1e] border border-red-500/50 rounded text-red-400 font-bold text-xs"
                          />
                        ) : (
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg bg-red-600/20 border border-red-500/60 text-red-400 font-mono font-black text-xs shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                            #{p.sequence}
                          </span>
                        )}
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3 font-bold text-white">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-2 py-1 bg-[#050b1e] border border-cyan-500/50 rounded text-white text-xs"
                          />
                        ) : (
                          p.name
                        )}
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3 text-slate-300">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editDept}
                            onChange={(e) => setEditDept(e.target.value)}
                            className="w-full px-2 py-1 bg-[#050b1e] border border-cyan-500/50 rounded text-white text-xs"
                          />
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-lg bg-[#0c1a47] text-cyan-200 text-xs border border-cyan-500/20">
                            {p.department}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {isWon ? (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold text-xs">
                            已中獎
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs">
                            待抽中
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleSaveEdit(p.id)}
                              className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-400/30 transition cursor-pointer"
                              title="儲存"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                              title="取消"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleStartEdit(p)}
                              className="p-1.5 rounded-lg text-cyan-300 hover:text-white hover:bg-cyan-500/20 transition cursor-pointer"
                              title="編輯"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
                              title="刪除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Batch Paste Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030717]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#09153a] rounded-2xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.3)] border border-cyan-400/50 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <h3 className="font-bold text-white text-base">批次貼上名單</h3>
              <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-cyan-200/80 mt-2">
              每行輸入一人，欄位間可用空白、逗號或 Tab 分隔（例如：<code>101 陳小美 行銷部</code> 或單純輸入 <code>林大華</code>）：
            </p>
            <textarea
              rows={8}
              placeholder="1 陳建銘 研發部&#10;2 林怡君 行銷部&#10;3 黃冠宇 財務部"
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              className="w-full mt-3 p-3 rounded-xl bg-[#0c1a47] border border-cyan-500/40 text-white placeholder-slate-400 font-mono text-sm focus:outline-hidden focus:border-cyan-400"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-sm font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleBatchSubmit}
                disabled={!batchText.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-sm font-black shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50 cursor-pointer"
              >
                確認匯入
              </button>
            </div>
          </div>
        </div>
      )}
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
