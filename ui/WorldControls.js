import { RenderProfile } from "../engine/RenderProfile.js";
export class WorldControls
{
    constructor(session,weather)
    {
        this.session=session;this.name='World controls';this.weather=weather;this.root=document.createElement('section');
        this.root.id='worldControls';this.root.style.cssText='position:fixed;bottom:14px;right:14px;padding:10px 12px;background:#102735e8;color:#e8f2ed;border:1px solid #557884;border-radius:10px;font:13px system-ui;z-index:30;max-width:240px';
        this.root.innerHTML=`<button type="button" class="backToAvatar">Back to avatar</button><details><summary>World${RenderProfile.lite?" · Light graphics":""} · ${session.terrain.downtown.traffic.vehicles.length} vehicles · ${session.terrain.downtown.pedestrians.people.length} people</summary><p><button type="button" class="train">Train boarding (F7)</button> <button type="button" class="wheel">View Ferris wheel</button></p><label>Weather <select aria-label="Weather"><option value="auto">Automatic</option>${weather.modes.map(m=>`<option value="${m}">${m[0].toUpperCase()+m.slice(1)}</option>`).join('')}</select></label><p><label>Time of day <input aria-label="Time of day" type="range" min="0" max="23.9" step="0.1" value="15"></label></p><p><label><input type="checkbox" class="daytimeForever"> Daytime forever</label></p><label><input type="checkbox" class="lightning"> Lightning flashes</label></details><div class="conditions" aria-live="off"></div>`;
        document.body.appendChild(this.root);
        this.root.querySelector('.backToAvatar').onclick=()=>{session.trainRide.leave();session.helicopterRide.leave();session.wheelRide.leave();session.player.cameraController?.restoreFollow();session.input.reset();};
        this.root.querySelector('.train').onclick=()=>{session.trainRide.leave();session.helicopterRide.leave();session.wheelRide.leave();session.viewTrain();};
        this.root.querySelector('.wheel').onclick=()=>{session.trainRide.leave();session.helicopterRide.leave();session.wheelRide.leave();session.viewWheel();};
        this.root.querySelector('select').onchange=e=>{weather.auto=e.target.value==='auto';if(!weather.auto)weather.setMode(e.target.value);};
        this.root.querySelector('input[type=range]').oninput=e=>{weather.hour=Number(e.target.value);weather.update(0);};
        this.root.querySelector('.daytimeForever').onchange=e=>{weather.daytimeForever=e.target.checked;this.root.querySelector('input[type=range]').disabled=e.target.checked;weather.update(0);};
        this.root.querySelector('.lightning').onchange=e=>weather.lightning=e.target.checked;
    }
    update(){this.root.querySelector('.conditions').textContent=this.weather.label;}
}
