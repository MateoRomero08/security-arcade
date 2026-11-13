/**
 * Sintetizador de Audio Procedural Arcade (Web Audio API)
 *
 * Sin archivos de audio pesados en red (0 KB de payload).
 * Genera tonos retro-modernos en tiempo real, efectos comicos (burro/donkey)
 * y musica chiptune arcade en bucle para el lobby/menu.
 *
 * MUTE SPLIT:
 *   - toggleMute() / setMusicMuted() ONLY mutes lobby chiptune music.
 *   - ALL SFX (tap, correct, error, donkey, victory, shield, coin) always play
 *     regardless of mute state.
 */

class ArcadeSynth {
  private ctx: AudioContext | null = null;
  private musicMuted: boolean = false;
  private musicInterval: NodeJS.Timeout | null = null;
  private isMusicPlaying: boolean = false;

  constructor() {
    // Lazy init on first user gesture
  }

  private initCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // ─── Music mute controls (music only) ────────────────────────────────────

  /** Mute or unmute ONLY the arcade lobby music. SFX are unaffected. */
  public setMusicMuted(muted: boolean) {
    this.musicMuted = muted;
    if (muted) {
      this.stopLobbyMusic();
    }
  }

  /** @deprecated alias kept for backward compat — only mutes music */
  public setMuted(muted: boolean) {
    this.setMusicMuted(muted);
  }

  public isMuted(): boolean {
    return this.musicMuted;
  }

  /** Toggle music mute. Returns new mute state. */
  public toggleMute(): boolean {
    this.musicMuted = !this.musicMuted;
    if (this.musicMuted) {
      this.stopLobbyMusic();
    }
    return this.musicMuted;
  }

  // ─── SFX Methods (NEVER check musicMuted — always play) ──────────────────

  /** "Insert Coin" / Arcade start sound */
  public playCoin() {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  /** Correct decision / combo sound */
  public playCorrect(comboLevel = 1) {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.connect(gain);
      gain.connect(ctx.destination);
      const baseFreq = 523.25 * Math.min(2.0, 1 + (comboLevel - 1) * 0.2);
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.setValueAtTime(baseFreq * 1.25, now + 0.06);
      osc.frequency.setValueAtTime(baseFreq * 1.5, now + 0.12);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch {}
  }

  /** Standard error sound */
  public playError() {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.22);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  /** Comic donkey bray ("Hee-Haw!") — always plays, never muted */
  public playDonkeyBray() {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const startTime = ctx.currentTime;
      for (let cycle = 0; cycle < 2; cycle++) {
        const offset = startTime + cycle * 0.38;

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sawtooth";
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.frequency.setValueAtTime(520, offset);
        osc1.frequency.exponentialRampToValueAtTime(1150, offset + 0.16);
        gain1.gain.setValueAtTime(0.01, offset);
        gain1.gain.linearRampToValueAtTime(0.20, offset + 0.05);
        gain1.gain.exponentialRampToValueAtTime(0.001, offset + 0.18);
        osc1.start(offset);
        osc1.stop(offset + 0.18);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "triangle";
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        const hawStart = offset + 0.16;
        osc2.frequency.setValueAtTime(920, hawStart);
        osc2.frequency.exponentialRampToValueAtTime(175, hawStart + 0.2);
        gain2.gain.setValueAtTime(0.22, hawStart);
        gain2.gain.exponentialRampToValueAtTime(0.001, hawStart + 0.2);
        osc2.start(hawStart);
        osc2.stop(hawStart + 0.2);
      }
    } catch {}
  }

  /** Button tap / touch feedback */
  public playTap() {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(680, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  /** Shield break effect for Juego 2 */
  public playShieldBreak() {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.3);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.start(now);
      osc.stop(now + 0.32);
    } catch {}
  }

  /** Victory fanfare */
  public playVictory() {
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const now = ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.14, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.25);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.25);
      });
    } catch {}
  }

  // ─── Lobby Music (respects musicMuted) ───────────────────────────────────

  /**
   * Retro arcade chiptune loop for lobby/menu.
   * Only this method checks musicMuted — all SFX above are always unaffected.
   */
  public startLobbyMusic() {
    if (this.musicMuted || this.isMusicPlaying) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    this.isMusicPlaying = true;

    const melodyPattern = [
      523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 523.25, 392.0,
      440.0,  523.25, 659.25, 880.0,  659.25, 523.25, 440.0,  329.63,
      349.23, 440.0,  523.25, 698.46, 523.25, 440.0,  349.23, 261.63,
      392.0,  493.88, 587.33, 783.99, 587.33, 493.88, 392.0,  329.63,
    ];

    const bassPattern = [130.81, 130.81, 110.0, 110.0, 87.31, 87.31, 98.0, 98.0];

    let step = 0;
    const stepDuration = 120;

    this.musicInterval = setInterval(() => {
      if (this.musicMuted || !this.isMusicPlaying) return;
      const c = this.initCtx();
      if (!c) return;

      try {
        const now = c.currentTime;

        const noteFreq = melodyPattern[step % melodyPattern.length];
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(noteFreq, now);
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(now);
        osc.stop(now + 0.1);

        if (step % 4 === 0) {
          const bassFreq = bassPattern[Math.floor(step / 4) % bassPattern.length];
          const bassOsc = c.createOscillator();
          const bassGain = c.createGain();
          bassOsc.type = "triangle";
          bassOsc.frequency.setValueAtTime(bassFreq, now);
          bassGain.gain.setValueAtTime(0.065, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          bassOsc.connect(bassGain);
          bassGain.connect(c.destination);
          bassOsc.start(now);
          bassOsc.stop(now + 0.35);
        }

        step = (step + 1) % 1024;
      } catch {}
    }, stepDuration);
  }

  public stopLobbyMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const synth = new ArcadeSynth();
