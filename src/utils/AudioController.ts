/**
 * AudioController Utility
 * 
 * Specialized class for handling focus music with high-performance fading effects.
 * Manages browser autoplay restrictions through a user-initiated unlock phase.
 */

export class AudioController {
    private audio: HTMLAudioElement | null = null;
    private fadeInterval: any = null;

    constructor() { }

    loadAudio(file: File | string) {
        if (this.audio) {
            this.audio.pause();
        }
        const url = typeof file === 'string' ? file : URL.createObjectURL(file);
        this.audio = new Audio(url);
        this.audio.loop = true;
    }

    async unlockAudio() {
        if (!this.audio) return;
        try {
            const originalVolume = this.audio.volume;
            this.audio.volume = 0;
            await this.audio.play();
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio.volume = originalVolume;
            console.log("Audio unlocked successfully");
        } catch (err) {
            console.warn("Audio unlock failed:", err);
        }
    }

    private targetPlayingState: 'playing' | 'paused' | null = null;

    async playWithFade(targetVolume: number = 0.6, durationMs: number = 1000) {
        if (!this.audio) return;
        this.targetPlayingState = 'playing';

        clearInterval(this.fadeInterval);

        try {
            if (this.audio.paused) {
                this.audio.volume = 0;
                await this.audio.play();
            }
        } catch (error) {
            console.warn("Playback blocked by browser:", error);
            return;
        }

        const steps = 20;
        const interval = durationMs / steps;
        const volumeDiff = targetVolume - this.audio.volume;
        const volumeStep = volumeDiff / steps;

        this.fadeInterval = setInterval(() => {
            if (!this.audio || this.targetPlayingState !== 'playing') {
                clearInterval(this.fadeInterval);
                return;
            }

            const nextVolume = this.audio.volume + volumeStep;
            if ((volumeStep > 0 && nextVolume >= targetVolume) || (volumeStep < 0 && nextVolume <= targetVolume)) {
                this.audio.volume = targetVolume;
                clearInterval(this.fadeInterval);
            } else {
                this.audio.volume = Math.max(0, Math.min(1, nextVolume));
            }
        }, interval);
    }

    pauseWithFade(durationMs: number = 1000) {
        if (!this.audio || this.audio.paused) return;
        this.targetPlayingState = 'paused';

        clearInterval(this.fadeInterval);

        const steps = 20;
        const interval = durationMs / steps;
        const volumeStep = this.audio.volume / steps;

        this.fadeInterval = setInterval(() => {
            if (!this.audio || this.targetPlayingState !== 'paused') {
                clearInterval(this.fadeInterval);
                return;
            }

            if (this.audio.volume - volumeStep <= 0) {
                this.audio.volume = 0;
                this.audio.pause();
                clearInterval(this.fadeInterval);
            } else {
                this.audio.volume -= volumeStep;
            }
        }, interval);
    }

    setVolume(val: number) {
        if (this.audio) this.audio.volume = val;
    }

    setLoop(loop: boolean) {
        if (this.audio) this.audio.loop = loop;
    }
}

export const audioController = new AudioController();
