/* Quick visits make distant landmark changes easy to explore on a phone. */
export class LandmarkTour
{
    constructor(engine)
    {
        this.engine=engine;this.sites=engine.world.terrain.downtown.localLandmarks;
        const panel=document.createElement('details');panel.className='landmarkTour';
        panel.innerHTML='<summary>Landmarks</summary><select aria-label="Choose landmark"></select><div><button type="button" class="visit">Visit</button> <button type="button" class="view">City view</button></div>';
        const select=panel.querySelector('select');for(const [i,site] of this.sites.entries()){const option=document.createElement('option');option.value=i;option.textContent=site.name;select.appendChild(option);}
        panel.querySelector('.visit').onclick=()=>this.visit(Number(select.value));panel.querySelector('.view').onclick=()=>this.visit(Number(select.value),true);
        engine.worldControls.root.appendChild(panel);
    }
    visit(index,overview=false)
    {
        const site=this.sites[index];if(!site||this.engine.gameplaySession.life.dead)return false;
        const e=this.engine,s=e.gameplaySession,map=e.world.terrain.downtown;
        s.trainRide.leave();s.helicopterRide.leave();s.wheelRide.leave();e.input.reset();e.touchControls?.release?.();s.cart.speed=0;
        if(e.player.isDriving&&!s.cart.exit())return false;
        const road=map.nearestRoad(site.entrance.x,site.entrance.z);
        // Search along the street for a clear arrival; never place inside a wall.
        let arrival=site.arrival&&!map.isBlocked(site.arrival.x,site.arrival.z,.3,true)?site.arrival:null;for(const distance of [0,2,-2,4,-4,8,-8])for(const axis of ['x','z'])
        {const candidate=map.nearestRoad(road.x+(axis==='x'?distance:0),road.z+(axis==='z'?distance:0));if(!arrival&&!map.isBlocked(candidate.x,candidate.z,.3,true))arrival=candidate;}
        if(!arrival)return false;
        e.player.position.set(arrival.x,e.world.terrain.getHeightAt(arrival.x,arrival.z)+1,arrival.z);e.player.verticalVelocity=0;
        e.cameraController.restoreFollow();const camera=e.cameraController.camera;
        camera.alpha=Math.atan2(arrival.z-site.z,arrival.x-site.x);
        if(overview){document.body.classList.add("landmarkView");e.cameraController.focusUntil=Infinity;camera.checkCollisions=false;camera.upperRadiusLimit=180;camera.setTarget(new BABYLON.Vector3(site.x,site.base+site.height*.35,site.z));camera.alpha=Math.atan2(arrival.z-site.z,arrival.x-site.x);camera.radius=site.viewDistance;camera.beta=1.15;this.clearView(camera,site,e.world.scene);}
        return true;
    }
    clearView(camera,site,scene)
    {
        // Find a line of sight around neighboring towers before showing a landmark.
        const start=camera.alpha,target=camera.target.clone(),radius=camera.radius;
        let best=start,bestDistance=-1;
        for(let i=0;i<16;i++)
        {
            const alpha=start+i*Math.PI/8;
            const origin=target.add(new BABYLON.Vector3(Math.cos(alpha)*Math.sin(camera.beta)*radius,Math.cos(camera.beta)*radius,Math.sin(alpha)*Math.sin(camera.beta)*radius));
            let score=0,visible=0;
            for(const offset of [-.2,0,.2])
            {
                const aim=target.add(new BABYLON.Vector3(-Math.sin(alpha)*radius*offset,0,Math.cos(alpha)*radius*offset));
                const ray=aim.subtract(origin),length=ray.length();
                const hit=scene.pickWithRay(new BABYLON.Ray(origin,ray.normalize(),length),m=>m.isEnabled()&&m.isVisible&&m.material?.alpha!==0);
                if(hit?.pickedMesh?.name.includes(`Landmark ${site.name} `)){score+=2;visible++;}
                else score+=(hit?.hit?hit.distance/length:1)*.1;
            }
            if(score>bestDistance){bestDistance=score;best=alpha;}
            if(visible===3)break;
        }
        camera.alpha=best;
    }

}
