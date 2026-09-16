/* North-up local and regional maps use the same geometry as the drivable world. */
"use strict";

import { StreetLabels } from "./StreetLabels.js";

export class DowntownHUD
{
    constructor(session) { this.session=session; this.map=session.terrain.downtown; this.regional=false; }
    initialize()
    {
        this.root=document.createElement('section');
        this.root.id='downtownMap';
        this.root.innerHTML=`<header>SAINT LOUIS <span>3 MILE RADIUS</span><button type="button" aria-label="Collapse map">−</button></header>
            <canvas width="520" height="340" aria-label="Live Saint Louis street map. North is up."></canvas>
            <button type="button" class="trainView">View train (F7)</button><button type="button" class="mapZoom">Show entire region</button>
            <div class="mapStreet"></div><div class="mapGeology"></div>
            <div class="mapLegend">● You · <b>● Pickup</b> · <i>● Drop-off</i> · N ↑</div>
            <small>WASD move / drive · E enter / exit · Space brake<br>F1–F3 downtown · F4 South Grand · F5 West End<br>F6 North Grand · F7 Union Station / train<br>M map · F8 overview<br>Stylized geology & elevations · distances at 30% scale</small>
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors · ODbL</a>`;
        document.body.appendChild(this.root);
        this.root.querySelector('.trainView').onclick=()=>this.session.viewTrain();
        this.canvas=this.root.querySelector('canvas');this.context=this.canvas.getContext('2d');
        this.streetLabels=new StreetLabels(this.map.roads);
        this.street=this.root.querySelector('.mapStreet');this.geology=this.root.querySelector('.mapGeology');
        this.root.querySelector('header button').onclick=()=>{if(this.root.closest('.hudMapSlot'))this.session.toggleMap();else this.root.classList.toggle('collapsed');};
        this.root.querySelector('.mapZoom').onclick=()=>
        {
            this.regional=!this.regional;
            this.root.querySelector('.mapZoom').textContent=this.regional?'Follow my location':'Show entire region';
        };
        window.addEventListener('keydown',event=>{if(event.code==='KeyM'&&!event.repeat){if(document.body.classList.contains('touchMode'))this.session.toggleMap?.();else this.root.classList.toggle('collapsed');}});
        this.background=document.createElement('canvas');this.background.width=1600;this.background.height=1600;
        this.extent=this.map.geology.radius*1.04;
        const ctx=this.background.getContext('2d');
        ctx.fillStyle='#233c32';ctx.fillRect(0,0,1600,1600);
        ctx.strokeStyle='#34718a';ctx.lineWidth=182/this.extent*800;
        for(const line of this.map.geology.rivers)
        {
            for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i];ctx.lineWidth=2*this.map.geology.halfWidth((a[1]+b[1])/2)/this.extent*800;ctx.beginPath();ctx.moveTo(...this.atlas(...a));ctx.lineTo(...this.atlas(...b));ctx.stroke();}
        }
        ctx.fillStyle='#68726c';
        for(const polygon of this.map.buildings)
        {
            ctx.beginPath();polygon.forEach((p,i)=>{const q=this.atlas(...p);i?ctx.lineTo(...q):ctx.moveTo(...q);});ctx.fill();
        }
        if(this.map.stadiumBounds)
        {
            ctx.fillStyle='#965d4b';ctx.beginPath();
            for(const ring of [this.map.stadiumBounds.points,...this.map.stadiumBounds.holes])
            {ring.forEach((p,i)=>{const q=this.atlas(...p);i?ctx.lineTo(...q):ctx.moveTo(...q);});ctx.closePath();}
            ctx.fill('evenodd');
        }
        ctx.strokeStyle='#9baba3';ctx.lineWidth=1;
        for(const {a,b} of this.map.roads){ctx.beginPath();ctx.moveTo(...this.atlas(...a));ctx.lineTo(...this.atlas(...b));ctx.stroke();}
        ctx.fillStyle='#d0b77e';
        for(const p of this.map.geology.outcrops){ctx.beginPath();ctx.arc(...this.atlas(p.x,p.z),3,0,Math.PI*2);ctx.fill();}
        ctx.strokeStyle='#efc36e';ctx.lineWidth=3;ctx.beginPath();ctx.arc(800,800,this.map.geology.radius/this.extent*800,0,Math.PI*2);ctx.stroke();
    }
    atlas(x,z) { return [800+x/this.extent*800,800-z/this.extent*800]; }
    project(x,z) { return [260+(x-this.center.x)*this.zoom,170-(z-this.center.z)*this.zoom]; }
    update()
    {
        if(performance.now()-(this.lastUpdate||0)<100)return;
        this.lastUpdate=performance.now();
        const ctx=this.context,ride=this.session.rideSystem,p=this.session.player.position;
        this.center=this.regional?{x:0,z:0}:p;
        this.zoom=this.regional?160/this.extent:0.65;
        const factor=this.extent/800,sourceWidth=520/this.zoom/factor,sourceHeight=340/this.zoom/factor;
        const center=this.atlas(this.center.x,this.center.z);
        ctx.fillStyle='#152329';ctx.fillRect(0,0,520,340);
        ctx.drawImage(this.background,center[0]-sourceWidth/2,center[1]-sourceHeight/2,sourceWidth,sourceHeight,0,0,520,340);
        const route=this.session.route;
        if(route?.points.length){ctx.strokeStyle=route.color;ctx.lineWidth=3;ctx.beginPath();route.points.forEach((p,i)=>{const q=this.project(...p);i?ctx.lineTo(...q):ctx.moveTo(...q);});ctx.stroke();}
        const dot=(point,color,r)=>{if(!point)return;ctx.fillStyle=color;ctx.beginPath();ctx.arc(...this.project(point.x,point.z),r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#102329';ctx.lineWidth=2;ctx.stroke();};
        const occupied = [{x:246,y:156,w:28,h:28}];
        const destination=ride.state==='DRIVING_TO_DESTINATION'?ride.destination:ride.pickup;
        if(destination) { const [x,y]=this.project(destination.x,destination.z);occupied.push({x:x-12,y:y-12,w:24,h:24}); }
        this.streetLabels.draw(this,occupied);
        ctx.font='12px system-ui';ctx.fillStyle='#f2e6cb';
        for(const stop of this.map.stops)
        {
            const [x,y]=this.project(stop.x,stop.z);
            const box={x:x+5,y:y-20,w:ctx.measureText(stop.name).width,h:16};
            if(x>0&&x<480&&y>15&&y<295&&!this.regional &&
                !occupied.some(a=>box.x<a.x+a.w&&box.x+box.w>a.x&&box.y<a.y+a.h&&box.y+box.h>a.y))
            { ctx.fillText(stop.name,x+5,y-7);occupied.push(box); }
        }
        if(ride.state!=='COMPLETED')dot(ride.state==='DRIVING_TO_DESTINATION'?ride.destination:ride.pickup,ride.state==='DRIVING_TO_DESTINATION'?'#42d8ff':'#ffc247',6);
        dot(this.map.wheel?.entrance,'#b294ff',7);
        dot(this.map.riverfront?.entrance,'#ffd878',7);
        if(this.map.riverfront?.entrance){const [hx,hy]=this.project(this.map.riverfront.entrance.x,this.map.riverfront.entrance.z);ctx.fillStyle='#ffd878';ctx.fillText('Helicopter boarding',hx+10,hy);}
        if(this.map.wheel?.entrance){const [wx,wy]=this.project(this.map.wheel.entrance.x,this.map.wheel.entrance.z);ctx.fillStyle='#dbcaff';ctx.fillText('Ferris wheel boarding',wx+10,wy);}
        dot(p,'#ffffff',5);
        const [px,py]=this.project(p.x,p.z),yaw=this.session.player.rotation.y;
        ctx.save();ctx.translate(px,py);ctx.rotate(yaw);ctx.fillStyle='#ffffff';ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(-6,4);ctx.lineTo(6,4);ctx.closePath();ctx.fill();ctx.restore();
        ctx.font='bold 17px system-ui';ctx.fillStyle='#ffffff';ctx.fillText('N ↑',15,24);ctx.fillText('S',250,333);ctx.fillText('W',8,170);ctx.fillText('E',503,170);
        const miles=Math.hypot(p.x,p.z)/(1609.344*this.map.data.scale);
        this.street.textContent=`${this.map.nearestRoad(p.x,p.z).street||'Saint Louis'} · ${miles.toFixed(1)} / 5 mi`;
        this.geology.textContent=this.map.geology.describe(p.x,p.z) + (p.x > 1280 || (p.x > 640 && p.z > 635) ? " · limited street detail" : "");
        ctx.strokeStyle='#fff';ctx.lineWidth=2;
        const bar=(this.regional?1609.344:160.9344)*this.map.data.scale*this.zoom;
        ctx.beginPath();ctx.moveTo(14,319);ctx.lineTo(14+bar,319);ctx.stroke();
        ctx.fillStyle='#fff';ctx.fillText(this.regional?'1 mile':'0.1 mile',14,311);
    }
}
