import {createCarriages} from './CarriageRoute.js';
import {animateClydesdales} from '../entities/ClydesdaleCarriage.js';
import { ACTOR_SCALE } from '../engine/ActorScale.js';
import { LocalGrid } from './LocalGrid.js';
import { TrafficNetwork } from './TrafficNetwork.js';
import { TrafficSignals } from './TrafficSignals.js';
import { trafficTemplates } from '../entities/TrafficVehicle.js';

export class CityTraffic
{
    constructor(map,player,cart,count=500)
    {
        this.map=map;this.player=player;this.cart=cart;this.time=0;this.recoveries=0;this.vehicles=[];this.reservations=new Map();this.grid=new LocalGrid();
        this.network=new TrafficNetwork(map);this.signals=new TrafficSignals(map,this.network);
        this.templates=trafficTemplates(map.scene);this.seed=314159;
        createCarriages(this);
        const edges=this.network.edges.filter(e=>e.length>22&&(!e.a.trafficZone||e.a.trafficZone!==e.b.trafficZone));
        if(!edges.length)throw new Error('No connected traffic streets');this.spawnEdges=edges;
        for(let i=0;i<count;i++)
        {
            const template=this.templates[i%this.templates.length];let route,distance,position;
            for(let attempt=0;attempt<2000;attempt++)
            {
                const edge=edges[Math.floor(this.random()*edges.length)];route=this.network.directed(edge,edge.oneway===1?edge.a:edge.oneway===-1?edge.b:this.random()<.5?edge.a:edge.b);distance=8+this.random()*(edge.length-16);position=this.network.point(route,distance);
                if(this.network.isClear(route,map)&&!map.isBlocked(position.x,position.z,ACTOR_SCALE,true)&&!this.vehicles.some(v=>Math.hypot(v.mesh.position.x-position.x,v.mesh.position.z-position.z)<8)&&Math.hypot(cart.position.x-position.x,cart.position.z-position.z)>12)break;
                if(attempt===1999)throw new Error('Unable to safely place traffic');
            }
            const mesh=template.mesh.createInstance(`Traffic ${i+1} ${template.kind}`);mesh.scaling.setAll(ACTOR_SCALE);mesh.isVisible=true;mesh.isPickable=false;
            const v={id:this.vehicles.length,mesh,route,distance,speed:0,maxSpeed:template.kind==='bicycle'?2.5:4+this.random()*3,length:template.length,kind:template.kind,turns:0,wait:0,committed:null,elapsed:0};
            if(template.rider){v.rider=template.rider.createInstance('Traffic rider '+i);v.rider.scaling.setAll(ACTOR_SCALE);v.rider.isVisible=true;v.rider.isPickable=false;}
            this.place(v);this.vehicles.push(v);
        }
        this.grid.rebuild(this.vehicles);
    }

    random(){this.seed=(1664525*this.seed+1013904223)>>>0;return this.seed/4294967296;}

    place(v)
    {
        const p=this.network.point(v.route,v.distance);
        v.mesh.position.set(p.x,this.map.terrain.getHeightAt(p.x,p.z)+.025,p.z);
        v.mesh.rotation.y=Math.atan2(v.route.dx,v.route.dz);
        if(v.rider){v.rider.position.copyFrom(v.mesh.position);v.rider.rotation.copyFrom(v.mesh.rotation);}
    }

    blocks(x,z,radius=0)
    {
        const home=this.homeCart;
        if(home&&home!==this.cart)
        {
            const dx=x-home.position.x,dz=z-home.position.z,a=home.rotation.y;
            const along=Math.max(0,Math.abs(dx*Math.sin(a)+dz*Math.cos(a))-home.length/2);
            const across=Math.max(0,Math.abs(dx*Math.cos(a)-dz*Math.sin(a))-home.collisionRadius);
            if(Math.hypot(along,across)<radius)return true;
        }
        return this.grid.near(x,z,radius+4).some(v=>
        {
            if(v.controlled)return false;
            const dx=x-v.mesh.position.x,dz=z-v.mesh.position.z;
            const along=Math.max(0,Math.abs(dx*v.route.dx+dz*v.route.dz)-v.length/2);
            const across=Math.max(0,Math.abs(dx*v.route.dz-dz*v.route.dx)-.85*ACTOR_SCALE);
            return Math.hypot(along,across)<radius;
        });
    }

    wouldOverlap(v,route,distance)
    {
        const p=this.network.point(route,distance),halfWidth=.85*ACTOR_SCALE;
        return this.grid.near(p.x,p.z,4).some(o=>{
            if(o===v||Math.abs(o.mesh.position.y-v.mesh.position.y)>1.5)return false;
            const dx=o.mesh.position.x-p.x,dz=o.mesh.position.z-p.z;
            // Let an already touching vehicle separate, rather than trapping both in place.
            const oldDistance=Math.hypot(o.mesh.position.x-v.mesh.position.x,o.mesh.position.z-v.mesh.position.z);
            if(Math.hypot(dx,dz)>oldDistance+.01)return false;
            for(const [x,z] of [[route.dx,route.dz],[-route.dz,route.dx],[o.route.dx,o.route.dz],[-o.route.dz,o.route.dx]]){
                const a=v.length/2*Math.abs(x*route.dx+z*route.dz)+halfWidth*Math.abs(x*route.dz-z*route.dx);
                const b=o.length/2*Math.abs(x*o.route.dx+z*o.route.dz)+halfWidth*Math.abs(x*o.route.dz-z*o.route.dx);
                if(Math.abs(dx*x+dz*z)>=a+b+.08)return false;
            }
            return true;
        });
    }

    recoverOffscreen(v)
    {
        // Ambient traffic may circulate again after a long blocked queue, never in view or under player control.
        if(v.fixedLoop||v.taken||v.wait<90||Math.hypot(v.mesh.position.x-this.player.position.x,v.mesh.position.z-this.player.position.z)<240)return false;
        for(let attempt=0;attempt<100;attempt++){
            const edge=this.spawnEdges[Math.floor(this.random()*this.spawnEdges.length)];
            const from=edge.oneway===1?edge.a:edge.oneway===-1?edge.b:this.random()<.5?edge.a:edge.b;
            const route=this.network.directed(edge,from),distance=8+this.random()*(edge.length-16),p=this.network.point(route,distance);
            if(Math.hypot(p.x-this.player.position.x,p.z-this.player.position.z)<240||Math.hypot(p.x-this.cart.position.x,p.z-this.cart.position.z)<20)continue;
            if(this.map.isBlocked(p.x,p.z,.9*ACTOR_SCALE,true)||this.vehicles.some(o=>o!==v&&Math.hypot(o.mesh.position.x-p.x,o.mesh.position.z-p.z)<8))continue;
            this.network.junctions.release(v);for(const zone of this.network.junctions.zones)zone.requests?.delete(v);
            Object.assign(v,{route,distance,speed:0,wait:0,path:[],plannedZone:null,waitReason:null});
            this.place(v);v.mesh.setEnabled(false);v.rider?.setEnabled(false);this.grid.rebuild(this.vehicles);this.recoveries++;return true;
        }
        return false;
    }

    update(delta)
    {
        const dt=Math.min(Math.max(delta,0),.05);this.time+=dt;this.signals.update(dt);
        for(const v of this.vehicles)this.network.junctions.clear(v);
        this.grid.rebuild(this.vehicles);
        for(const v of this.vehicles)
        {
            if(v.legs)animateClydesdales(v,dt);
            if(v.taken){v.route.dx=Math.sin(v.mesh.rotation.y);v.route.dz=Math.cos(v.mesh.rotation.y);v.mesh.setEnabled(true);continue;}
            if(this.recoverOffscreen(v))continue;
            const nearby=Math.hypot(v.mesh.position.x-this.player.position.x,v.mesh.position.z-this.player.position.z)<220;
            v.mesh.setEnabled(nearby);v.rider?.setEnabled(nearby);
            if(v.crashed>0)
            {
                v.crashed=Math.max(0,v.crashed-dt);v.speed=0;
                if(v.crashed===0){v.mesh.rotation.z=0;v.mesh.scaling.setAll(ACTOR_SCALE);this.place(v);}
                continue;
            }
            v.elapsed+=dt;
            if(!nearby&&v.elapsed<.2)continue;
            const step=v.elapsed;v.elapsed=0;
            const remaining=v.route.edge.length-v.distance,to=v.route.to;
            let stop=false,maxAdvance=Infinity;v.waitReason=null;
            if(!v.zone&&v.wait>36&&this.time-(v.lastReplan||0)>36){v.path=[];v.lastReplan=this.time;}
            this.network.junctions.plan(v,()=>this.random(),this.map);
            const zone=to.trafficZone,stopLine=Math.min(7,v.route.edge.length*.45);
            if(zone&&v.zone!==zone&&remaining<stopLine+2)
                {stop=!this.network.junctions.canEnter(v,this);if(stop){v.waitReason='junction';maxAdvance=Math.max(0,remaining-stopLine);}}
            const position=v.mesh.position;
            const obstacles=[...this.grid.near(position.x,position.z).filter(other=>other!==v).map(other=>({position:other.mesh.position,length:other.length})),{position:this.cart.position,length:this.cart.length||5.4}];
            if(this.homeCart&&this.homeCart!==this.cart)obstacles.push({position:this.homeCart.position,length:this.homeCart.length});
            if(!this.player.isDriving)obstacles.push({position:this.player.position,length:ACTOR_SCALE});
            for(const other of obstacles)
            {
                const dx=other.position.x-position.x,dz=other.position.z-position.z;
                const ahead=dx*v.route.dx+dz*v.route.dz,lateral=Math.abs(dx*v.route.dz-dz*v.route.dx);
                if(Math.abs(other.position.y-position.y)>1.5)continue;
                if(ahead>0&&lateral<1.65*ACTOR_SCALE){
                    const gap=Math.max(0,ahead-(v.length+other.length)/2-.35);maxAdvance=Math.min(maxAdvance,gap);
                    if(gap<v.speed*step+.7){stop=true;v.waitReason='vehicle';}
                }
            }
            const next=this.network.point(v.route,Math.min(v.route.edge.length,v.distance+v.maxSpeed*step));
            if(this.map.isBlocked(next.x,next.z,.9*ACTOR_SCALE,true)){stop=true;maxAdvance=0;v.waitReason='map';}
            v.speed=stop?Math.max(0,v.speed-22*step):Math.min(v.maxSpeed,v.speed+3*step);
            const advance=Math.min(v.speed*step,maxAdvance);if(advance<v.speed*step)v.speed=advance/step;
            const proposed=Math.min(v.route.edge.length,v.distance+advance);
            const turning=proposed>=v.route.edge.length-.001&&v.path.length>0;
            if(advance>0&&this.wouldOverlap(v,turning?v.path[0]:v.route,turning?0:proposed)){
                v.speed=0;v.wait+=step;v.waitReason='clearance';continue;
            }
            v.distance=proposed;v.wait=stop?v.wait+step:0;
            if(v.distance>=v.route.edge.length-.001)
            {
                if(!v.path.length){v.speed=0;v.waitReason='no legal route';continue;}
                v.route=v.path.shift();v.distance=0;v.turns++;v.committed=null;
            }
            this.place(v);
        }
    }
}
