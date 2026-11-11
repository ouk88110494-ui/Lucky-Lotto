import React, { useState } from 'react';
import { Download, Trophy, Trash2, Search, RotateCcw, Award, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import { WinnerRecord, Prize } from '../types';
import { exportWinnersToExcel } from '../utils/excel';
import { ConfirmModal } from './ConfirmModal';

interface WinnerListProps {
  winners: WinnerRecord[];
  prizes: Prize[];
  onRemoveWinner: (id: string) => void;
  onClearWinners: () => void;
}

export const WinnerList: React.FC<WinnerListProps> = ({
  winners,
  prizes,
  onRemoveWinner,
  onClearWinners,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrizeFilter, setSelectedPrizeFilter] = useState('ALL');
  const [dashboardView, setDashboardView] = useState<'byPrize' | 'byPerson'>('byPrize');

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

  // Filter winners
  const filteredWinners = winners.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(w.sequence).includes(searchQuery) ||
      w.prizeName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPrize = selectedPrizeFilter === 'ALL' || w.prizeId === selectedPrizeFilter;

    return matchesSearch && matchesPrize;
  });

  const handleExport = () => {
    exportWinnersToExcel(winners);
  };

  // Handle clear all winners with custom modal
  const handleClearAllConfirm = () => {
    if (winners.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: '確認重置中獎清冊',
      message: `⚠️ 警告：確定要清空所有中獎記錄（共 ${winners.length} 人）嗎？\n所有被抽中的名額將全數退回抽獎池！`,
      confirmText: '確定清空重置',
      type: 'danger',
      onConfirm: () => {
        onClearWinners();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Handle single winner forfeit / redraw with custom modal
  const handleForfeitConfirm = (w: WinnerRecord) => {
    setConfirmDialog({
      isOpen: true,
      title: '確認同仁棄權',
      message: `確定要作廢「${w.name}」（${w.prizeName}）的中獎資格嗎？\n該獎品名額與人員資格將退回抽獎池重新抽獎。`,
      confirmText: '確定棄權補抽',
      type: 'danger',
      onConfirm: () => {
        onRemoveWinner(w.id);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <div id="winner-list-section" className="w-full max-w-5xl mx-auto py-4 px-4">
      {/* 1. 中獎人員儀表板 (Winner Dashboard) - 位於頁面上方 */}
      <div
        id="winner-dashboard"
        className="bg-[#09153a]/95 rounded-2xl p-5 sm:p-6 border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.2)] mb-6 text-white"
      >
        {/* 儀表板頂部標題與檢視模式切換 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-[0_0_18px_rgba(245,158,11,0.5)]">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  中獎人員儀表板
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-xs font-bold font-mono">
                  已開出 {winners.length} 位
                </span>
              </div>
              <p className="text-xs text-cyan-200/70 mt-0.5">
                即時掌握中獎人員名單與抽中獎項
              </p>
            </div>
          </div>

          {/* 視圖模式切換（依獎項分組 / 依中獎人員名牌） */}
          <div className="flex items-center gap-1 bg-[#0c1a47] p-1 rounded-xl border border-cyan-500/30 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setDashboardView('byPrize')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                dashboardView === 'byPrize'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>依獎項分組</span>
            </button>
            <button
              type="button"
              onClick={() => setDashboardView('byPerson')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                dashboardView === 'byPerson'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>中獎人員名牌</span>
            </button>
          </div>
        </div>

        {/* 儀表板內容區塊 */}
        {winners.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
              <Trophy className="w-6 h-6 opacity-60" />
            </div>
            <div className="text-sm font-bold text-slate-300">目前尚無中獎人員紀錄</div>
            <p className="text-xs text-slate-400 mt-1">
              請至「抽獎現場」啟動球箱抽獎，抽出的幸運得主與獎項將即時同步於此儀表板！
            </p>
          </div>
        ) : dashboardView === 'byPrize' ? (
          /* 依獎項分組列出：獎項與該獎項的中獎人員姓名 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-4">
            {prizes.map((p) => {
              const prizeWinners = winners.filter((w) => w.prizeId === p.id);
              const remaining = Math.max(0, p.quota - prizeWinners.length);

              return (
                <div
                  key={p.id}
                  className="bg-[#0c1a47] rounded-xl border border-cyan-500/30 p-3.5 flex flex-col justify-between shadow-xs hover:border-cyan-400/50 transition"
                >
                  <div>
                    {/* 獎項標題列 */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-cyan-500/20 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2.5 py-0.5 rounded-md text-xs font-black text-white shadow-xs"
                          style={{ backgroundColor: p.color || '#06B6D4' }}
                        >
                          {p.name}
                        </span>
                        <span className="text-xs text-cyan-200/90 font-medium truncate max-w-[130px]" title={p.content}>
                          {p.content}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        {prizeWinners.length} / {p.quota} 人
                      </span>
                    </div>

                    {/* 該獎項的中獎人員名單（姓名 + 部門） */}
                    {prizeWinners.length === 0 ? (
                      <div className="py-3 text-center text-xs text-slate-400 italic">
                        尚未開出得獎者 (剩餘 {remaining} 名)
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 py-1">
                        {prizeWinners.map((w) => (
                          <div
                            key={w.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#07112e] border border-cyan-500/40 text-xs shadow-xs"
                          >
                            <span className="font-black text-white text-sm">
                              {w.name}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              ({w.department})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 mt-2 border-t border-cyan-500/15 flex items-center justify-between text-[11px] text-slate-400">
                    <span>進度</span>
                    <span>
                      {remaining === 0 ? (
                        <strong className="text-emerald-400 font-bold">已全數抽完</strong>
                      ) : (
                        <span>剩餘 <strong className="text-cyan-300 font-mono">{remaining}</strong> 名額</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* 全部中獎人員名單網格：列出姓名及獎項 */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-4">
            {winners.map((w, idx) => (
              <div
                key={w.id}
                className="bg-[#0c1a47] hover:bg-[#102258] p-3 rounded-xl border border-cyan-500/30 transition flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono font-bold text-[11px]">
                      順位 #{idx + 1}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      序號 #{w.sequence}
                    </span>
                  </div>
                  {/* 中獎人姓名 */}
                  <div className="font-black text-white text-base truncate mb-0.5">
                    {w.name}
                  </div>
                  <div className="text-xs text-slate-300 truncate mb-2">
                    {w.department}
                  </div>
                </div>

                {/* 榮獲獎項 */}
                <div className="pt-2 border-t border-cyan-500/20">
                  <span className="inline-block w-full text-center px-2 py-1 rounded bg-gradient-to-r from-amber-500/30 to-yellow-500/20 border border-amber-400/50 text-amber-300 font-black text-xs truncate">
                    {w.prizeName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Header Banner - Cyber Blue Theme */}
      <div className="bg-[#09153a]/90 rounded-2xl p-6 border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.15)] mb-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cyan-500/20">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-cyan-400" />
              中獎清冊記錄 (科技報表)
            </h2>
            <p className="text-sm text-cyan-200/70 mt-1">
              即時紀錄所有中獎人員名單、獎項與時間，可直接匯出完整 Excel 報表。
            </p>
          </div>

          {/* Excel Export Button */}
          <div className="flex items-center gap-2">
            <button
              id="btn-download-winners-excel"
              onClick={handleExport}
              disabled={winners.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.3)] transition flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
            >
              <Download className="w-4 h-4" />
              下載 EXCEL 中獎清冊
            </button>

            <button
              id="btn-clear-all-winners"
              onClick={handleClearAllConfirm}
              disabled={winners.length === 0}
              className="px-3.5 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 text-xs font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              重置名冊
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-5">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search input */}
            <div className="relative w-64">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜尋姓名、部門、獎項..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0c1a47] border border-cyan-500/30 text-white placeholder-slate-400 text-sm focus:outline-hidden focus:border-cyan-400"
              />
            </div>

            {/* Prize filter selector */}
            <select
              value={selectedPrizeFilter}
              onChange={(e) => setSelectedPrizeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#0c1a47] border border-cyan-500/30 text-sm font-semibold text-cyan-200 focus:outline-hidden focus:border-cyan-400"
            >
              <option value="ALL">全部獎項 ({winners.length})</option>
              {prizes.map((p) => {
                const count = winners.filter((w) => w.prizeId === p.id).length;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} ({count}人)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="text-xs font-semibold text-cyan-300">
            中獎總人數：<strong className="text-amber-400 text-sm">{winners.length}</strong> 位
          </div>
        </div>
      </div>

      {/* Winners Table */}
      <div className="bg-[#09153a]/90 rounded-2xl border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.15)] overflow-hidden text-slate-200">
        {winners.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Trophy className="w-14 h-14 mx-auto text-cyan-500/40 mb-3" />
            <h3 className="text-lg font-bold text-slate-300">目前尚無中獎者</h3>
            <p className="text-xs text-slate-500 mt-1">請回到「抽獎現場」點選科技號碼球箱開始進行抽獎！</p>
          </div>
        ) : filteredWinners.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm font-semibold">未找到符合篩選條件的中獎者</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#07112e] text-xs font-bold text-cyan-300 uppercase tracking-wider border-b border-cyan-500/30">
                <tr>
                  <th className="px-4 py-3 w-16">順位</th>
                  <th className="px-4 py-3">姓名</th>
                  <th className="px-4 py-3">部門</th>
                  <th className="px-4 py-3">中獎獎項</th>
                  <th className="px-4 py-3">獎品內容</th>
                  <th className="px-4 py-3">抽中時間</th>
                  <th className="px-4 py-3 w-20 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10">
                {filteredWinners.map((w, index) => {
                  const prize = prizes.find((p) => p.id === w.prizeId);

                  return (
                    <tr key={w.id} className="hover:bg-[#0c1a47]/60 transition-colors">
                      <td className="px-4 py-3 font-mono text-cyan-400 font-bold">
                        #{index + 1}
                      </td>

                      {/* Name & Seq */}
                      <td className="px-4 py-3 font-black text-white text-base">
                        {w.name}
                        <span className="text-xs font-normal text-cyan-300/70 ml-1.5 font-mono">
                          (序號: #{w.sequence})
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3 text-slate-300">
                        <span className="px-2.5 py-1 rounded-lg bg-[#0c1a47] text-cyan-200 text-xs font-semibold border border-cyan-500/20">
                          {w.department}
                        </span>
                      </td>

                      {/* Prize Name */}
                      <td className="px-4 py-3">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-black text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                          style={{ backgroundColor: prize?.color || '#06B6D4' }}
                        >
                          {w.prizeName}
                        </span>
                      </td>

                      {/* Prize Content */}
                      <td className="px-4 py-3 font-semibold text-slate-200 text-xs sm:text-sm">
                        {w.prizeContent}
                      </td>

                      {/* Drawn Time */}
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                        {w.drawnAt}
                      </td>

                      {/* Redraw / Forfeit Button with ConfirmModal */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleForfeitConfirm(w)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 border border-rose-500/30 text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer active:scale-95"
                          title="棄權 / 作廢中獎資格（退回候選池）"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          棄權
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
