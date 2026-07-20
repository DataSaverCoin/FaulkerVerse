/* Lightweight synthesized placeholder cues with no external assets. */

"use strict";

export class GameplayAudio
{
    constructor()
    {
        this.context = null;
    }

    play(cue)
    {
        const AudioContext = window.AudioContext || window.webkitAudioContext;

        if (!AudioContext)
        {
            return;
        }

        this.context = this.context || new AudioContext();

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
