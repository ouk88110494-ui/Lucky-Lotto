import { useState, useEffect, useMemo } from 'react';
import { Sparkles, Users, Award, Trophy, Gift, Dices, Volume2, VolumeX, Settings, Download } from 'lucide-react';
import { Participant, Prize, WinnerRecord } from './types';
import { DEFAULT_PARTICIPANTS, DEFAULT_PRIZES } from './data/defaultData';
import { BallMachine } from './components/BallMachine';
import { ParticipantManager } from './components/ParticipantManager';
import { PrizeManager } from './components/PrizeManager';
import { WinnerList } from './components/WinnerList';
import { AppSettingsModal } from './components/AppSettingsModal';
import { soundManager } from './utils/audio';
import { safeStorage } from './utils/storage';
import { downloadOfflineHtmlFile } from './utils/downloadOffline';

type TabType = 'stage' | 'participants' | 'prizes' | 'winners';

export default function App() {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<TabType>('stage');

  // App Settings Modal & Sound state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  // Listen to global sound manager updates
  useEffect(() => {
    const unsubscribe = soundManager.subscribe((state) => {
      setIsMuted(state.isMuted);
    });
    return unsubscribe;
  }, []);

  // Persistence: Participants
  const [participants, setParticipants] = useState<Participant[]>(() => {
    const saved = safeStorage.getItem('lottery_app_participants');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return DEFAULT_PARTICIPANTS;
  });

  // Persistence: Prizes
  const [prizes, setPrizes] = useState<Prize[]>(() => {
    const saved = safeStorage.getItem('lottery_app_prizes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return DEFAULT_PRIZES;
  });

  // Persistence: Winners
  const [winners, setWinners] = useState<WinnerRecord[]>(() => {
    const saved = safeStorage.getItem('lottery_app_winners');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [];
  });

  // Persistence: Allow repeat
  const [allowRepeat, setAllowRepeat] = useState<boolean>(() => {
    return safeStorage.getItem('lottery_app_allow_repeat') === 'true';
  });

  // Active prize ID
  const [currentPrizeId, setCurrentPrizeId] = useState<string>(() => {
    return prizes[0]?.id || '';
  });

  // Sync state to safeStorage
  useEffect(() => {
    safeStorage.setItem('lottery_app_participants', JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    safeStorage.setItem('lottery_app_prizes', JSON.stringify(prizes));
  }, [prizes]);

  useEffect(() => {
    safeStorage.setItem('lottery_app_winners', JSON.stringify(winners));
  }, [winners]);

  useEffect(() => {
    safeStorage.setItem('lottery_app_allow_repeat', String(allowRepeat));
  }, [allowRepeat]);

  // Current selected prize object
  const currentPrize = useMemo(() => {
    return prizes.find((p) => p.id === currentPrizeId) || prizes[0] || null;
  }, [prizes, currentPrizeId]);

  // Winner sequence IDs set
  const winnerSeqSet = useMemo(() => {
    return new Set(winners.map((w) => String(w.sequence)));
  }, [winners]);

  // Handle winner drawn
  const handleWinnerDrawn = (newWinner: WinnerRecord) => {
    setWinners((prev) => [newWinner, ...prev]);
  };

  // Remove winner (redraw / cancel)
  const handleRemoveWinner = (recordId: string) => {
    setWinners((prev) => prev.filter((w) => w.id !== recordId));
  };

  // Clear all winners
  const handleClearWinners = () => {
    setWinners([]);
  };

  // Reset participants to default
  const handleResetParticipants = () => {
    setParticipants(DEFAULT_PARTICIPANTS);
  };

  // Reset prizes to default
  const handleResetPrizes = () => {
    setPrizes(DEFAULT_PRIZES);
    setCurrentPrizeId(DEFAULT_PRIZES[0]?.id || '');
  };

  return (
    <div className="cyber-grid-bg min-h-screen text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Global Navigation Header - Cyber Blue */}
      <header className="sticky top-0 z-40 bg-[#07112e]/90 backdrop-blur-md border-b border-cyan-500/30 shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none group"
            onClick={() => setActiveTab('stage')}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] group-hover:shadow-[0_0_25px_rgba(6,182,212,0.8)] transition">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white group-hover:text-cyan-300 transition">
                  幸運抽獎機
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-[10px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  Cyber Live
                </span>
              </div>
              <p className="text-[11px] text-cyan-200/70 font-medium hidden md:block">
                活動尾牙 • 科技號碼球箱抽獎 • Excel名冊匯出入
              </p>
            </div>
          </div>

          {/* Nav Tabs & App Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="flex items-center gap-1 sm:gap-1.5">
              <button
                id="tab-stage"
                onClick={() => setActiveTab('stage')}
                className={`px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'stage'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-[0_0_20px_rgba(6,182,212,0.6)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Dices className="w-4 h-4" />
                <span>抽獎現場</span>
              </button>

              <button
                id="tab-participants"
                onClick={() => setActiveTab('participants')}
                className={`px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'participants'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-[0_0_20px_rgba(6,182,212,0.6)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>人員名單</span>
                <span className="hidden sm:inline-block text-xs opacity-90">
                  ({participants.length})
                </span>
              </button>

              <button
                id="tab-prizes"
                onClick={() => setActiveTab('prizes')}
                className={`px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'prizes'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-[0_0_20px_rgba(6,182,212,0.6)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>獎項設定</span>
                <span className="hidden sm:inline-block text-xs opacity-90">
                  ({prizes.length})
                </span>
              </button>

              <button
                id="tab-winners"
                onClick={() => setActiveTab('winners')}
                className={`px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'winners'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-[0_0_20px_rgba(6,182,212,0.6)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>中獎清冊</span>
                {winners.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                    {winners.length}
                  </span>
                )}
              </button>
            </nav>

            <div className="h-6 w-px bg-cyan-500/30 hidden sm:block mx-0.5" />

            {/* Application Controls: Sound Toggle & Settings Modal */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Sound Toggle Button */}
              <button
                id="btn-header-sound-toggle"
                onClick={() => soundManager.toggleMute()}
                title={isMuted ? '音效已關閉（點擊開啟）' : '音效已開啟（點擊靜音）'}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                  isMuted
                    ? 'bg-slate-800/90 border-slate-700 text-slate-400 hover:text-white'
                    : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:bg-cyan-900'
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span className="hidden lg:inline text-xs">
                  {isMuted ? '靜音' : '音效'}
                </span>
              </button>

              {/* App Settings Modal Button */}
              <button
                id="btn-header-settings"
                onClick={() => setIsSettingsOpen(true)}
                title="應用程式設定（音效開關、音量試聽、離網單機版下載）"
                className="p-2 sm:px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">設定</span>
              </button>

              {/* Offline Standalone Version Download Button */}
              <button
                id="btn-header-offline-download"
                onClick={() => downloadOfflineHtmlFile()}
                title="下載離網單機版（免連網、雙擊即開單一 HTML 檔案）"
                className="hidden xl:flex py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition cursor-pointer active:scale-98"
              >
                <Download className="w-3.5 h-3.5" />
                <span>離網單機版</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        {activeTab === 'stage' && (
          <div className="flex flex-col items-center">
            {/* Stage Hero Ball Machine */}
            <BallMachine
              participants={participants}
              currentPrize={currentPrize}
              prizes={prizes}
              onSelectPrize={(p) => setCurrentPrizeId(p.id)}
              onWinnerDrawn={handleWinnerDrawn}
              winners={winners}
              allowRepeat={allowRepeat}
              onToggleRepeat={() => setAllowRepeat(!allowRepeat)}
            />

            {/* Live Winners Ticker / Bottom Strip - Tech Blue Card */}
            {winners.length > 0 && (
              <div className="w-full max-w-5xl mt-6 bg-[#09153a]/90 rounded-2xl p-5 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] text-slate-100">
                <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-black text-white text-sm">即時中獎榮譽榜</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('winners')}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    查看完整清冊 ({winners.length}位) &gt;
                  </button>
                </div>

                {/* Horizontal Scrolling Winner Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {winners.slice(0, 6).map((w, idx) => (
                    <div
                      key={w.id}
                      className="bg-[#0c1a47] hover:bg-[#102258] p-3 rounded-xl border border-cyan-500/30 transition flex flex-col items-center text-center shadow-xs"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-mono font-black text-xs flex items-center justify-center mb-1 shadow-[0_0_12px_rgba(245,158,11,0.5)]">
                        #{idx + 1}
                      </div>
                      <div className="font-black text-white text-sm">{w.name}</div>
                      <div className="text-[11px] text-cyan-300/70 font-medium truncate w-full">
                        {w.department}
                      </div>
                      <span className="mt-1 px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                        {w.prizeName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'participants' && (
          <ParticipantManager
            participants={participants}
            onUpdateParticipants={setParticipants}
            onResetDefault={handleResetParticipants}
            winnerIds={winnerSeqSet}
          />
        )}

        {activeTab === 'prizes' && (
          <PrizeManager
            prizes={prizes}
            onUpdatePrizes={setPrizes}
            onResetDefault={handleResetPrizes}
            winners={winners}
          />
        )}

        {activeTab === 'winners' && (
          <WinnerList
            winners={winners}
            prizes={prizes}
            onRemoveWinner={handleRemoveWinner}
            onClearWinners={handleClearWinners}
          />
        )}
      </main>

      {/* Footer - Tech Deep Blue */}
      <footer className="py-4 px-4 text-center text-xs text-slate-500 border-t border-cyan-950 bg-[#050b1e] flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <span>幸運抽獎機 • 支援 Excel 名單匯入匯出與科技號碼球箱抽獎</span>
        <span className="hidden sm:inline text-slate-700">•</span>
        <button
          onClick={() => downloadOfflineHtmlFile()}
          className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>下載離網單機版檔案 (.html 免連網雙擊即開)</span>
        </button>
      </footer>

      {/* Application Settings & Offline Center Modal */}
      <AppSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        participants={participants}
        prizes={prizes}
        winners={winners}
        allowRepeat={allowRepeat}
        onRestoreData={(data) => {
          if (data.participants) setParticipants(data.participants);
          if (data.prizes) setPrizes(data.prizes);
          if (data.winners) setWinners(data.winners);
          if (data.allowRepeat !== undefined) setAllowRepeat(data.allowRepeat);
        }}
      />
    </div>
  );
}
