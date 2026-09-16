/* Lightweight synthesized placeholder cues with no external assets. */

"use strict";

export class GameplayAudio
{
    constructor()
    {
        this.context = null;
        this.engineOscillator = null;
        this.engineGain = null;
        this.musicEnabled=true;this.musicStep=0;
        this.musicButton=document.createElement('button');this.musicButton.id='musicToggle';this.musicButton.textContent='Music: on';this.musicButton.setAttribute('aria-pressed','true');
        this.musicButton.onclick=()=>{this.setMusicEnabled(!this.musicEnabled);this.unlockMusic();};
        // Touch activation may only become available on release. Retry after interruptions.
        const unlock=()=>{if(!this.context||this.context.state!=='running')this.unlockMusic();};
        for(const event of ['pointerup','click','keydown'])window.addEventListener(event,unlock);
        document.addEventListener('visibilitychange',()=>{if(this.musicGain)this.musicGain.gain.value=document.hidden?0:(this.musicEnabled?.045:0);});
    }

    setMusicEnabled(enabled)
    {
        this.musicEnabled=enabled;
        this.musicButton.textContent=`Music: ${enabled?'on':'off'}`;
        this.musicButton.setAttribute('aria-pressed',String(enabled));
        if(this.musicGain)this.musicGain.gain.value=enabled&&!document.hidden?.045:0;
    }

    unlockMusic()
    {
        const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;
        this.context=this.context||new Context();this.context.resume().catch(()=>{});
        if(this.musicTimer)return;
        this.musicGain=this.context.createGain();this.musicGain.gain.value=this.musicEnabled?.045:0;this.musicGain.connect(this.context.destination);
        // Original mellow pentatonic melody and a repeating four-chord accompaniment.
        const melody=[0,4,7,9,7,4,2,4,0,2,4,7,4,2,0,-3];
        this.musicTimer=setInterval(()=>{
            if(this.radioOccupied||!this.musicEnabled||document.hidden||this.context.state!=='running')return;
            const step=this.musicStep++,root=[48,45,53,55][Math.floor(step/8)%4];
            const note=(midi,duration,volume)=>{const o=this.context.createOscillator(),g=this.context.createGain(),t=this.context.currentTime;o.type='sine';o.frequency.value=440*2**((midi-69)/12);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.04);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(this.musicGain);o.start(t);o.stop(t+duration);o.onended=()=>{o.disconnect();g.disconnect();};};
            note(60+melody[step%melody.length],.65,.45);
            if(step%4===0)for(const offset of [0,7,12])note(root+offset,1.9,.22);
        },500);
    }

    updateVehicle(speed, throttle, braking, occupied = false)
    {
        if (!occupied || Math.abs(speed) < 0.1)
        {
            this.stopVehicleEngine();
            return;
        }
        if (!this.context) return;
        this.startVehicleEngine();
        const now = this.context.currentTime;
        const speedRatio = Math.min(1, Math.abs(speed) / 20);
        this.engineOscillator.frequency.setTargetAtTime(52 + speedRatio * 95 + Math.abs(throttle) * 18, now, 0.08);
        this.engineGain.gain.setTargetAtTime(braking ? 0.0015 : 0.0025 + speedRatio * 0.0025, now, 0.1);
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
        this.engineGain.gain.value = 0;
        this.engineOscillator.connect(this.engineGain).connect(this.context.destination);
        this.engineOscillator.start();
    }

    stopVehicleEngine()
    {
        if (!this.engineOscillator) return;
        const oscillator=this.engineOscillator, gain=this.engineGain, now=this.context.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value,now);
        gain.gain.linearRampToValueAtTime(0,now+.05);
        oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
        oscillator.stop(now+.06);
        this.engineOscillator=null;this.engineGain=null;
    }

    play(cue)
    {
        const AudioContext = window.AudioContext || window.webkitAudioContext;

        if (!AudioContext)
        {
            return;
        }

        this.context = this.context || new AudioContext();
        if (cue === "exit") this.stopVehicleEngine();

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
