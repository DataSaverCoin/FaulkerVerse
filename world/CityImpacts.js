import { ACTOR_SCALE } from '../engine/ActorScale.js';
/* Swept arcade contacts; shared traffic and pedestrian meshes stay pooled. */
export class CityImpacts
{
    constructor(session)
    {
        this.session=session;this.time=0;this.lastCartImpact=-10;this.lastPlayerImpact=-10;
        this.previous=session.cart.position.clone();
        session.cart.onImpact=speed=>this.cartImpact(speed);
    }
    cartImpact(speed)
    {
        if(this.time-this.lastCartImpact<.8||speed<3.5)return;
        this.lastCartImpact=this.time;this.session.life.damageCart(speed);
        const traffic=this.session.terrain.downtown?.traffic,c=this.session.cart;
        for(const v of traffic?.grid.near(c.position.x,c.position.z,5)||[])
        {
            if(v!==c.trafficVehicle&&this.cartContact(v))this.crash(v,speed);
        }
    }
    contact(v,p,radius)
    {
        const dx=p.x-v.mesh.position.x,dz=p.z-v.mesh.position.z;
        // Rounded rectangle: expanded square corners used to count empty space as a hit.
        const along=Math.max(0,Math.abs(dx*v.route.dx+dz*v.route.dz)-v.length/2);
        const across=Math.max(0,Math.abs(dx*v.route.dz-dz*v.route.dx)-.85*ACTOR_SCALE);
        return Math.hypot(along,across)<radius;
    }
    cartContact(v)
    {
        const c=this.session.cart,scale=c.modelScale;
        // Match the three scaled bumper probes used by GolfCart.blockedAt.
        if(Math.abs(c.position.y-v.mesh.position.y)>.8)return false;
        return (c.collisionProbes||[-1.95,0,1.55].map(d=>d*scale)).some(d=>this.contact(v,{
            x:c.position.x+Math.sin(c.rotation.y)*d,
            z:c.position.z+Math.cos(c.rotation.y)*d
        },c.collisionRadius||1.1*scale));
    }
    relativeSpeed(v)
    {
        const c=this.session.cart;
        return Math.hypot(v.route.dx*v.speed-Math.sin(c.rotation.y)*c.speed,
            v.route.dz*v.speed-Math.cos(c.rotation.y)*c.speed);
    }
    crash(v,speed)
    {
        if(v.crashed>0||v.taken)return;
        v.crashed=8;v.speed=0;v.mesh.rotation.z=.12;v.mesh.rotation.y+=.28;
        v.mesh.scaling.z*=.82;v.crashSeverity=speed;
    }
    update(delta)
    {
        const s=this.session,c=s.cart,map=s.terrain.downtown,dt=Math.min(Math.max(delta,0),.05);this.time+=dt;
        const p=c.position,old=this.previous;
        // Teleports/summons must never sweep across the city and hit bystanders.
        if(Math.hypot(p.x-old.x,p.z-old.z)>3)old.copyFrom(p);
        if(Math.abs(c.speed)>2.5&&c.driver&&!s.life.dead)
        {
            const dx=p.x-old.x,dz=p.z-old.z,length=dx*dx+dz*dz;
            for(const person of map?.pedestrians?.people||[])
            {
                if(person.down>0||person.riding)continue;
                const t=length?Math.max(0,Math.min(1,((person.position.x-old.x)*dx+(person.position.z-old.z)*dz)/length)):0;
                if(Math.hypot(person.position.x-old.x-dx*t,person.position.z-old.z-dz*t)<.72)
                {person.down=7;person.phase=0;person.poses.forEach(m=>m.rotation.z=Math.PI/2);c.speed*=.86;s.life.message='Pedestrian knocked down';}
            }
        }
        const traffic=map?.traffic;
        for(const v of traffic?.grid.near(s.player.position.x,s.player.position.z,30)||[])
        {
            if(v.crashed>0||v.speed<2.5)continue;
            if(!s.player.isDriving&&!s.life.dead&&this.time-this.lastPlayerImpact>1&&this.contact(v,s.player.position,.22)&&s.player.position.y-map.terrain.getHeightAt(s.player.position.x,s.player.position.z)<1.65)
            {this.lastPlayerImpact=this.time;const speed=v.speed;this.crash(v,speed);s.life.hurt(speed*19,'Struck by traffic');}
            if(v===c.trafficVehicle)continue;
            if(this.cartContact(v)) {const speed=this.relativeSpeed(v);if(speed>=3.5){this.crash(v,speed);this.cartImpact(speed);}}
            for(const other of traffic.grid.near(v.mesh.position.x,v.mesh.position.z,4))
            {
                if(other===v||other.crashed>0)continue;
                if(this.contact(v,other.mesh.position,.24)&&Math.abs(v.speed-other.speed)+Math.abs(v.route.dx-other.route.dx)*v.speed>3)
                {const speed=v.speed;this.crash(v,speed);this.crash(other,speed);break;}
            }
        }
        old.copyFrom(p);
    }
}
