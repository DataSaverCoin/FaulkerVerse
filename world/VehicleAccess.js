import { TrafficCar } from '../entities/TrafficCar.js';
import { PersonAvatar } from '../entities/PersonAvatar.js';
import { ACTOR_SCALE } from '../engine/ActorScale.js';

/* One active vehicle owns ride, damage and camera state; abandoned cars stay parked. */
export class VehicleAccess
{
    constructor(session){this.session=session;this.home=session.cart;this.ejected=[];}
    nearest()
    {
        const s=this.session,p=s.player.position;
        return (s.terrain.downtown?.traffic?.vehicles||[])
            .filter(v=>['car','pickup','truck','motorcycle','bicycle'].includes(v.kind)&&!v.crashed&&!v.controller?.wrecked&&Math.abs(v.speed)<1.5&&Math.hypot(p.x-v.mesh.position.x,p.z-v.mesh.position.z)<2.5&&Math.abs(p.y-v.mesh.position.y)<2)
            .sort((a,b)=>BABYLON.Vector3.DistanceSquared(a.mesh.position,p)-BABYLON.Vector3.DistanceSquared(b.mesh.position,p))[0];
    }
    select(vehicle)
    {
        const s=this.session,old=s.cart;
        if(old===vehicle)return;
        if(s.emergency.stage==='exploded'){s.emergency.reset();old.visualRoot.setEnabled(false);}
        old.savedHealth=s.life.cartHealth;
        if(old.trafficVehicle)old.trafficVehicle.controlled=false;
        old.onImpact=null;old.emergency=null;
        s.cart=vehicle;s.rideSystem.cart=vehicle;
        vehicle.emergency=s.emergency;vehicle.onImpact=speed=>s.impacts.cartImpact(speed);
        s.life.cartHealth=vehicle.savedHealth??100;
        if(vehicle.trafficVehicle)vehicle.trafficVehicle.controlled=true;
        s.impacts.previous.copyFrom(vehicle.position);
        const map=s.terrain.downtown;
        if(map?.traffic){map.traffic.cart=vehicle;map.traffic.homeCart=this.home;}
        if(map?.roadLighting)map.roadLighting.cart=vehicle;
    }
    restoreCart()
    {
        const s=this.session;
        if(s.cart===this.home)return;
        s.life.clearInput();
        if(s.cart.driver){s.cart.driver=null;s.player.exitVehicle(s.player.position.clone());}
        s.emergency.reset();this.select(this.home);
    }
    take(v)
    {
        const s=this.session;
        if(s.player.isDriving||s.life.dead||s.emergency.active||!v||Math.abs(v.speed)>=1.5)return false;
        if(v.controller===s.cart)return s.cart.enter(s.player);
        if(!['IDLE','COMPLETED'].includes(s.rideSystem.state)){s.life.message='Finish or cancel your fare before changing vehicles.';return false;}
        if(Math.hypot(s.player.position.x-v.mesh.position.x,s.player.position.z-v.mesh.position.z)>=2.5)return false;
        const spot=s.life.safeSpot(v.mesh.position.x,v.mesh.position.z,.25);
        if(!spot)return false;
        if(!v.taken)
        {
            const avatar=new PersonAvatar(s.player.scene,{name:'Displaced driver',personal:false,gender:v.id%2?'woman':'man',shirt:'#a85535'});
            avatar.root.scaling.setAll(ACTOR_SCALE);avatar.root.position.copyFrom(v.mesh.position);
            this.ejected.push({avatar,start:avatar.root.position.clone(),target:new BABYLON.Vector3(spot.x,s.terrain.getHeightAt(spot.x,spot.z)+.02,spot.z),time:0});
            v.taken=true;v.rider?.setEnabled(false);v.speed=0;v.committed=null;
            v.controller=new TrafficCar(s.cart.scene,s.input,s.terrain,v.mesh.position,v);
            s.life.message='Driver thrown out! The automobile is yours to drive.';
        }
        this.select(v.controller);v.mesh.setEnabled(true);
        s.life.clearInput();s.cart.enter(s.player);s.audio.play('enter');return true;
    }
    interact(pressed)
    {
        const s=this.session,v=this.nearest();
        const homeDistance=Math.hypot(s.player.position.x-this.home.position.x,s.player.position.z-this.home.position.z);
        if(s.cart!==this.home&&homeDistance<2.5&&(!v||homeDistance<Math.hypot(s.player.position.x-v.mesh.position.x,s.player.position.z-v.mesh.position.z)))
        {
            s.interactionPrompt='E · Enter golf cart';
            if(pressed&&!s.emergency.active&&['IDLE','COMPLETED'].includes(s.rideSystem.state)&&!this.home.wrecked){this.select(this.home);this.home.enter(s.player);}
            return true;
        }
        if(!v)return false;
        const activeDistance=Math.hypot(s.player.position.x-s.cart.position.x,s.player.position.z-s.cart.position.z);
        if(v.controller!==s.cart&&activeDistance<Math.hypot(s.player.position.x-v.mesh.position.x,s.player.position.z-v.mesh.position.z))return false;
        s.interactionPrompt=s.emergency.active?'Wait until the damaged vehicle is safe':v.taken?'E · Enter parked automobile':'E · Throw driver out and take automobile';
        if(pressed)this.take(v);return true;
    }
    update(delta)
    {
        const s=this.session;
        if(s.cart.trafficVehicle){s.cart.trafficVehicle.speed=s.cart.speed;s.cart.trafficVehicle.route.dx=Math.sin(s.cart.rotation.y);s.cart.trafficVehicle.route.dz=Math.cos(s.cart.rotation.y);}
        for(const p of this.ejected)
        {
            p.time+=Math.min(delta,.1);
            p.avatar.root.position.copyFrom(BABYLON.Vector3.Lerp(p.start,p.target,Math.min(1,p.time/.65)));
            p.avatar.root.rotation.z=p.time<.65?Math.sin(p.time/.65*Math.PI)*.9:0;
            p.avatar.update(delta,p.time>.65&&p.time<2);
            if(p.time>=20)p.avatar.dispose();
        }
        this.ejected=this.ejected.filter(p=>p.time<20);
    }
}
