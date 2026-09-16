/* Pointer-based multi-touch controls share the existing keyboard input state. */
export class TouchControls
{
    constructor(input,player,camera)
    {
        this.name='Touch controls';this.input=input;this.player=player;this.camera=camera;
        this.enabled=matchMedia('(pointer: coarse)').matches||new URLSearchParams(location.search).has('mobile');
        if(!this.enabled)return;
        document.body.classList.add('touchMode');
        this.root=document.createElement('div');this.root.id='touchControls';
        this.root.innerHTML='<div id="touchStick" aria-label="Move or steer"><span id="touchKnob"></span><small>MOVE / STEER</small></div><div id="touchLook" aria-label="Look joystick"><span id="lookKnob"></span><small>LOOK</small></div><div class="touchActions"><button data-key="KeyE">Enter / exit</button><button data-key="KeyF">Talk</button><button data-key="Space">Brake / jump</button><button data-key="ShiftLeft">Hold to run</button><button id="touchMap">Mini map</button></div>';
        document.body.appendChild(this.root);document.querySelector('#downtownMap')?.classList.add('collapsed');
        const stick=this.root.querySelector('#touchStick'),knob=this.root.querySelector('#touchKnob');
        const move=e=>{if(e.pointerId!==this.stickPointer)return;const r=stick.getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/48,y=(e.clientY-r.top-r.height/2)/48;const length=Math.max(1,Math.hypot(x,y));knob.style.transform=`translate(${x/length*42}px,${y/length*42}px)`;x=Math.max(-1,Math.min(1,x));y=Math.max(-1,Math.min(1,y));input.setTouchSteering(x);input.setTouchThrottle(-y);input.setTouch('KeyA',x<-.25);input.setTouch('KeyD',x>.25);input.setTouch('KeyW',y<-.25);input.setTouch('KeyS',y>.25);};
        stick.onpointerdown=e=>{if(this.stickPointer!==undefined)return;e.preventDefault();this.stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);move(e);};stick.onpointermove=move;
        this.releaseStick=()=>{this.stickPointer=undefined;input.setTouchSteering(0);input.setTouchThrottle(0);knob.style.transform='';for(const key of ['KeyW','KeyA','KeyS','KeyD'])input.setTouch(key,false);};
        for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,e=>{if(e.pointerId===this.stickPointer)this.releaseStick();});
        for(const button of this.root.querySelectorAll('[data-key]'))
        {
            button.onpointerdown=e=>{if(button.controlPointer!==undefined)return;e.preventDefault();button.controlPointer=e.pointerId;button.setPointerCapture(e.pointerId);input.setTouch(button.dataset.key,true);button.classList.add('held');};
            const release=e=>{if(e.pointerId!==button.controlPointer)return;button.controlPointer=undefined;input.setTouch(button.dataset.key,false);button.classList.remove('held');};
            for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,release);
        }
        this.root.querySelector('#touchMap').onclick=()=>window.Faulker?.gameplayHUD?.setMapMode(!window.Faulker.gameplayHUD.mapMode);
        const look=this.root.querySelector('#touchLook');
        const lookMove=e=>{if(e.pointerId!==this.lookPointer)return;const r=look.getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/48,y=(e.clientY-r.top-r.height/2)/48;const length=Math.max(1,Math.hypot(x,y));this.lookAxis={x:x/length,y:y/length};this.root.querySelector('#lookKnob').style.transform=`translate(${this.lookAxis.x*36}px,${this.lookAxis.y*36}px)`;};
        look.onpointerdown=e=>{if(this.lookPointer!==undefined)return;e.preventDefault();this.lookPointer=e.pointerId;look.setPointerCapture(e.pointerId);lookMove(e);};
        look.onpointermove=lookMove;
        this.releaseLook=()=>{this.lookPointer=undefined;this.lookAxis=null;this.root.querySelector('#lookKnob').style.transform='';};
        for(const type of ['pointerup','pointercancel','lostpointercapture'])look.addEventListener(type,e=>{if(e.pointerId===this.lookPointer)this.releaseLook();});
        this.release=()=>{this.releaseStick();this.releaseLook();input.clearTouch();this.root.querySelectorAll('[data-key]').forEach(b=>{b.controlPointer=undefined;b.classList.remove('held');});};
        window.addEventListener('blur',this.release);document.addEventListener('visibilitychange',()=>{if(document.hidden)this.release();});
    }
    update(dt)
    {
        if(!this.lookAxis)return;
        this.camera.alpha-=this.lookAxis.x*Math.min(dt,.05)*2;
        this.camera.beta=Math.max(.3,Math.min(1.5,this.camera.beta+this.lookAxis.y*Math.min(dt,.05)*1.5));
    }
}
