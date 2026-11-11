import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, RotateCcw, Dices, Award, Check } from 'lucide-react';
import { Participant, Prize, WinnerRecord } from '../types';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';

interface PrizeDrawModalProps {
  isOpen: boolean;
  participant: Participant | null;
  ballNumber: string | number;
  ballColor?: string;
  prizes: Prize[];
  winners: WinnerRecord[];
  onConfirmWinner: (winner: WinnerRecord) => void;
  onRedrawPerson: () => void;
  onClose: () => void;
}

export const PrizeDrawModal: React.FC<PrizeDrawModalProps> = ({
  isOpen,
  participant,
  ballNumber,
  ballColor = '#06B6D4',
  prizes,
  winners,
  onConfirmWinner,
  onRedrawPerson,
  onClose,
}) => {
  // Available prizes that still have quota
  const availablePrizes = prizes
    .map((p) => {
      const drawnCount = winners.filter((w) => w.prizeId === p.id).length;
      const remaining = Math.max(0, p.quota - drawnCount);
      return { ...p, remaining };
    })
    .filter((p) => p.remaining > 0);

  // States
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const spinIntervalRef = useRef<number | null>(null);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setWonPrize(null);
      setIsRevealed(false);
      setIsSpinning(false);
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  // Clean up interval
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) clearTimeout(spinIntervalRef.current);
    };
  }, []);

  if (!isOpen || !participant) return null;

  // Trigger grand dual-cannon celebratory confetti
  const triggerCelebrationConfetti = () => {
    // Cannon from left
    confetti({
      particleCount: 80,
      angle: 60,
      spread: 60,
      origin: { x: 0.1, y: 0.65 },
      colors: ['#06B6D4', '#3B82F6', '#F59E0B', '#10B981', '#EC4899', '#FFFFFF'],
    });
    // Cannon from right
    confetti({
      particleCount: 80,
      angle: 120,
      spread: 60,
      origin: { x: 0.9, y: 0.65 },
      colors: ['#06B6D4', '#3B82F6', '#F59E0B', '#10B981', '#EC4899', '#FFFFFF'],
    });
    // Fireworks from center
    setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { x: 0.5, y: 0.45 },
        colors: ['#38BDF8', '#818CF8', '#FBBF24', '#34D399', '#F472B6'],
      });
    }, 250);
  };

  // Start spinning to draw a prize
  const handleStartPrizeDraw = () => {
    if (isSpinning) return;
    if (availablePrizes.length === 0) {
      alert('所有獎項名額均已抽完！');
      return;
    }

    setIsSpinning(true);
    setIsRevealed(false);
    setWonPrize(null);

    // Build weighted pool
    const prizePool: Prize[] = [];
    availablePrizes.forEach((p) => {
      for (let i = 0; i < p.remaining; i++) {
        prizePool.push(p);
      }
    });

    const chosenPrize = prizePool[Math.floor(Math.random() * prizePool.length)];

    // Sound: Realistic Snare Drum Roll crescendo
    soundManager.playDrumRoll(2500);

    let speed = 55;
    let elapsed = 0;
    const totalDuration = 2500;

    const runTick = () => {
      setHighlightedIndex((prev) => (prev + 1) % availablePrizes.length);
      soundManager.playClick();
      elapsed += speed;

      if (elapsed < totalDuration * 0.65) {
        spinIntervalRef.current = window.setTimeout(runTick, speed);
      } else if (elapsed < totalDuration) {
        speed += 40;
        spinIntervalRef.current = window.setTimeout(runTick, speed);
      } else {
        // Final stop on chosen prize
        const targetIdx = availablePrizes.findIndex((p) => p.id === chosenPrize.id);
        setHighlightedIndex(targetIdx >= 0 ? targetIdx : 0);
        setWonPrize(chosenPrize);
        setIsSpinning(false);
        setIsRevealed(true);

        // Play Fanfare & Cymbal + Dual Confetti Cannons
        soundManager.playCelebration();
        triggerCelebrationConfetti();
      }
    };

    runTick();
  };

  // Final confirmation to save to winner record
  const handleConfirm = () => {
    if (!wonPrize) return;

    const now = new Date();
    const timeFormatted = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newRecord: WinnerRecord = {
      id: `w-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sequence: participant.sequence,
      name: participant.name,
      department: participant.department,
      prizeId: wonPrize.id,
      prizeName: wonPrize.name,
      prizeContent: wonPrize.content,
      ballNumber: ballNumber,
      drawnAt: timeFormatted,
      timestamp: Date.now(),
    };

    onConfirmWinner(newRecord);
    onClose();
  };

  return (
    <div
      id="prize-draw-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#030717]/90 backdrop-blur-md p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-2xl bg-[#09153a] rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)] border-2 border-cyan-500/40 text-slate-100 overflow-hidden my-6"
      >
        {/* Futuristic glowing ambient background */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Step Badge Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20 mb-6">
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              第 2 步：抽中獎獎項
            </span>
            <span className="text-xs font-bold text-slate-400 hidden sm:inline">
              由中獎同仁開啟專屬大獎！
            </span>
          </div>

          <button
            onClick={onRedrawPerson}
            disabled={isSpinning}
            className="text-xs font-bold text-slate-400 hover:text-rose-400 flex items-center gap-1 transition px-2.5 py-1 rounded-lg hover:bg-slate-800/60 border border-slate-700/50 disabled:opacity-50"
            title="此人若未到場或資格不符，可放棄並重新抽取號碼球"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            人員棄權 / 重抽號碼球
          </button>
        </div>

        {/* Participant Spotlight Bar */}
        <div className="bg-[#0c1a47] rounded-2xl p-4 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4 mb-6 shadow-inner">
          <div className="flex items-center gap-3">
            {/* Pop Ball Thumbnail - Vivid Bright Red */}
            <div
              className="w-14 h-14 rounded-full flex flex-col items-center justify-center text-white shadow-[0_0_18px_rgba(239,68,68,0.7)] ring-2 ring-red-400 shrink-0"
              style={{
                background: `radial-gradient(circle at 30% 30%, #ffffff 0%, #ef4444 55%, #991b1b 100%)`,
              }}
            >
              <span className="text-[8px] uppercase font-mono font-bold tracking-widest text-white/90">球號</span>
              <span className="text-base font-black font-mono text-white drop-shadow-xs">#{ballNumber}</span>
            </div>

            <div>
              <div className="text-xs font-bold text-cyan-400 tracking-wider">★ 本輪幸運得主 ★</div>
              <div className="text-2xl font-black text-white flex items-center gap-2">
                <span>{participant.name}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-900/60 text-cyan-300 border border-blue-500/30">
                  {participant.department}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono text-slate-300">
              幸運球號：<strong className="text-red-400 font-black text-sm">#{participant.sequence}</strong>
            </div>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end mt-0.5">
              <Check className="w-3.5 h-3.5" />
              已確認中獎資格
            </div>
          </div>
        </div>

        {/* Prize Selection Carousel / Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold tracking-wider text-cyan-300/80 uppercase">
              候選獎項輪盤 ({availablePrizes.length} 個獎項尚有名額)
            </div>
            {isSpinning && (
              <span className="text-xs font-bold text-amber-400 animate-pulse flex items-center gap-1">
                <Dices className="w-3.5 h-3.5 animate-spin" />
                獎項高速滾動中...
              </span>
            )}
          </div>

          {availablePrizes.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-[#07112e] rounded-2xl border border-slate-800">
              <p className="font-bold text-slate-200">所有獎項名額均已抽完！</p>
              <p className="text-xs mt-1">請至「獎項設定」增加名額或新增獎項。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto p-1">
              {availablePrizes.map((p, idx) => {
                const isSelected = highlightedIndex === idx;
                const isFinalWinner = wonPrize?.id === p.id;

                return (
                  <motion.div
                    key={p.id}
                    animate={{
                      scale: isSelected || isFinalWinner ? 1.03 : 1,
                    }}
                    transition={{ duration: 0.12 }}
                    className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      isFinalWinner
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400 ring-4 ring-amber-400/40 shadow-[0_0_25px_rgba(251,191,36,0.35)]'
                        : isSelected
                        ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-2 ring-cyan-300/50'
                        : 'bg-[#0b173e]/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-xs"
                        style={{ backgroundColor: p.color || '#06B6D4' }}
                      >
                        {p.name}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        剩餘 <strong className="text-cyan-300">{p.remaining}</strong> 名
                      </span>
                    </div>
                    <div className="text-sm font-black text-slate-100 line-clamp-1">
                      🎁 {p.content}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Won Prize Celebration Card (when revealed) */}
        <AnimatePresence>
          {isRevealed && wonPrize && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="p-5 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 text-white text-center shadow-[0_0_40px_rgba(6,182,212,0.5)] border border-cyan-300/50 mb-6 relative overflow-hidden"
            >
              <div className="absolute top-2 right-3 opacity-15">
                <Trophy className="w-24 h-24 text-white" />
              </div>

              <div className="inline-block px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-bold mb-2">
                🎉 恭喜榮獲幸運大獎！
              </div>

              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-1 text-white drop-shadow-md">
                {wonPrize.name}
              </h2>

              <p className="text-lg sm:text-xl font-bold text-amber-300 drop-shadow-sm">
                🎁 {wonPrize.content}
              </p>

              <div className="mt-3 inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/40 text-xs font-medium border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>中獎者：<strong className="text-white text-sm">{participant.name}</strong> ({participant.department})</span>
                <span className="text-white/40">•</span>
                <span className="flex items-center gap-1">
                  中獎球號：
                  <strong className="px-2 py-0.5 rounded bg-red-600/90 text-white font-mono font-black text-xs shadow-sm">
                    #{ballNumber}
                  </strong>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {!isRevealed ? (
            <button
              id="btn-trigger-prize-spin"
              onClick={handleStartPrizeDraw}
              disabled={isSpinning || availablePrizes.length === 0}
              className={`w-full py-4 px-6 rounded-2xl text-lg font-black tracking-wide text-white shadow-[0_0_25px_rgba(6,182,212,0.35)] transition flex items-center justify-center gap-2.5 cursor-pointer ${
                isSpinning
                  ? 'bg-cyan-700 animate-pulse cursor-wait'
                  : availablePrizes.length === 0
                  ? 'bg-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-98'
              }`}
            >
              <Dices className={`w-6 h-6 ${isSpinning ? 'animate-spin' : ''}`} />
              {isSpinning ? '獎項高速抽取中...' : '🎰 點我啟動抽獎項！'}
            </button>
          ) : (
            <>
              <button
                id="btn-redraw-prize"
                onClick={handleStartPrizeDraw}
                disabled={isSpinning}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl border border-cyan-500/30 bg-[#0c1a47] hover:bg-slate-800 text-slate-200 font-bold text-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-cyan-400" />
                重新抽獎項
              </button>

              <button
                id="btn-confirm-full-winner"
                onClick={handleConfirm}
                className="w-full flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-base shadow-[0_0_25px_rgba(16,185,129,0.4)] transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Check className="w-5 h-5" />
                確認入冊並完成中獎！
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
