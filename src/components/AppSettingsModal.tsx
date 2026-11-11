import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Download,
  Upload,
  HardDrive,
  FileCheck,
  Sparkles,
  Award,
  Music,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { downloadOfflineHtmlFile } from '../utils/downloadOffline';
import { Participant, Prize, WinnerRecord } from '../types';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  prizes: Prize[];
  winners: WinnerRecord[];
  allowRepeat: boolean;
  onRestoreData?: (data: {
    participants?: Participant[];
    prizes?: Prize[];
    winners?: WinnerRecord[];
    allowRepeat?: boolean;
  }) => void;
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  isOpen,
  onClose,
  participants,
  prizes,
  winners,
  allowRepeat,
  onRestoreData,
}) => {
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [volume, setVolume] = useState(soundManager.getVolume());
  const [activeTestingSound, setActiveTestingSound] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  // Sync sound settings listener
  useEffect(() => {
    const unsubscribe = soundManager.subscribe((state) => {
      setIsMuted(state.isMuted);
      setVolume(state.volume);
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMuted = soundManager.toggleMute();
    setIsMuted(nextMuted);
  };

  // Change Volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    soundManager.setVolume(newVol);
    if (isMuted && newVol > 0) {
      soundManager.setMuted(false);
      setIsMuted(false);
    }
  };

  // Test sound effects
  const handleTestSound = (type: 'spin' | 'pop' | 'fanfare') => {
    if (isMuted) {
      soundManager.setMuted(false);
      setIsMuted(false);
    }

    setActiveTestingSound(type);

    if (type === 'spin') {
      soundManager.playDrumRoll(2500);
      setTimeout(() => setActiveTestingSound(null), 2500);
    } else if (type === 'pop') {
      soundManager.playBallPop();
      setTimeout(() => setActiveTestingSound(null), 800);
    } else if (type === 'fanfare') {
      soundManager.playCelebration();
      setTimeout(() => setActiveTestingSound(null), 3000);
    }
  };

  // Download Standalone Offline HTML file
  const handleDownloadOfflineHtml = async () => {
    setBackupMessage('正在為您準備獨立單機版檔案，請稍候...');
    const ok = await downloadOfflineHtmlFile();
    setBackupMessage(ok ? '已成功下載「幸運抽獎機_離網單機版.html」！可在另一台電腦離線雙擊開啟。' : '下載觸發完畢，若無跳出請檢查瀏覽器下載設定。');
    setTimeout(() => setBackupMessage(null), 5000);
  };

  // Export full JSON backup
  const handleExportBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      participants,
      prizes,
      winners,
      allowRepeat,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `抽獎資料備份_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setBackupMessage('抽獎名單與紀錄備份 JSON 已成功匯出！');
    setTimeout(() => setBackupMessage(null), 4000);
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (onRestoreData) {
          onRestoreData({
            participants: json.participants,
            prizes: json.prizes,
            winners: json.winners,
            allowRepeat: json.allowRepeat,
          });
          setBackupMessage('已成功還原備份資料！');
          setTimeout(() => setBackupMessage(null), 4000);
        }
      } catch {
        alert('還原失敗：無效的 JSON 備份檔案格式。');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto select-none">
      <div className="relative w-full max-w-2xl bg-[#09153a] border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.3)] text-white overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/20 bg-[#07112e]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wide text-white">應用程式設定</h2>
              <p className="text-xs text-cyan-200/70">現場音效開關、音效試聽與離網單機版檔案下載</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status Message */}
          {backupMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{backupMessage}</span>
            </div>
          )}

          {/* 1. 音效設置區 (Sound Effects Setting) */}
          <div className="bg-[#0c1a47] rounded-2xl p-5 border border-cyan-500/30 space-y-4 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isMuted ? 'bg-slate-800 text-slate-400' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                  }`}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">音效開關 (Sound Effects)</h3>
                  <p className="text-[11px] text-slate-400">
                    {isMuted ? '目前處於靜音模式' : '已開啟抽獎轉動與中獎慶祝音效'}
                  </p>
                </div>
              </div>

              {/* Master Sound Toggle Switch */}
              <button
                type="button"
                id="btn-settings-toggle-sound"
                onClick={handleToggleMute}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  !isMuted ? 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_12px_rgba(6,182,212,0.5)]' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    !isMuted ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Volume Slider */}
            <div className="pt-2 border-t border-cyan-500/20 flex items-center gap-4">
              <span className="text-xs font-bold text-slate-300 shrink-0">音量控制</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
              />
              <span className="text-xs font-mono font-bold text-cyan-300 w-10 text-right">
                {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
              </span>
            </div>

            {/* 現場音效試聽區 */}
            <div className="pt-3 border-t border-cyan-500/20">
              <div className="text-xs font-bold text-cyan-200 mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>現場音效試聽與檢查（已引入高擬真立體聲音訊）</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. 抽獎轉動音效 */}
                <div className="bg-[#07112e] p-3 rounded-xl border border-cyan-500/20 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-black text-white">① 抽獎轉動音效</div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      物理旋轉滾筒、彩球碰撞與緊湊漸強鼓聲
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestSound('spin')}
                    disabled={activeTestingSound !== null}
                    className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{activeTestingSound === 'spin' ? '播放中...' : '試聽轉動聲'}</span>
                  </button>
                </div>

                {/* 2. 球號彈出音效 */}
                <div className="bg-[#07112e] p-3 rounded-xl border border-cyan-500/20 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-black text-white">② 球號彈出音效</div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      抽中幸運號碼瞬間立體機械彈出啵聲
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestSound('pop')}
                    disabled={activeTestingSound !== null}
                    className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{activeTestingSound === 'pop' ? '播放中...' : '試聽彈出聲'}</span>
                  </button>
                </div>

                {/* 3. 中獎產生與揭曉音效 */}
                <div className="bg-[#07112e] p-3 rounded-xl border border-cyan-500/20 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-black text-white">③ 中獎揭曉音效</div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      彩帶噴發、勝利號角管弦樂與慶祝鈸聲
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestSound('fanfare')}
                    disabled={activeTestingSound !== null}
                    className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{activeTestingSound === 'fanfare' ? '播放中...' : '試聽揭曉聲'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 離網單機執行版 (Offline Standalone Application) */}
          <div className="bg-gradient-to-br from-[#0c1a47] to-[#07112e] rounded-2xl p-5 border border-cyan-400/40 shadow-[0_0_25px_rgba(6,182,212,0.15)] space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-md">
                <HardDrive className="w-4 h-4 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white">離網單機版檔案（免連網、單一 HTML 檔案）</h3>
                  <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/40">
                    100% 離線可用
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  適合尾牙現場、無網路或防火牆受限之單機筆電，雙擊檔案即可在任何瀏覽器完整運作。
                </p>
              </div>
            </div>

            {/* 特色條列 */}
            <div className="bg-[#050b1e]/90 rounded-xl p-3 border border-cyan-500/20 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-200">
                <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>單一檔案包裝：</strong>所有介面、3D 物理球箱、Excel 匯入匯出函式庫與高音質音訊完全內嵌。</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-200">
                <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>操作零障礙：</strong>支援 Chrome、Edge、Safari、Firefox，無需安裝 Node.js 或建立 Web 伺服器。</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-200">
                <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>功能完全正常：</strong>人員名冊編輯、獎項增刪、即時儀表板及音效完全支援離線使用。</span>
              </div>
            </div>

            {/* 下載按鈕 */}
            <button
              type="button"
              id="btn-download-offline-html"
              onClick={handleDownloadOfflineHtml}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition cursor-pointer active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>下載離網單機版檔案 (幸運抽獎機_離網單機版.html)</span>
            </button>
          </div>

          {/* 3. 數據備份與轉移 (Data Backup & Migration) */}
          <div className="bg-[#0c1a47] rounded-2xl p-4 border border-cyan-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-white">活動名單與獎項紀錄備份</div>
              <div className="text-slate-400 text-[11px]">
                可匯出包含目前人員、獎項與中獎清冊之 JSON 檔，便於在離線單機電腦間快速還原。
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-600"
              >
                <Download className="w-3.5 h-3.5" />
                <span>匯出備份</span>
              </button>
              <label className="px-3 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-200 font-bold flex items-center gap-1.5 transition cursor-pointer border border-cyan-500/40">
                <Upload className="w-3.5 h-3.5" />
                <span>匯入還原</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cyan-500/20 bg-[#07112e]/90 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            設定將自動保存在本機快取中
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs transition cursor-pointer hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]"
          >
            完成設定
          </button>
        </div>
      </div>
    </div>
  );
};
