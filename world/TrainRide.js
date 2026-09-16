/* Board at Union Station, wait for the train, and return safely to the same entrance. */
export class TrainRide
{
    constructor(session){this.session=session;this.active=false;this.riding=false;}
    nearEntrance(){const s=this.session,e=s.terrain.downtown?.train?.entrance,p=s.player.isDriving?s.cart.position:s.player.position;return e&&Math.hypot(p.x-e.x,p.z-e.z)<3;}
    board()
    {
        const s=this.session;if(this.active||s.life.dead||s.wheelRide.active||s.helicopterRide.active||!this.nearEntrance())return false;
        if(s.player.isDriving&&Math.abs(s.cart.speed)>1.5){s.interactionPrompt='Stop inside the train boarding circle';return false;}
        if(s.player.isDriving&&!s.cart.exit())return false;
        this.train=s.terrain.downtown.train;this.returnPosition=s.player.position.clone();this.returnRotation=s.player.mesh.rotation.y;
        this.active=true;this.riding=false;s.player.enabled=false;s.player.verticalVelocity=0;s.input.reset();s.audio.stopVehicleEngine?.();
        this.update();return true;
    }
    update()
    {
        if(!this.active)return;const s=this.session,t=this.train;
        if(!this.riding&&t.atStation()){
            this.riding=true;const controller=s.player.cameraController;controller.restoreFollow();controller.focusUntil=Infinity;controller.camera.checkCollisions=false;
            controller.camera.lowerRadiusLimit=.35;controller.camera.upperRadiusLimit=1;controller.camera.radius=.65;controller.camera.beta=1.1;this.heading=t.cars[0].rotation.y;controller.camera.alpha=-this.heading-Math.PI/2;
            s.player.avatar.root.setEnabled(false);
        }
        if(this.riding){
            const car=t.cars[0];car.computeWorldMatrix(true);
            const eye=BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0,1.55,2.5),car.getWorldMatrix());
            s.player.position.copyFrom(eye);s.player.mesh.rotation.y=car.rotation.y;
            s.player.cameraController.camera.alpha-=Math.atan2(Math.sin(car.rotation.y-this.heading),Math.cos(car.rotation.y-this.heading));this.heading=car.rotation.y;
            s.player.cameraController.camera.setTarget(eye,false,false,true);
            s.interactionPrompt='Train ride · E / Enter-exit to return to Union Station';
        }else s.interactionPrompt=`Waiting for train · ${Math.ceil(t.secondsUntilStation())}s · E / Enter-exit to cancel`;
        if(s.input.consumePressed('KeyE'))this.leave();
    }
    leave()
    {
        if(!this.active)return;const s=this.session;this.active=false;this.riding=false;s.player.enabled=true;s.player.avatar.root.setEnabled(true);
        s.player.position.copyFrom(this.returnPosition);s.player.mesh.rotation.y=this.returnRotation;s.player.verticalVelocity=0;
        s.player.cameraController.restoreFollow();s.input.reset();
    }
}
