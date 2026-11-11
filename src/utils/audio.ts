// Realistic Lottery Sound System with Audio Files & Web Audio Dual Engine
import { EMBEDDED_SOUNDS } from './soundAssets';
import { safeStorage } from './storage';

type AudioListener = (state: { isMuted: boolean; volume: number }) => void;

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.85; // 0.0 ~ 1.0
  private listeners: Set<AudioListener> = new Set();
  private noiseBuffer: AudioBuffer | null = null;

  // Audio elements cache
  private spinAudio: HTMLAudioElement | null = null;
  private popAudio: HTMLAudioElement | null = null;
  private fanfareAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMute = safeStorage.getItem('lottery_app_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
      const savedVol = safeStorage.getItem('lottery_app_volume');
      if (savedVol !== null) {
        const parsed = parseFloat(savedVol);
        if (!isNaN(parsed)) this.volume = Math.max(0, Math.min(1, parsed));
      }
      this.initAudioElements();
    }
  }

  private initAudioElements() {
    try {
      this.spinAudio = new Audio(EMBEDDED_SOUNDS.spinRoll);
      this.spinAudio.preload = 'auto';

      this.popAudio = new Audio(EMBEDDED_SOUNDS.ballPop);
      this.popAudio.preload = 'auto';

      this.fanfareAudio = new Audio(EMBEDDED_SOUNDS.winnerFanfare);
      this.fanfareAudio.preload = 'auto';

      this.updateAudioVolumes();
    } catch {
      // Audio element initialization fallback
    }
  }

  private updateAudioVolumes() {
    if (this.spinAudio) this.spinAudio.volume = this.volume;
    if (this.popAudio) this.popAudio.volume = this.volume;
    if (this.fanfareAudio) this.fanfareAudio.volume = this.volume;
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Pre-generate noise buffer for realistic drum hits & snare rolls
  private getNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (this.noiseBuffer) return this.noiseBuffer;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return this.noiseBuffer;
  }

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    listener({ isMuted: this.isMuted, volume: this.volume });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l({ isMuted: this.isMuted, volume: this.volume }));
  }

  public setMuted(muted: boolean): boolean {
    this.isMuted = muted;
    safeStorage.setItem('lottery_app_muted', String(this.isMuted));
    if (this.isMuted) {
      this.stopAll();
    }
    this.notify();
    return this.isMuted;
  }

  public toggleMute(): boolean {
    return this.setMuted(!this.isMuted);
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    safeStorage.setItem('lottery_app_volume', String(this.volume));
    this.updateAudioVolumes();
    this.notify();
  }

  public getVolume(): number {
    return this.volume;
  }

  public stopAll() {
    try {
      if (this.spinAudio) {
        this.spinAudio.pause();
        this.spinAudio.currentTime = 0;
      }
      if (this.popAudio) {
        this.popAudio.pause();
        this.popAudio.currentTime = 0;
      }
      if (this.fanfareAudio) {
        this.fanfareAudio.pause();
        this.fanfareAudio.currentTime = 0;
      }
    } catch {
      // ignore
    }
  }

  // Play audio file helper with clone fallback
  private playAudioFile(audio: HTMLAudioElement | null, fallbackFn: () => void) {
    if (this.isMuted) return;
    this.initCtx();

    if (audio) {
      try {
        audio.volume = this.volume;
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            fallbackFn();
          });
        }
      } catch {
        fallbackFn();
      }
    } else {
      fallbackFn();
    }
  }

  // 1. 抽獎轉動音效 (Spin Drumroll & Ball Rattle) - 音效文件 + 合成雙引擎
  public playDrumRoll(durationMs = 2600) {
    if (this.isMuted) return;
    this.playAudioFile(this.spinAudio, () => this.synthesizeDrumRoll(durationMs));
  }

  public playBallRoll(durationMs = 2600) {
    this.playDrumRoll(durationMs);
  }

  // 2. 球號彈出音效 (Ball Pop / Launch Sound)
  public playBallPop() {
    if (this.isMuted) return;
    this.playAudioFile(this.popAudio, () => this.synthesizeBallPop());
  }

  // 3. 中獎產生與揭曉音效 (Winner Fanfare / Celebration)
  public playCelebration() {
    if (this.isMuted) return;
    this.playAudioFile(this.fanfareAudio, () => this.synthesizeCelebration());
  }

  // 4. 按鈕點擊或轉盤刻度聲
  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(850, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.2 * this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // ignore
    }
  }

  // Fallback Synthesizer: Snare Drum crescendo roll
  private synthesizeDrumRoll(durationMs: number) {
    this.initCtx();
    if (!this.ctx) return;

    try {
      const noise = this.getNoiseBuffer();
      const startTime = this.ctx.currentTime;
      const totalHits = Math.floor(durationMs / 36);

      for (let i = 0; i < totalHits; i++) {
        const progress = i / totalHits;
        const hitTime = startTime + (i * 0.036) + (Math.random() * 0.006 - 0.003);
        const hitVolume = (0.08 + Math.pow(progress, 1.8) * 0.28) * this.volume;

        if (noise) {
          const noiseSrc = this.ctx.createBufferSource();
          noiseSrc.buffer = noise;
          const noiseFilter = this.ctx.createBiquadFilter();
          noiseFilter.type = 'highpass';
          noiseFilter.frequency.setValueAtTime(1100 + progress * 500, hitTime);

          const noiseGain = this.ctx.createGain();
          noiseGain.gain.setValueAtTime(hitVolume * 0.9, hitTime);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.03);

          noiseSrc.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(this.ctx.destination);

          noiseSrc.start(hitTime);
          noiseSrc.stop(hitTime + 0.032);
        }

        const bodyOsc = this.ctx.createOscillator();
        const bodyGain = this.ctx.createGain();
        bodyOsc.type = 'triangle';
        const baseFreq = 150 + progress * 60;
        bodyOsc.frequency.setValueAtTime(baseFreq, hitTime);
        bodyOsc.frequency.exponentialRampToValueAtTime(70, hitTime + 0.04);

        bodyGain.gain.setValueAtTime(hitVolume * 0.75, hitTime);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.04);

        bodyOsc.connect(bodyGain);
        bodyGain.connect(this.ctx.destination);

        bodyOsc.start(hitTime);
        bodyOsc.stop(hitTime + 0.045);
      }
    } catch {
      // ignore
    }
  }

  // Fallback Synthesizer: Ball pop
  private synthesizeBallPop() {
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(1150, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.25);

      gain.gain.setValueAtTime(0.45 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch {
      // ignore
    }
  }

  // Fallback Synthesizer: Fanfare celebration
  private synthesizeCelebration() {
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [
        { freq: 523.25, time: 0.05, dur: 0.20 }, // C5
        { freq: 659.25, time: 0.20, dur: 0.20 }, // E5
        { freq: 783.99, time: 0.35, dur: 0.24 }, // G5
        { freq: 1046.50, time: 0.55, dur: 1.5 }, // C6
        { freq: 783.99, time: 0.60, dur: 1.5 },  // G5 harmony
        { freq: 1318.51, time: 0.65, dur: 1.5 }, // E6 sparkle
      ];

      notes.forEach((n) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        gain.gain.setValueAtTime(0.3 * this.volume, now + n.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + n.time);
        osc.stop(now + n.time + n.dur);
      });
    } catch {
      // ignore
    }
  }
}

export const soundManager = new SoundManager();
