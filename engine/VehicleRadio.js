/* Original synthesized music stations: playable offline, no third-party streams. */
export const RADIO_STATIONS=[{id:'off',name:'Radio off'},{id:'soulard',name:'Soulard Blues',notes:[0,3,5,6,7,10,7,5],wave:'triangle',beat:360},{id:'river',name:'River Jazz',notes:[0,4,7,11,9,7,4,2],wave:'sine',beat:450},{id:'broadway',name:'Broadway Electronic',notes:[0,0,7,12,10,7,3,7],wave:'square',beat:240},{id:'cruise',name:'Sunset Cruise',notes:[0,4,7,9,7,4,2,4],wave:'sine',beat:550}];
export class VehicleRadio
{
    constructor(session,parent){
        this.session=session;this.step=0;this.elapsed=0;this.current=null;this.root=document.createElement('details');this.root.innerHTML='<summary>Vehicle radio</summary><label>Station <select aria-label="Vehicle radio station"></select></label><button type="button" class="playRadio">Play radio</button><small class="radioStatus" role="status"></small><small>Original in-game music · works offline</small>';
        this.select=this.root.querySelector('select');for(const station of RADIO_STATIONS){const o=document.createElement('option');o.value=station.id;o.textContent=station.name;this.select.appendChild(o);}
        this.select.onchange=()=>{session.cart.radioStation=this.select.value;this.stop();if(this.select.value!=='off')this.play();};
        this.root.querySelector('.playRadio').onclick=()=>this.play();parent.appendChild(this.root);
    }
    play(){
        const s=this.session;
        if(!s.player.isDriving)return;
        if(this.select.value==='off')this.select.value='soulard';
        s.cart.radioStation=this.select.value;s.audio.setMusicEnabled(true);
        // Resume directly in the click/change handler, before yielding to the game loop.
        s.audio.unlockMusic();this.elapsed=1000;
    }
    stop(){if(this.gain){this.gain.disconnect();this.gain=null;}}
    update(dt){
        const s=this.session,occupied=s.player.isDriving&&!s.life.dead&&!s.helicopterRide.active&&!s.wheelRide.active;
        s.audio.radioOccupied=occupied;this.root.hidden=!occupied;
        if(this.current!==s.cart){this.current=s.cart;this.select.value=s.cart.radioStation??'soulard';this.stop();this.step=0;}
        const station=RADIO_STATIONS.find(x=>x.id===(s.cart.radioStation??'soulard'))||RADIO_STATIONS[0];
        const status=this.root.querySelector('.radioStatus');
        const label=station.id==='off'?'Radio off':!s.audio.musicEnabled?'Music muted · tap Play radio':s.audio.context?.state!=='running'?'Tap Play radio to enable sound':station.name;
        if(status.textContent!==label)status.textContent=label;
        if(!occupied||station.id==='off'||document.hidden||!s.audio.musicEnabled){this.stop();return;}
        const ctx=s.audio.context;if(!ctx||ctx.state!=='running')return;
        this.elapsed+=Math.min(dt,.1)*1000;if(this.elapsed<station.beat)return;this.elapsed=0;
        if(!this.gain){this.gain=ctx.createGain();this.gain.gain.value=.025;this.gain.connect(ctx.destination);}
        const t=ctx.currentTime;
        for(const midi of [60+station.notes[this.step%station.notes.length],36+[0,5,7,0][Math.floor(this.step/8)%4]]){
            const osc=ctx.createOscillator(),g=ctx.createGain();osc.type=station.wave;osc.frequency.value=440*2**((midi-69)/12);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.4,t+.025);g.gain.exponentialRampToValueAtTime(.0001,t+.35);osc.connect(g).connect(this.gain);osc.start(t);osc.stop(t+.4);osc.onended=()=>{osc.disconnect();g.disconnect();};
        }this.step++;
    }
}
