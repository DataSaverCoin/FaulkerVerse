/* A sightseeing ride returns to the saved safe boarding position, like the wheel. */
export class HelicopterRide
{
    constructor(session){this.session=session;this.active=false;this.elapsed=0;this.duration=82;}
    nearEntrance()
    {
        const s=this.session,e=s.terrain.downtown?.riverfront?.entrance,p=s.player.position;
        return !!e&&Math.hypot(p.x-e.x,p.z-e.z)<3&&Math.abs(p.y-s.terrain.getHeightAt(e.x,e.z)-1)<2;
    }
    board()
    {
        const s=this.session;if(this.active||this.session.trainRide?.active||s.life.dead||s.wheelRide.active||s.emergency.active||!this.nearEntrance())return false;
        if(s.player.isDriving&&(Math.abs(s.cart.speed)>1.5||!s.cart.exit())){s.interactionPrompt='Park safely before boarding the helicopter';return false;}
        this.returnPosition=s.player.position.clone();this.returnRotation=s.player.rotation.y;
        s.streetLife.close();s.streetLife.root.hidden=true;s.life.clearInput();this.active=true;this.elapsed=0;s.player.enabled=false;s.player.verticalVelocity=0;
        s.player.mesh.setEnabled(false);s.audio.stopVehicleEngine?.();
        const c=s.player.cameraController;c.restoreFollow();c.focusUntil=Infinity;c.camera.checkCollisions=false;c.camera.upperRadiusLimit=180;c.camera.radius=9;c.camera.beta=1.15;
        this.update(0);return true;
    }
    positionAt(time)
    {
        const pad=this.session.terrain.downtown.riverfront.pad,smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
        let x=pad.x,z=pad.z,y=pad.y;
        if(time<12)y+=90*smooth(time/12);
        else if(time<70){const a=smooth((time-12)/58)*Math.PI*2;x+=160*(Math.cos(a)-1);z+=145*Math.sin(a);y+=90;}
        else y+=90*(1-smooth((time-70)/12));
        return {x,y,z};
    }
    update(delta=0)
    {
        if(!this.active)return;
        const s=this.session,heli=s.terrain.downtown.riverfront.helicopter;
        this.elapsed=Math.min(this.duration,this.elapsed+Math.max(0,Math.min(delta,.1)));
        const p=this.positionAt(this.elapsed),next=this.positionAt(Math.min(this.duration,this.elapsed+.15));heli.root.position.set(p.x,p.y,p.z);
        if(Math.hypot(next.x-p.x,next.z-p.z)>.001){const target=Math.atan2(next.x-p.x,next.z-p.z),a=heli.root.rotation.y;heli.root.rotation.y+=Math.atan2(Math.sin(target-a),Math.cos(target-a))*(1-Math.exp(-4*Math.max(0,delta)));}
        s.player.position.set(p.x,p.y+1,p.z);s.player.cameraController.camera.setTarget(new BABYLON.Vector3(p.x,p.y+1,p.z));
        s.interactionPrompt=`Helicopter tour · ${Math.ceil(this.duration-this.elapsed)}s · E / Enter-exit to return`;
        if(s.input.consumePressed('KeyE')||this.elapsed>=this.duration)this.leave();
    }
    leave()
    {
        if(!this.active)return;
        const s=this.session,river=s.terrain.downtown.riverfront;this.active=false;
        river.helicopter.root.position.set(river.pad.x,river.pad.y,river.pad.z);river.helicopter.root.rotation.setAll(0);
        s.player.position.copyFrom(this.returnPosition);s.player.rotation.y=this.returnRotation;s.player.enabled=true;s.player.mesh.setEnabled(true);s.streetLife.root.hidden=false;s.player.verticalVelocity=0;
        s.input.reset();window.Faulker?.touchControls?.release?.();s.player.cameraController.restoreFollow();s.player.avatar.update(0,false,false,false);
    }
}
