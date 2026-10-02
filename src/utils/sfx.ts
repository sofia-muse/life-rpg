export type SfxId = 'click' | 'questComplete' | 'levelUp' | 'bossHit' | 'raidEnter';

type OscillatorKind = 'sine' | 'square' | 'triangle' | 'sawtooth';

interface Tone {
  freq: number;
  dur: number;
  type: OscillatorKind;
  gain: number;
  delay?: number;
}

const PRESETS: Record<SfxId, Tone[]> = {
  click: [{ freq: 640, dur: 0.045, type: 'square', gain: 0.035 }],
  questComplete: [
    { freq: 523, dur: 0.08, type: 'triangle', gain: 0.055 },
    { freq: 659, dur: 0.1, type: 'triangle', gain: 0.05, delay: 0.07 },
    { freq: 784, dur: 0.14, type: 'triangle', gain: 0.045, delay: 0.15 },
  ],
  levelUp: [
    { freq: 392, dur: 0.09, type: 'sawtooth', gain: 0.03 },
    { freq: 523, dur: 0.11, type: 'triangle', gain: 0.045, delay: 0.08 },
    { freq: 784, dur: 0.18, type: 'triangle', gain: 0.05, delay: 0.18 },
  ],
  bossHit: [
    { freq: 110, dur: 0.09, type: 'square', gain: 0.05 },
    { freq: 180, dur: 0.06, type: 'square', gain: 0.03, delay: 0.04 },
  ],
  raidEnter: [
    { freq: 220, dur: 0.1, type: 'triangle', gain: 0.045 },
    { freq: 330, dur: 0.14, type: 'triangle', gain: 0.04, delay: 0.1 },
  ],
};

type AudioContextCtor = typeof AudioContext;

function audioCtor(): AudioContextCtor | null {
  const host = globalThis as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };
  return host.AudioContext ?? host.webkitAudioContext ?? null;
}

let shared: AudioContext | null = null;

function context(): AudioContext | null {
  const Ctor = audioCtor();
  if (!Ctor) return null;
  if (!shared) shared = new Ctor();
  return shared;
}

/** Short synthesized UI tones. No-ops where Web Audio is unavailable (native without a context). */
export function playSfx(id: SfxId): void {
  try {
    const audio = context();
    if (!audio) return;
    if (audio.state === 'suspended') void audio.resume();
    const now = audio.currentTime;
    for (const tone of PRESETS[id]) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = tone.type;
      osc.frequency.value = tone.freq;
      const start = now + (tone.delay ?? 0);
      gain.gain.setValueAtTime(tone.gain, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.dur);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(start);
      osc.stop(start + tone.dur + 0.02);
    }
  } catch {
    // Audio is a comfort, never a hard dependency.
  }
}
