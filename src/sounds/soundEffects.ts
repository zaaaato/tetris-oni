import { GAME_CONFIG } from '../game/config';

// Audio Contextのシングルトン
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * ビープ音を生成
 */
function playBeep(frequency: number, duration: number, type: OscillatorType = 'sine') {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(GAME_CONFIG.SOUND_VOLUME, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

/**
 * 複数の周波数を同時に鳴らす
 */
function playChord(frequencies: number[], duration: number) {
  frequencies.forEach(freq => playBeep(freq, duration, 'sine'));
}

/**
 * 移動音
 */
export function playMoveSound() {
  playBeep(200, 0.05, 'square');
}

/**
 * ハードドロップ音
 */
export function playDropSound() {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.setValueAtTime(400, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
  oscillator.type = 'sawtooth';

  gainNode.gain.setValueAtTime(GAME_CONFIG.SOUND_VOLUME, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.2);
}

/**
 * ライン消去音
 */
export function playClearSound(linesCleared: number) {
  const baseFrequencies = [
    [523.25], // 1ライン: C5
    [523.25, 659.25], // 2ライン: C5, E5
    [523.25, 659.25, 783.99], // 3ライン: C5, E5, G5
    [523.25, 659.25, 783.99, 1046.50], // 4ライン: C5, E5, G5, C6
  ];

  const frequencies = baseFrequencies[Math.min(linesCleared - 1, 3)] || [523.25];
  playChord(frequencies, 0.3);
}

/**
 * ゲームオーバー音
 */
export function playGameOverSound() {
  const notes = [
    { freq: 523.25, time: 0 },      // C5
    { freq: 493.88, time: 0.15 },   // B4
    { freq: 466.16, time: 0.3 },    // A#4
    { freq: 440.00, time: 0.45 },   // A4
    { freq: 392.00, time: 0.6 },    // G4
  ];

  notes.forEach(note => {
    setTimeout(() => {
      playBeep(note.freq, 0.3, 'triangle');
    }, note.time * 1000);
  });
}

/**
 * レベルアップ音
 */
export function playLevelUpSound() {
  const notes = [
    { freq: 523.25, time: 0 },      // C5
    { freq: 659.25, time: 0.1 },    // E5
    { freq: 783.99, time: 0.2 },    // G5
    { freq: 1046.50, time: 0.3 },   // C6
  ];

  notes.forEach(note => {
    setTimeout(() => {
      playBeep(note.freq, 0.15, 'sine');
    }, note.time * 1000);
  });
}

/**
 * ロック音（テトリミノが固定されたとき）
 */
export function playLockSound() {
  playBeep(150, 0.1, 'square');
}
