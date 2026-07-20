/* Lightweight synthesized placeholder cues with no external assets. */

"use strict";

export class GameplayAudio
{
    constructor()
    {
        this.context = null;
        this.engineOscillator = null;
        this.engineGain = null;
    }

    updateVehicle(speed, throttle, braking)
    {
        if (!this.context || !this.engineOscillator)
        {
            return;
        }
        const now = this.context.currentTime;
        const speedRatio = Math.min(1, Math.abs(speed) / 20);
        this.engineOscillator.frequency.setTargetAtTime(52 + speedRatio * 95 + Math.abs(throttle) * 18, now, 0.08);
        this.engineGain.gain.setTargetAtTime(braking ? 0.018 : 0.025 + speedRatio * 0.025, now, 0.1);
    }

    startVehicleEngine()
    {
        if (!this.context || this.engineOscillator)
        {
            return;
        }
        this.engineOscillator = this.context.createOscillator();
        this.engineGain = this.context.createGain();
        this.engineOscillator.type = "sawtooth";
        this.engineOscillator.frequency.value = 52;
        this.engineGain.gain.value = 0.025;
        this.engineOscillator.connect(this.engineGain).connect(this.context.destination);
        this.engineOscillator.start();
    }

    play(cue)
    {
        const AudioContext = window.AudioContext || window.webkitAudioContext;

        if (!AudioContext)
        {
            return;
        }

        this.context = this.context || new AudioContext();
        this.startVehicleEngine();

        if (this.context.state === "suspended")
        {
            this.context.resume();
        }
        const tones = {
            enter: [330, 0.08],
            exit: [240, 0.08],
            accepted: [440, 0.14],
            pickup: [560, 0.12],
            completed: [660, 0.18],
            money: [880, 0.16]
        };
        const tone = tones[cue];

        if (!tone)
        {
            return;
        }

        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        const now = this.context.currentTime;
        oscillator.frequency.value = tone[0];
        oscillator.type = "sine";
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + tone[1]);
        oscillator.connect(gain).connect(this.context.destination);
        oscillator.start(now);
        oscillator.stop(now + tone[1]);
    }
}
