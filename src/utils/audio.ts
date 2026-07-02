/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple audio synthesizer using native Web Audio API to prevent heavy external assets.
let audioCtx: AudioContext | null = null;
let isSoundEnabled = true;

export function setSoundEnabled(enabled: boolean) {
  isSoundEnabled = enabled;
}

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a pleasant success chime
 */
export function playSuccessSound() {
  if (!isSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // First note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second note (slightly delayed)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.1); // E5
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.08, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc2.start(now + 0.1);
    osc2.stop(now + 0.5);
  } catch (e) {
    console.warn('Audio play blocked or unsupported:', e);
  }
}

/**
 * Plays a warm, soft failure beep
 */
export function playFailureSound() {
  if (!isSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now); // A3 (low)
    gain.gain.setValueAtTime(0.12, now);
    
    // Quick double beep effect or quick ramp down
    gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
    
    osc.start(now);
    osc.stop(now + 0.15);

    // Second low beep
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(196, now + 0.15); // G3
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.12, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.001, now + 0.3);

    osc2.start(now + 0.15);
    osc2.stop(now + 0.3);
  } catch (e) {
    console.warn('Audio play blocked or unsupported:', e);
  }
}

/**
 * Plays a light, subtle UI interaction sound
 */
export function playClickSound() {
  if (!isSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.start(now);
    osc.stop(now + 0.1);
  } catch (e) {
    // Silent fail
  }
}
