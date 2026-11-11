import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Dices, Volume2, VolumeX, Maximize2, Minimize2, RotateCcw, ArrowRight, Award, AlertCircle } from 'lucide-react';
import { Participant, Prize, WinnerRecord } from '../types';
import { soundManager } from '../utils/audio';
import { PrizeDrawModal } from './PrizeDrawModal';
import confetti from 'canvas-confetti';

interface BallMachineProps {
  participants: Participant[];
  currentPrize: Prize | null;
  prizes: Prize[];
  onSelectPrize: (prize: Prize) => void;
  onWinnerDrawn: (winner: WinnerRecord) => void;
  winners: WinnerRecord[];
  allowRepeat: boolean;
  onToggleRepeat: () => void;
}

interface PhysicsBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  number: string | number;
}

// High-Tech Cyber Neon Color Palette for lottery balls
const BALL_COLORS = [
  '#06B6D4', // Cyber Cyan
  '#3B82F6', // Electric Blue
  '#F59E0B', // Cyber Amber / Gold
  '#10B981', // Neon Emerald
  '#8B5CF6', // Laser Violet
  '#EC4899', // Cyber Pink
  '#0284C7', // Deep Sky
  '#F97316', // Neon Orange
];

export const BallMachine: React.FC<BallMachineProps> = ({
  participants,
  prizes,
  onWinnerDrawn,
  winners,
  allowRepeat,
  onToggleRepeat,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const ballsRef = useRef<PhysicsBall[]>([]);
  const isSpinningRef = useRef<boolean>(false);

  // States
  const [isDrawing, setIsDrawing] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Step 1: Popped Ball state
  const [poppedBall, setPoppedBall] = useState<{
    number: string | number;
    color: string;
    participant: Participant;
  } | null>(null);

  // Step 2: Modal Open state
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter eligible candidates
  const winnerIds = new Set(winners.map((w) => String(w.sequence)));
  const eligibleCandidates = allowRepeat
    ? participants
    : participants.filter((p) => !winnerIds.has(String(p.sequence)));

  // Calculate total remaining prize quota across all prizes
  const totalPrizeQuota = prizes.reduce((sum, p) => sum + p.quota, 0);
  const totalDrawnCount = winners.length;
  const remainingTotalPrizes = Math.max(0, totalPrizeQuota - totalDrawnCount);

  // Toggle Mute
  const handleToggleMute = () => {
    soundManager.toggleMute();
  };

  // Sync with global soundManager state
  useEffect(() => {
    const unsubscribe = soundManager.subscribe((state) => {
      setIsMuted(state.isMuted);
    });
    return unsubscribe;
  }, []);

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Confetti celebration cannons for ball pop
  const fireBallCelebrationConfetti = () => {
    confetti({
      particleCount: 75,
      angle: 60,
      spread: 65,
      origin: { x: 0.15, y: 0.65 },
      colors: ['#06B6D4', '#3B82F6', '#F59E0B', '#10B981', '#EC4899', '#FFFFFF'],
    });
    confetti({
      particleCount: 75,
      angle: 120,
      spread: 65,
      origin: { x: 0.85, y: 0.65 },
      colors: ['#06B6D4', '#3B82F6', '#F59E0B', '#10B981', '#EC4899', '#FFFFFF'],
    });
  };

  // Initialize Canvas physics balls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = 380);
    const height = (canvas.height = 380);
    const centerX = width / 2;
    const centerY = height / 2;
    const cageRadius = 160;

    const displayList = eligibleCandidates.length > 0 ? eligibleCandidates : participants;
    const ballCount = Math.min(32, Math.max(12, displayList.length));

    const newBalls: PhysicsBall[] = [];
    for (let i = 0; i < ballCount; i++) {
      const p = displayList[i % displayList.length];
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (cageRadius - 35);
      newBalls.push({
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 18,
        color: BALL_COLORS[i % BALL_COLORS.length],
        number: p ? p.sequence : i + 1,
      });
    }
    ballsRef.current = newBalls;

    let rotationAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const isSpinning = isSpinningRef.current;
      rotationAngle += isSpinning ? 0.08 : 0.005;

      // Outer Cage background gradient with cyber blue/cyan tint
      const cageGradient = ctx.createRadialGradient(
        centerX - 40,
        centerY - 50,
        20,
        centerX,
        centerY,
        cageRadius
      );
      cageGradient.addColorStop(0, 'rgba(14, 165, 233, 0.3)');
      cageGradient.addColorStop(0.65, 'rgba(15, 23, 42, 0.5)');
      cageGradient.addColorStop(1, 'rgba(6, 182, 212, 0.25)');

      // Draw drum interior
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, cageRadius, 0, Math.PI * 2);
      ctx.fillStyle = cageGradient;
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#06B6D4';
      ctx.stroke();

      // Drum metallic tech ribs
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      for (let a = 0; a < 6; a++) {
        const rad = rotationAngle + (a * Math.PI) / 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, cageRadius - 4, rad, rad + 0.3);
        ctx.stroke();
      }

      // Update and draw physics balls
      const balls = ballsRef.current;
      const speedMult = isSpinning ? 4.6 : 0.8;
      const gravity = isSpinning ? 0.05 : 0.18;

      balls.forEach((b) => {
        b.vy += gravity;
        b.x += b.vx * speedMult;
        b.y += b.vy * speedMult;

        if (isSpinning) {
          const dx = b.x - centerX;
          const dy = b.y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          b.vx += (-dy / dist) * 0.42 + (Math.random() - 0.5) * 0.6;
          b.vy += (dx / dist) * 0.42 + (Math.random() - 0.5) * 0.6;
        }

        const dx = b.x - centerX;
        const dy = b.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = cageRadius - b.radius;

        if (dist > maxDist) {
          const nx = dx / dist;
          const ny = dy / dist;
          b.x = centerX + nx * maxDist;
          b.y = centerY + ny * maxDist;

          const dot = b.vx * nx + b.vy * ny;
          b.vx = (b.vx - 2 * dot * nx) * 0.75;
          b.vy = (b.vy - 2 * dot * ny) * 0.75;
          b.vx += (Math.random() - 0.5) * 0.5;
        }

        b.vx *= 0.99;
        b.vy *= 0.99;

        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);

        const ballGrad = ctx.createRadialGradient(
          b.x - b.radius * 0.35,
          b.y - b.radius * 0.35,
          b.radius * 0.1,
          b.x,
          b.y,
          b.radius
        );
        ballGrad.addColorStop(0, '#FFFFFF');
        ballGrad.addColorStop(0.3, b.color);
        ballGrad.addColorStop(1, '#020617');

        ctx.fillStyle = ballGrad;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;
        ctx.fill();

        // Inner number circle
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fill();

        ctx.fillStyle = '#EF4444'; // Bright Red ball number display
        ctx.font = '900 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(b.number).slice(-3), b.x, b.y);

        ctx.restore();
      });

      // Glass front reflection shine
      const shineGrad = ctx.createLinearGradient(centerX - 100, centerY - 140, centerX + 60, centerY);
      shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      shineGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.08)');
      shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, cageRadius - 4, Math.PI * 1.05, Math.PI * 1.75);
      ctx.lineTo(centerX - 20, centerY - 20);
      ctx.closePath();
      ctx.fillStyle = shineGrad;
      ctx.fill();

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [eligibleCandidates.length, participants]);

  // Step 1: Trigger Ball Draw
  const handleDrawBall = () => {
    if (isDrawing) return;

    if (remainingTotalPrizes <= 0) {
      setToastMessage('所有獎項名額均已全數抽完！請先在「獎項設定」中新增獎項或擴充名額。');
      return;
    }

    if (eligibleCandidates.length === 0) {
      setToastMessage('所有符合條件的人員均已中獎！若允許重複中獎，請在右上角開啟「允許重複中獎」開關。');
      return;
    }

    setIsDrawing(true);
    isSpinningRef.current = true;

    // Realistic tension snare drum roll
    soundManager.playDrumRoll(2000);

    const randomIndex = Math.floor(Math.random() * eligibleCandidates.length);
    const selectedWinner = eligibleCandidates[randomIndex];
    const chosenColor = BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)];

    setTimeout(() => {
      soundManager.playBallPop();
      isSpinningRef.current = false;

      setPoppedBall({
        number: selectedWinner.sequence,
        color: chosenColor,
        participant: selectedWinner,
      });

      setTimeout(() => {
        // Triumphant fanfare & cymbal crash + dual confetti cannons
        soundManager.playCelebration();
        fireBallCelebrationConfetti();
        setIsDrawing(false);
      }, 850);
    }, 1900);
  };

  // Move to Step 2: Open Prize Drawing Screen
  const handleProceedToPrizeDraw = () => {
    setShowPrizeModal(true);
  };

  // Re-draw person (forfeit current person)
  const handleRedrawBall = () => {
    setShowPrizeModal(false);
    setPoppedBall(null);
    setTimeout(() => {
      handleDrawBall();
    }, 200);
  };

  // Final winner confirmed
  const handleConfirmWinner = (winner: WinnerRecord) => {
    onWinnerDrawn(winner);
    setPoppedBall(null);
    setShowPrizeModal(false);
  };

  return (
    <div id="ball-machine-container" className="relative flex flex-col items-center justify-between w-full max-w-5xl mx-auto py-3 px-4 select-none">
      {/* Top Prize & Remaining Quota Overview Banner */}
      <div
        id="lottery-prizes-overview-banner"
        className="w-full bg-[#09153a]/90 backdrop-blur-md px-4 py-3.5 sm:px-5 sm:py-4 rounded-2xl border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.18)] mb-4 text-white"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-cyan-500/20">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Award className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm sm:text-base font-black text-white tracking-wide flex items-center gap-2">
              各獎項及剩餘名額
            </h2>
          </div>
          <div className="text-xs font-semibold text-cyan-200/80 flex items-center gap-3">
            <span>總獎額：<strong className="text-white font-mono">{totalPrizeQuota}</strong> 名</span>
            <span className="text-cyan-600">•</span>
            <span>全場剩餘：<strong className="text-amber-400 font-mono text-sm font-black">{remainingTotalPrizes}</strong> 名</span>
          </div>
        </div>

        {/* Prize list with individual remaining quota badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
          {prizes.map((p) => {
            const wonCount = winners.filter((w) => w.prizeId === p.id).length;
            const remaining = Math.max(0, p.quota - wonCount);
            const isFinished = remaining === 0;

            return (
              <div
                key={p.id}
                className={`relative p-2.5 rounded-xl border transition flex flex-col justify-between ${
                  isFinished
                    ? 'bg-[#07112e]/70 border-slate-700/60 opacity-60'
                    : 'bg-[#0c1a47] hover:bg-[#102258] border-cyan-500/40 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-black text-white truncate max-w-[105px]"
                      style={{ backgroundColor: p.color || '#06B6D4' }}
                    >
                      {p.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">
                      {wonCount}/{p.quota}
                    </span>
                  </div>
                  <div className="text-xs text-cyan-100 font-medium truncate mb-2" title={p.content}>
                    {p.content}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-cyan-500/20 mt-auto">
                  <span className="text-[10px] text-slate-400">剩餘</span>
                  {isFinished ? (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[11px] font-bold">
                      已抽完
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-xs font-black shadow-[0_0_8px_rgba(16,185,129,0.25)]">
                      剩 {remaining} 名
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Controller Bar - Tech Cyber Blue */}
      <div id="lottery-top-bar" className="w-full flex flex-wrap items-center justify-between gap-3 bg-[#09153a]/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] mb-4 text-white">
        {/* Step Indicator & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <Dices className="w-3.5 h-3.5 text-cyan-400" />
              第 1 步：球箱抽號碼
            </span>
            <span className="text-cyan-600">→</span>
            <span className="px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700 font-bold text-xs flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-slate-400" />
              第 2 步：抽獎項畫面
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-[#0c1a47] border border-cyan-500/20 text-cyan-200 font-medium">
              剩餘總獎項：<strong className="text-amber-400 font-bold">{remainingTotalPrizes}</strong> / {totalPrizeQuota} 名
            </span>
          </div>
        </div>

        {/* Quick Utility Tools */}
        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-repeat"
            onClick={onToggleRepeat}
            disabled={isDrawing}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
              allowRepeat
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="開啟後已中獎者可繼續參與後續抽獎"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {allowRepeat ? '可重複中獎: 開' : '不可重複中獎'}
          </button>

          <button
            id="btn-sound-toggle"
            onClick={handleToggleMute}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            title={isMuted ? '開啟音效' : '靜音'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            id="btn-fullscreen-toggle"
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            title={isFullscreen ? '結束全螢幕' : '全螢幕放映'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Stage: Machine + Action Banner */}
      <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-8 my-2">
        {/* Left / Center: The 3D Cyber Ball Drum Machine */}
        <div className="relative flex flex-col items-center">
          {/* Ejection Top Hatch / Chute */}
          <div className="relative z-10 w-28 h-7 bg-gradient-to-b from-cyan-500 to-blue-700 rounded-t-xl border-x-2 border-t-2 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center justify-center">
            <div className="w-16 h-2 bg-[#050b1e] rounded-full shadow-inner" />
          </div>

          {/* Transparent Glass Sphere Drum with Stand */}
          <div
            id="lottery-ball-cage"
            onClick={!isDrawing ? handleDrawBall : undefined}
            className={`relative group cursor-pointer p-3 rounded-full transition-transform duration-300 ${
              isDrawing ? 'scale-102 ring-8 ring-cyan-400/40' : 'hover:scale-102'
            }`}
            style={{
              background: 'radial-gradient(circle, #0c1a47 15%, #07112e 70%, #030717 100%)',
              boxShadow: '0 0 50px -10px rgba(6, 182, 212, 0.4), inset 0 0 30px rgba(6, 182, 212, 0.2)',
            }}
          >
            <canvas
              ref={canvasRef}
              className="w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] rounded-full drop-shadow-md"
            />

            {!isDrawing && !poppedBall && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-[#050b1e]/90 backdrop-blur-xs text-cyan-300 px-4 py-2 rounded-full font-bold text-sm shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center gap-2 border border-cyan-400/60 animate-pulse">
                  <Dices className="w-4 h-4 text-cyan-400" />
                  點選球箱抽出一顆球號
                </div>
              </div>
            )}

            {/* Glowing outer neon ring */}
            <div className="absolute inset-0 rounded-full border-4 border-cyan-400/80 pointer-events-none shadow-[0_0_20px_rgba(6,182,212,0.5)]" />
          </div>

          {/* Machine Pedestal - Titanium Alloy with Cyan LED */}
          <div className="relative -mt-4 w-72 h-14 bg-gradient-to-b from-[#0e1e4a] via-[#09153a] to-[#04091a] rounded-b-3xl border-t-4 border-cyan-400 shadow-[0_10px_25px_rgba(0,0,0,0.6)] flex items-center justify-center px-6">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-mono font-bold tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping mr-1" />
              <span>★ CYBER LOTTERY MATRIX ★</span>
            </div>
          </div>

          {/* Counter summary */}
          <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              球箱候選數：<strong className="text-white">{eligibleCandidates.length}</strong> 顆
            </span>
            <span className="text-slate-600">•</span>
            <span>
              總抽獎名額：<strong className="text-slate-200">{participants.length}</strong> 人
            </span>
          </div>
        </div>

        {/* Right: Flow Guidance & Big Action Button */}
        <div className="w-full lg:w-96 flex flex-col items-center lg:items-stretch gap-4">
          {/* Game Flow Card */}
          <div className="w-full bg-[#09153a]/90 rounded-2xl p-6 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] text-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                兩階段科技抽獎
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                全場連線模式
              </span>
            </div>

            {/* Step List */}
            <div className="space-y-3 mb-4">
              <div className="p-3.5 rounded-xl bg-[#0c1a47] border border-cyan-500/40 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                  1
                </span>
                <div>
                  <div className="text-xs font-black text-cyan-300">第一次：球箱滾動跳序號</div>
                  <div className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    幸運人員
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#07112e] border border-slate-800 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <div className="text-xs font-black text-slate-200">第二次：抽獎項輪盤</div>
                  <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    幸運獎項
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-medium bg-[#060e26] p-3 rounded-xl border border-slate-800">
              🎁 目前總計 <strong className="text-cyan-300">{prizes.length}</strong> 項獎品，剩餘{' '}
              <strong className="text-amber-400">{remainingTotalPrizes}</strong> 個名額。
            </div>
          </div>

          {/* Toast Message Alert */}
          {toastMessage && (
            <div className="w-full p-4 rounded-2xl bg-rose-950/90 border border-rose-500/60 text-rose-200 text-sm font-semibold flex items-center justify-between gap-2 shadow-[0_0_25px_rgba(244,63,94,0.35)]">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{toastMessage}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="px-2.5 py-1 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-white text-xs cursor-pointer shrink-0"
              >
                關閉
              </button>
            </div>
          )}

          {/* Giant Launch Button (Step 1) */}
          <button
            id="btn-draw-ball"
            onClick={handleDrawBall}
            disabled={isDrawing || remainingTotalPrizes <= 0 || eligibleCandidates.length === 0}
            className={`w-full py-5 px-8 rounded-2xl text-xl font-black tracking-wide text-white shadow-[0_0_30px_rgba(6,182,212,0.35)] transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer ${
              isDrawing
                ? 'bg-cyan-700 animate-pulse cursor-wait'
                : remainingTotalPrizes <= 0
                ? 'bg-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] active:scale-98'
            }`}
          >
            <Dices className={`w-7 h-7 ${isDrawing ? 'animate-spin' : ''}`} />
            {isDrawing
              ? '✨ 球箱高速攪拌中...'
              : remainingTotalPrizes <= 0
              ? '所有獎項已抽完'
              : '第 1 步：點選球箱跳出球號'}
          </button>

          <div className="text-center text-xs text-cyan-300/80 font-medium">
            💡 提示：點擊上方科技透明球箱或大按鈕，隨機彈出幸運球號！
          </div>
        </div>
      </div>

      {/* STEP 1 MODAL: POPPED BALL & WINNER REVEAL */}
      <AnimatePresence>
        {poppedBall && !showPrizeModal && (
          <motion.div
            id="ball-reveal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#030717]/90 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.2, y: 150, rotate: -20 }}
              animate={{
                scale: 1,
                y: 0,
                rotate: 0,
                transition: { type: 'spring', damping: 14, stiffness: 120 },
              }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#09153a] rounded-3xl p-8 text-center shadow-[0_0_60px_rgba(6,182,212,0.4)] border-2 border-cyan-400 text-white overflow-hidden"
            >
              {/* Radial celebration burst behind */}
              <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

              {/* Step indicator header */}
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 font-black text-xs uppercase tracking-wider mb-6 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                第 1 步完成：球號彈出！
              </div>

              {/* Emerging Ball Animation - Bright Red Ball & Vivid Red Number */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: 720 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="relative w-36 h-36 rounded-full flex flex-col items-center justify-center shadow-[0_0_35px_rgba(239,68,68,0.7)] ring-4 ring-red-400"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, #ffffff 0%, #ef4444 55%, #991b1b 100%)`,
                  }}
                >
                  <span className="text-[11px] uppercase font-mono tracking-widest text-white/95 font-bold drop-shadow-xs">
                    幸運球號
                  </span>
                  <div className="w-24 h-14 bg-white rounded-2xl flex items-center justify-center shadow-[inset_0_2px_6px_rgba(0,0,0,0.15)] mt-1 border-2 border-red-200">
                    <span className="text-4xl font-black text-red-600 font-mono tracking-tight drop-shadow-xs">
                      #{poppedBall.number}
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Winner Name & Department */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
                  ★ 恭喜對應人員抽中大獎資格 ★
                </div>
                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2 drop-shadow-md">
                  {poppedBall.participant.name}
                </h1>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#0c1a47] text-cyan-200 font-bold text-base mb-6 border border-cyan-500/30 shadow-inner">
                  <span>部門：{poppedBall.participant.department}</span>
                  <span className="text-cyan-600">•</span>
                  <span className="flex items-center gap-1">
                    序號 / 球號：
                    <strong className="text-red-400 font-black font-mono text-lg">#{poppedBall.participant.sequence}</strong>
                  </span>
                </div>
              </motion.div>

              <div className="text-xs text-cyan-300 font-semibold bg-cyan-950/50 p-3 rounded-xl border border-cyan-500/30 mb-6">
                ✨ 幸運兒已出爐！請中獎同仁上前，點擊下方按鈕抽取專屬大獎！
              </div>

              {/* Step 1 Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  id="btn-redraw-absent"
                  onClick={handleRedrawBall}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="若中獎人不在場，可棄權重新抽下一顆球號"
                >
                  <RotateCcw className="w-4 h-4 text-cyan-400" />
                  不在場 / 重新抽球號
                </button>

                <button
                  id="btn-proceed-to-step2"
                  onClick={handleProceedToPrizeDraw}
                  className="w-full flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-base shadow-[0_0_25px_rgba(6,182,212,0.4)] transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Award className="w-5 h-5" />
                  第二步：點我抽獎項！
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STEP 2 MODAL: PRIZE DRAWING SCREEN */}
      <PrizeDrawModal
        isOpen={showPrizeModal && poppedBall !== null}
        participant={poppedBall?.participant || null}
        ballNumber={poppedBall?.number || ''}
        ballColor={poppedBall?.color}
        prizes={prizes}
        winners={winners}
        onConfirmWinner={handleConfirmWinner}
        onRedrawPerson={handleRedrawBall}
        onClose={() => {
          setShowPrizeModal(false);
          setPoppedBall(null);
        }}
      />
    </div>
  );
};
