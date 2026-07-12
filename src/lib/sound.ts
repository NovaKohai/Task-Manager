class SoundSynthesizer {
  private ctx: AudioContext | null = null

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  play(theme: string, volume: number = 0.5) {
    try {
      this.initCtx()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const gainNode = this.ctx.createGain()
      gainNode.connect(this.ctx.destination)
      gainNode.gain.setValueAtTime(0, now)
      // Smooth fade-in to prevent digital click artifacts, then decay
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.01)

      if (theme === 'chime') {
        // Melodic Chime: Dual-tone harmonic chime
        const osc1 = this.ctx.createOscillator()
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(523.25, now) // C5
        osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15) // E5
        osc1.connect(gainNode)

        const osc2 = this.ctx.createOscillator()
        const gainNode2 = this.ctx.createGain()
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(783.99, now) // G5
        osc2.connect(gainNode2)
        gainNode2.connect(this.ctx.destination)
        gainNode2.gain.setValueAtTime(0, now)
        gainNode2.gain.linearRampToValueAtTime(volume * 0.4, now + 0.01)
        gainNode2.gain.exponentialRampToValueAtTime(0.0001, now + 0.6)

        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.6)

        osc1.start(now)
        osc1.stop(now + 0.6)
        osc2.start(now)
        osc2.stop(now + 0.6)
      } else if (theme === 'glass') {
        // Crystalline Glass: high-pitched resonant hit
        const osc1 = this.ctx.createOscillator()
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(987.77, now) // B5
        osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08) // E6
        osc1.connect(gainNode)

        const osc2 = this.ctx.createOscillator()
        const gainNode2 = this.ctx.createGain()
        osc2.type = 'triangle'
        osc2.frequency.setValueAtTime(1975.53, now) // B6
        osc2.connect(gainNode2)
        gainNode2.connect(this.ctx.destination)
        gainNode2.gain.setValueAtTime(0, now)
        gainNode2.gain.linearRampToValueAtTime(volume * 0.2, now + 0.01)
        gainNode2.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)

        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)

        osc1.start(now)
        osc1.stop(now + 0.3)
        osc2.start(now)
        osc2.stop(now + 0.3)
      } else if (theme === 'cyber') {
        // Futuristic Cyber: quick frequency pitch sweep
        const osc1 = this.ctx.createOscillator()
        osc1.type = 'triangle'
        osc1.frequency.setValueAtTime(180, now)
        osc1.frequency.exponentialRampToValueAtTime(720, now + 0.25)
        osc1.connect(gainNode)

        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)

        osc1.start(now)
        osc1.stop(now + 0.35)
      } else if (theme === 'alert') {
        // Warning Alert: alternating urgent alarm beeps
        const osc1 = this.ctx.createOscillator()
        osc1.type = 'sawtooth'
        osc1.frequency.setValueAtTime(660, now) // E5
        osc1.frequency.setValueAtTime(440, now + 0.12) // A4
        osc1.connect(gainNode)

        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.24)

        osc1.start(now)
        osc1.stop(now + 0.24)
      } else {
        // Default chime fallback
        const osc = this.ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(440, now)
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1)
        osc.connect(gainNode)

        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.25)

        osc.start(now)
        osc.stop(now + 0.25)
      }
    } catch (e) {
      console.warn('Failed to play synthesized notification sound:', e)
    }
  }
}

export const soundSynthesizer = new SoundSynthesizer()
