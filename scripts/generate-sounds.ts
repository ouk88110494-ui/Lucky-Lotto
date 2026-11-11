import fs from 'fs';
import path from 'path';

// Helper to write a 16-bit mono/stereo PCM WAV file
function createWavFile(sampleRate: number, channels: number, samples: Float32Array[]): Buffer {
  const numSamples = samples[0].length;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // audioFormat (1 for PCM)
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // bitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < channels; ch++) {
      let s = samples[ch][i];
      // Hard clipping / clamp
      if (s > 1) s = 1;
      if (s < -1) s = -1;
      // Convert float [-1.0, 1.0] to 16-bit PCM integer [-32768, 32767]
      const intSample = s < 0 ? Math.floor(s * 32768) : Math.floor(s * 32767);
      buffer.writeInt16LE(intSample, offset);
      offset += 2;
    }
  }

  return buffer;
}

const sampleRate = 44100;

// 1. Generate Spin Roll (Lottery Drum Roll & Ball Rattle) - 2.8 seconds
function generateSpinRoll(): Buffer {
  const duration = 2.8;
  const numSamples = Math.floor(sampleRate * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  // White noise generator
  const noise = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    noise[i] = Math.random() * 2 - 1;
  }

  // Snare drum roll hits (~28 hits/sec building up)
  const hitInterval = Math.floor(sampleRate * 0.035);
  for (let h = 0; h < numSamples; h += hitInterval) {
    const progress = h / numSamples;
    const hitAmp = 0.08 + Math.pow(progress, 1.6) * 0.35;
    const hitLen = Math.floor(sampleRate * 0.038);

    for (let k = 0; k < hitLen && (h + k) < numSamples; k++) {
      const idx = h + k;
      const decay = Math.exp(-k / (sampleRate * 0.008));
      const nVal = noise[idx] * hitAmp * decay;
      // Body tone: low freq sine
      const bodyFreq = 140 + progress * 70;
      const bVal = Math.sin(2 * Math.PI * bodyFreq * (k / sampleRate)) * (hitAmp * 0.8) * Math.exp(-k / (sampleRate * 0.015));

      const pan = 0.5 + (Math.sin(h * 0.05) * 0.3);
      left[idx] += (nVal + bVal) * (1 - pan);
      right[idx] += (nVal + bVal) * pan;
    }
  }

  // Ball rolling / clicking in cage (random clicks)
  for (let i = 0; i < 90; i++) {
    const clickStart = Math.floor(Math.random() * (numSamples - 2000));
    const clickLen = Math.floor(sampleRate * 0.015);
    const clickFreq = 1200 + Math.random() * 800;
    const amp = 0.15 + (clickStart / numSamples) * 0.15;

    for (let k = 0; k < clickLen; k++) {
      const idx = clickStart + k;
      const env = Math.exp(-k / (sampleRate * 0.003));
      const s = Math.sin(2 * Math.PI * clickFreq * (k / sampleRate)) * amp * env;
      left[idx] += s * 0.6;
      right[idx] += s * 0.6;
    }
  }

  return createWavFile(sampleRate, 2, [left, right]);
}

// 2. Generate Ball Pop (Launch Sound) - 0.4 seconds
function generateBallPop(): Buffer {
  const duration = 0.4;
  const numSamples = Math.floor(sampleRate * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Frequency sweep from 240Hz rapidly up to 1300Hz then dropping
    const freq = 240 + 1100 * Math.sin(Math.min(1, t / 0.12) * (Math.PI / 2)) * Math.exp(-t * 6);
    const env = Math.exp(-t * 9);
    const wave = Math.sin(2 * Math.PI * freq * t) * 0.7 * env;
    // Add bright woodclick harmonic
    const click = (Math.random() * 2 - 1) * Math.exp(-t * 40) * 0.4;

    left[i] = wave + click;
    right[i] = wave + click;
  }

  return createWavFile(sampleRate, 2, [left, right]);
}

// 3. Generate Winner Fanfare (Celebration Fanfare + Cymbal + Chime) - 3.2 seconds
function generateWinnerFanfare(): Buffer {
  const duration = 3.2;
  const numSamples = Math.floor(sampleRate * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  // Cymbal crash at start (noise with highpass and long decay)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const cymbalDecay = Math.exp(-t * 2.2);
    const noiseVal = (Math.random() * 2 - 1) * 0.45 * cymbalDecay;
    left[i] += noiseVal;
    right[i] += noiseVal;
  }

  // Brass Fanfare chords: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
  const notes = [
    { start: 0.05, dur: 0.22, freq: 523.25 }, // C5
    { start: 0.24, dur: 0.22, freq: 659.25 }, // E5
    { start: 0.44, dur: 0.26, freq: 783.99 }, // G5
    // Grand Chord at 0.7s
    { start: 0.68, dur: 2.2, freq: 523.25 },  // C5
    { start: 0.68, dur: 2.2, freq: 659.25 },  // E5
    { start: 0.68, dur: 2.2, freq: 783.99 },  // G5
    { start: 0.68, dur: 2.2, freq: 1046.50 }, // C6
    { start: 0.70, dur: 2.2, freq: 1318.51 }, // E6 sparkle
  ];

  notes.forEach((n) => {
    const startSample = Math.floor(n.start * sampleRate);
    const durSamples = Math.floor(n.dur * sampleRate);

    for (let k = 0; k < durSamples && (startSample + k) < numSamples; k++) {
      const idx = startSample + k;
      const t = k / sampleRate;
      const env = Math.exp(-t / (n.dur * 0.6));
      // Rich brass: fundamental + 2nd harmonic + 3rd harmonic
      const wave = (
        Math.sin(2 * Math.PI * n.freq * t) * 0.4 +
        Math.sin(2 * Math.PI * (n.freq * 2) * t) * 0.25 +
        Math.sin(2 * Math.PI * (n.freq * 3) * t) * 0.12
      ) * env * 0.35;

      left[idx] += wave;
      right[idx] += wave;
    }
  });

  // Sparkle Bell Arpeggio at 0.8s
  const bells = [1567.98, 1760.00, 2093.00, 2637.02, 3135.96];
  bells.forEach((freq, bi) => {
    const bStart = Math.floor((0.75 + bi * 0.08) * sampleRate);
    const bLen = Math.floor(1.2 * sampleRate);

    for (let k = 0; k < bLen && (bStart + k) < numSamples; k++) {
      const idx = bStart + k;
      const t = k / sampleRate;
      const env = Math.exp(-t * 4);
      const chime = Math.sin(2 * Math.PI * freq * t) * 0.15 * env;
      const pan = (bi % 2 === 0) ? 0.3 : 0.7;
      left[idx] += chime * (1 - pan);
      right[idx] += chime * pan;
    }
  });

  return createWavFile(sampleRate, 2, [left, right]);
}

// Ensure sounds folder exists
const soundsDir = path.resolve(process.cwd(), 'public', 'sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

fs.writeFileSync(path.join(soundsDir, 'spin_roll.wav'), generateSpinRoll());
fs.writeFileSync(path.join(soundsDir, 'ball_pop.wav'), generateBallPop());
fs.writeFileSync(path.join(soundsDir, 'winner_fanfare.wav'), generateWinnerFanfare());

console.log('Successfully generated audio sound files in public/sounds/');
