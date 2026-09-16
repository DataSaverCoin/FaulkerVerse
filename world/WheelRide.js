/* Passenger ride state; walking and dispatch pause until a safe ground exit. */
export class WheelRide
{
    constructor(session){this.session=session;this.active=false;}
    nearEntrance()
    {
        const p=this.session.player.position,e=this.session.terrain.downtown?.wheel?.entrance;
        return e&&Math.hypot(p.x-e.x,p.z-e.z)<3;
    }
    board()
    {
        if(this.active||this.session.trainRide?.active||this.session.helicopterRide?.active||this.session.life.dead)return;
        const s=this.session,wheel=s.terrain.downtown?.wheel;if(!wheel)return;
        if(Math.abs(s.cart.speed)>1.5){s.interactionPrompt='Stop the cart before riding the Ferris wheel';return;}
        if(!this.nearEntrance())return;
        if(s.player.isDriving&&!s.cart.exit()){s.interactionPrompt='Move the cart to a clear spot before boarding';return;}
        this.returnPosition=s.player.position.clone();this.returnRotation=s.player.mesh.rotation.y;
        this.wheel=wheel;this.cabin=wheel.cabins.reduce((a,b)=>a.position.y<b.position.y?a:b);
        this.active=true;s.player.enabled=false;s.player.verticalVelocity=0;s.input.reset();s.audio.stopVehicleEngine?.();
        s.player.avatar.update(0,false,false,true);
        const controller=s.player.cameraController;controller.restoreFollow();controller.focusUntil=Infinity;controller.camera.checkCollisions=false;
        controller.camera.radius=4;controller.camera.beta=1.05;
        this.update();
    }
    update()
    {
        if(!this.active)return;
        const s=this.session;this.cabin.computeWorldMatrix(true);
        // Avatar origin is one unit above its feet; the cabin floor is 0.52 below its origin.
        s.player.position.copyFrom(this.cabin.getAbsolutePosition());s.player.position.y+=.48;
        s.player.mesh.rotation.y=this.wheel.root.rotation.y;
        s.player.cameraController.camera.setTarget(this.cabin.getAbsolutePosition());
        s.interactionPrompt='Riding the Ferris wheel · E / Enter-exit to return to the boarding area';
        if(s.input.consumePressed('KeyE'))this.leave();
    }
    leave()
    {
        if(!this.active)return;
        const s=this.session;this.active=false;s.player.enabled=true;s.player.position.copyFrom(this.returnPosition);s.player.mesh.rotation.y=this.returnRotation;s.player.verticalVelocity=0;
        s.input.reset();s.player.cameraController.restoreFollow();s.player.avatar.update(0,false,false,false);
    }
}
