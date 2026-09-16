/* Arcade health, cart recovery and medical respawns share the existing player/cart. */
export class PlayerLife
{
    constructor(session)
    {
        this.session=session;this.health=100;this.cartHealth=100;this.dead=false;
        this.immunity=0;this.spawnCooldown=0;this.message='G · Spawn a golf cart';
        this.root=document.createElement('section');this.root.id='playerLife';
        this.root.innerHTML='<div class="lifeMeters"></div><button type="button" class="spawnCart">Spawn cart · G</button><button type="button" class="evacuateCart" hidden>Evacuate everyone</button><div class="hazardStatus" role="status"></div><div class="lifeMessage" role="status"></div>';
        document.body.appendChild(this.root);
        this.root.querySelector('button').onclick=()=>this.spawnCart();
        this.root.querySelector('.evacuateCart').onclick=()=>session.emergency.evacuate();
        this.overlay=document.createElement('section');this.overlay.id='respawnScreen';this.overlay.hidden=true;
        this.overlay.innerHTML='<h2>You died</h2><p></p><button type="button">Respawn at medical care</button>';
        this.overlay.querySelector('button').onclick=()=>this.respawn();document.body.appendChild(this.overlay);
        this.draw();
    }
    update(delta)
    {
        const dt=Math.min(Math.max(delta,0),.05);this.immunity=Math.max(0,this.immunity-dt);this.spawnCooldown=Math.max(0,this.spawnCooldown-dt);
        if(this.session.input.consumePressed('KeyG'))this.spawnCart();
        if(this.dead&&this.session.input.consumePressed('Enter'))this.respawn();
        this.draw();
    }
    draw()
    {
        const emergency=this.session.emergency;this.root.querySelector('.evacuateCart').hidden=!emergency?.active||!emergency.occupied;
        this.root.querySelector('.hazardStatus').textContent=emergency?.label||'';
        this.root.querySelector('.lifeMeters').textContent=`Health ${Math.ceil(this.health)} / 100 · Vehicle ${Math.ceil(this.cartHealth)}%`;
        this.root.querySelector('.lifeMessage').textContent=this.message;
        this.root.querySelector('button').disabled=this.dead||this.spawnCooldown>0||(this.session.trainRide?.active||this.session.wheelRide.active||this.session.helicopterRide?.active)||(emergency?.active&&emergency.occupied);
    }
    cancelFare()
    {
        const r=this.session.rideSystem;r.streetRides?.release(false);r.showMarker(null);r.passenger?.setEnabled(false);r.pickup=null;r.destination=null;r.fare=0;r.nextRideDelay=2.5;r.transitionTo('IDLE');
    }
    clearInput()
    {
        this.session.input.reset();window.Faulker?.touchControls?.release?.();
        this.session.cart.speed=0;this.session.cart.throttle=0;this.session.cart.bumper.reset();
        this.session.audio.updateVehicle(0,0,false,false);
    }
    safeSpot(x,z,radius,cart=false,minDistance=0,avoid=null)
    {
        const s=this.session,map=s.terrain.downtown;
        for(const distance of [2.5,4,6,9,14,20,28].filter(d=>d>=minDistance))for(let i=0;i<24;i++)
        {
            const a=i*Math.PI/12,p={x:x+Math.sin(a)*distance,z:z+Math.cos(a)*distance};
            if(avoid&&Math.hypot(p.x-avoid.x,p.z-avoid.z)<1)continue;
            if(!map?.isBlocked(p.x,p.z,radius)&&(!cart||!s.cart.blockedAt(p.x,p.z)))return p;
        }
        return null;
    }
    spawnCart()
    {
        const s=this.session;if(this.dead||(s.trainRide?.active||s.wheelRide.active||s.helicopterRide?.active)||this.spawnCooldown>0)return false;
        if(s.emergency.active&&s.emergency.occupied){this.message='Evacuate everyone before replacing the cart.';return false;}
        s.vehicles?.restoreCart();
        const spot=this.safeSpot(s.player.position.x,s.player.position.z,.55,true);
        if(!spot){this.message='Move into an open area to spawn a cart.';return false;}
        this.clearInput();this.cancelFare();this.cartHealth=100;s.cart.wrecked=false;s.emergency.reset();
        s.cart.position.set(spot.x,0,spot.z);s.cart.snapToTerrain();
        if(!s.player.isDriving)s.cart.enter(s.player);
        s.player.position.copyFrom(s.cart.driverPosition);s.player.rotation.y=s.cart.rotation.y;
        s.player.cameraController?.restoreFollow();this.spawnCooldown=2;
        this.message='Fresh cart ready. E / Enter-exit to get out.';this.draw();return true;
    }
    hurt(amount,reason='Vehicle impact')
    {
        if(this.dead||this.immunity>0||(this.session.trainRide?.active||this.session.wheelRide.active||this.session.helicopterRide?.active))return;
        this.health=Math.max(0,this.health-amount);this.message=reason;
        if(this.health===0)this.die();this.draw();
    }
    damageCart(speed)
    {
        if(speed<3.5||this.dead)return;
        // Keep the existing bounce, but apply only 20% of the old collision damage.
        const impactDamage=(speed-3)*.2;
        this.cartHealth=Math.max(0,this.cartHealth-impactDamage*8);
        // Impact injuries cannot kill an occupant; the delayed fire is the danger.
        if(this.session.player.isDriving)this.health=Math.max(Math.min(this.health,25),this.health-impactDamage*2);
        if(this.cartHealth<=55)this.session.emergency.begin();
        this.message=this.session.emergency.active?'Cart disabled. Evacuate everyone before it explodes.':'Cart damaged. You can spawn a replacement.';
        this.draw();
    }
    medicalSite()
    {
        const p=this.session.player.position;
        return (this.session.terrain.downtown?.localLandmarks||[]).filter(s=>s.kind==='urgentcare'||s.kind==='hospital').sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
    }
    die()
    {
        const s=this.session;this.dead=true;this.site=this.medicalSite();this.clearInput();this.cancelFare();
        if(s.player.isDriving){s.cart.driver=null;s.player.exitVehicle(s.player.position.clone());}
        s.player.enabled=false;s.player.mesh.setEnabled(false);s.interactionPrompt='';
        this.overlay.querySelector('p').textContent=this.site?`Respawn outside ${this.site.name}.`:'Respawn at the train station.';
        this.overlay.hidden=false;
    }
    respawn()
    {
        if(!this.dead)return false;
        const s=this.session,entrance=this.site?.entrance||{x:-388,z:-51};
        const spot=this.safeSpot(entrance.x,entrance.z,.3);
        if(!spot){this.overlay.querySelector('p').textContent='Arrival area blocked. Try respawning again in a moment.';return false;}
        this.clearInput();s.player.position.set(spot.x,s.terrain.getHeightAt(spot.x,spot.z)+1,spot.z);
        s.player.verticalVelocity=0;s.player.enabled=true;s.player.mesh.setEnabled(true);
        this.dead=false;this.health=100;this.immunity=5;this.overlay.hidden=true;
        s.player.cameraController?.restoreFollow();this.message=`Recovered at ${this.site?.name||'the station'} · 5 seconds of protection`;
        this.draw();return true;
    }
}
