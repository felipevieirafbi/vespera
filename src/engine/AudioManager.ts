/**
 * Procedural Audio Manager using Native Web Audio API (No external assets/mp3)
 * Synthesizes pure retro/synthwave sound effects:
 * - Dash: Quick white noise burst with rapid exponential fade out (swoosh)
 * - Attack (Sword): High-pitched sharp cutting sweep (sawtooth/square down pitch)
 * - Damage (Hit): Low distorted square punch
 * - Rupture: Sub-bass rumble lasting ~2.5s with low tremolo
 * - Interaction/Victory: Crystalline sine arpeggio / chord chime
 */

export class AudioManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazily initialized upon user interaction to respect browser autoplay policies
  }

  /**
   * Resumes or creates the Web Audio Context after user gesture (e.g. clicking 'Despertar')
   */
  public async resume(): Promise<void> {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn('Could not resume AudioContext:', err);
      }
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * DASH SOUND:
   * White noise burst passed through a Bandpass filter with a sharp exponential gain envelope
   */
  public playDash(): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;
      const duration = 0.14; // 140ms swoosh

      // 1. Create White Noise buffer
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      // 2. Bandpass filter for wind / air displacement whoosh
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + duration);
      filter.Q.setValueAtTime(3.5, now);

      // 3. Gain Envelope
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.28, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + duration);
    } catch (e) {
      console.warn('Error playing dash sound:', e);
    }
  }

  /**
   * ATTACK (SWORD) SOUND:
   * Sawtooth + Square oscillator rapidly descending in pitch from 950Hz to 120Hz
   */
  public playAttack(): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;
      const duration = 0.11; // 110ms cutting slash

      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';

      // Sharp blade pitch dive
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + duration);

      // Filter to take off harsh top edge
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3500, now);
      filter.frequency.exponentialRampToValueAtTime(600, now + duration);

      // Snappy Gain Envelope
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Error playing attack sound:', e);
    }
  }

  /**
   * DAMAGE (HIT) SOUND:
   * Low distorted square wave with fast pitch drop and crunch
   */
  public playHit(): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;
      const duration = 0.16;

      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Error playing hit sound:', e);
    }
  }

  /**
   * RUPTURA SOUND (Glass Storm / Reality Collapse):
   * Deep sub-bass (45Hz) with harmonic modulation and 2.5s sustained spatial decay
   */
  public playRupture(): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;
      const duration = 2.6;

      // Sub-bass primary drone
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(55, now);
      subOsc.frequency.linearRampToValueAtTime(35, now + duration);

      // Tremolo / wobble LFO
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(6, now);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(12, now);
      lfo.connect(lfoGain);
      lfoGain.connect(subOsc.frequency);

      // Main Gain envelope with crescendo and rumbling tail
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      subOsc.connect(gain);
      gain.connect(this.ctx.destination);

      subOsc.start(now);
      lfo.start(now);
      subOsc.stop(now + duration);
      lfo.stop(now + duration);
    } catch (e) {
      console.warn('Error playing rupture sound:', e);
    }
  }

  /**
   * INTERACTION / DIALOGUE / SOUL AWAKEN SOUND:
   * Ethereal crystalline sine arpeggio (C5 -> E5 -> G5 -> B5)
   */
  public playInteraction(): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 987.77]; // C5, E5, G5, B5

      notes.forEach((freq, index) => {
        const noteStart = now + index * 0.055;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.01, noteStart);
        gain.gain.linearRampToValueAtTime(0.18, noteStart + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.35);
      });
    } catch (e) {
      console.warn('Error playing interaction sound:', e);
    }
  }

  /**
   * BOSS SHOOT SOUND:
   * Crimson energy projectile pulse (320Hz down to 80Hz)
   */
  public playBossShoot(): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;
      const duration = 0.2;

      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + duration);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Error playing boss shoot sound:', e);
    }
  }

  /**
   * BOSS DEFEAT & VICTORY CHIME:
   * Multi-octave celestial chime arpeggio + triumphant harmonic bloom
   */
  public playVictory(): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;
      const chord = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5]; // C major across 2 octaves

      chord.forEach((freq, idx) => {
        const noteStart = now + idx * 0.08;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.01, noteStart);
        gain.gain.linearRampToValueAtTime(0.22, noteStart + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 1.8);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 1.8);
      });
    } catch (e) {
      console.warn('Error playing victory sound:', e);
    }
  }

  /**
   * MEMORY DUST COLLECT SOUND:
   * Quick sparkling twin chime (E6 -> B6) with gentle crystal reverb feel
   */
  public playDustCollect(): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [1318.51, 1975.53]; // E6, B6

      freqs.forEach((freq, idx) => {
        const noteStart = now + idx * 0.04;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.01, noteStart);
        gain.gain.linearRampToValueAtTime(0.12, noteStart + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.22);
      });
    } catch (e) {
      console.warn('Error playing dust sound:', e);
    }
  }

  /**
   * FORGE UPGRADE PURCHASE SOUND:
   * Heavy resonant metallic chime + ethereal soul resonance (Anvil impact)
   */
  public playUpgradeBuy(): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;

      // 1. Anvil strike strike (square + lowpass)
      const anvil = this.ctx.createOscillator();
      anvil.type = 'triangle';
      anvil.frequency.setValueAtTime(440, now);
      anvil.frequency.exponentialRampToValueAtTime(110, now + 0.3);

      const anvilGain = this.ctx.createGain();
      anvilGain.gain.setValueAtTime(0.3, now);
      anvilGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      anvil.connect(anvilGain);
      anvilGain.connect(this.ctx.destination);

      anvil.start(now);
      anvil.stop(now + 0.35);

      // 2. Cosmic shimmer resonance
      const notes = [659.25, 830.61, 987.77, 1318.51]; // E major chord
      notes.forEach((freq, idx) => {
        const noteStart = now + 0.05 + idx * 0.06;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.01, noteStart);
        gain.gain.linearRampToValueAtTime(0.15, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.6);
      });
    } catch (e) {
      console.warn('Error playing upgrade sound:', e);
    }
  }

  /**
   * PORTAL WARP SOUND:
   * Upward frequency glide sweep into space
   */
  public playPortalWarp(): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;
      const duration = 0.55;

      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + duration * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Error playing portal warp sound:', e);
    }
  }

  /**
   * BOON SELECT SOUND (Phase 9):
   * Sparkling ethereal divine chord arpeggio
   */
  public playBoonSelect(): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;
      // F# minor pentatonic celestial shimmer (587.33, 739.99, 880.00, 1174.66, 1479.98)
      const frequencies = [587.33, 739.99, 880.0, 1174.66, 1479.98];

      frequencies.forEach((freq, idx) => {
        const noteStart = now + idx * 0.055;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.01, noteStart);
        gain.gain.linearRampToValueAtTime(0.18, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.55);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.55);
      });
    } catch (e) {
      console.warn('Error playing boon select sound:', e);
    }
  }

  /**
   * GUNNER ENEMY SHOOT SOUND (Phase 9):
   * Sharp retro laser ping / plasma pulse
   */
  public playGunnerShoot(): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;
      const duration = 0.12;

      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + duration);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Error playing gunner shoot sound:', e);
    }
  }

  /**
   * SHATTERING DASH IMPACT (Phase 9):
   * Crisp crystal shatter impact when dash rams an enemy
   */
  public playShatterDash(): void {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;
      const duration = 0.18;

      // 1. Noise crunch
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1800, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + duration);

      // 2. Bright glass ring
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + duration);

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0.2, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Error playing shatter dash sound:', e);
    }
  }
}
