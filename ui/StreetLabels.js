/* Join OSM fragments by street name, then place readable labels on straight runs. */
export class StreetLabels
{
    constructor(roads)
    {
        const names = new Map();
        const anonymous = /^(Residential|Unclassified|Living Street|Motorway|Trunk|Primary|Secondary|Tertiary)( Link)?$/;
        for (const road of roads)
        {
            if (!road.name || anonymous.test(road.name)) continue;
            if (!names.has(road.name)) names.set(road.name, new Map());
            const nodes = names.get(road.name);
            const keys = [road.a,road.b].map(point =>
            {
                const key = point.map(n=>n.toFixed(1)).join(':');
                if (!nodes.has(key)) nodes.set(key, {point, edges:[]});
                return key;
            });
            if (keys[0] === keys[1]) continue;
            const edge = {a:keys[0], b:keys[1], used:false};
            nodes.get(keys[0]).edges.push(edge);
            nodes.get(keys[1]).edges.push(edge);
        }
        this.paths = [];
        for (const [name,nodes] of names)
        {
            const starts = [...nodes].sort((a,b)=>(b[1].edges.length!==2)-(a[1].edges.length!==2));
            for (const [key,node] of starts)
            {
                for (const first of node.edges)
                {
                    if (first.used) continue;
                    const points = [node.point];
                    let current = key, edge = first;
                    while (edge && !edge.used)
                    {
                        edge.used = true;
                        current = edge.a === current ? edge.b : edge.a;
                        const next = nodes.get(current);
                        points.push(next.point);
                        edge = next.edges.length === 2 ? next.edges.find(e=>!e.used) : null;
                    }
                    const lengths = [0];
                    for (let i=1;i<points.length;i++) lengths.push(lengths[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
                    if (lengths.at(-1)<35) continue;
                    const xs=points.map(p=>p[0]),zs=points.map(p=>p[1]);
                    this.paths.push({name,points,lengths,total:lengths.at(-1),
                        minX:Math.min(...xs),maxX:Math.max(...xs),minZ:Math.min(...zs),maxZ:Math.max(...zs)});
                }
            }
        }
        this.lastLabels = [];
    }

    sample(path,distance)
    {
        const i = path.lengths.findIndex(d=>d>=distance);
        if (i<=0) return path.points[0];
        const a=path.points[i-1],b=path.points[i];
        const t=(distance-path.lengths[i-1])/(path.lengths[i]-path.lengths[i-1] || 1);
        return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
    }

    draw(hud, occupied)
    {
        const ctx=hud.context, candidates=[];
        ctx.font=hud.regional?'600 20px system-ui':'600 23px system-ui';
        const halfWidth=260/hud.zoom,halfHeight=170/hud.zoom;
        for (const path of this.paths)
        {
            if (path.maxX<hud.center.x-halfWidth || path.minX>hud.center.x+halfWidth ||
                path.maxZ<hud.center.z-halfHeight || path.minZ>hud.center.z+halfHeight) continue;
            let text=path.name.replace(/\b(North|South|East|West|Street|Avenue|Boulevard|Drive|Road|Parkway)\b/g,
                word=>({North:'N',South:'S',East:'E',West:'W',Street:'St',Avenue:'Ave',Boulevard:'Blvd',Drive:'Dr',Road:'Rd',Parkway:'Pkwy'})[word]);
            if (hud.regional) text=text.replace(/^[NSEW] /,'');
            const width=ctx.measureText(text).width, half=(width+12)/hud.zoom/2;
            if (path.total<half*2) continue;
            for (let distance=half;distance<=path.total-half;distance+=Math.max(half,60))
            {
                const p=hud.project(...this.sample(path,distance));
                const a=hud.project(...this.sample(path,distance-half)),b=hud.project(...this.sample(path,distance+half));
                if (Math.hypot(b[0]-a[0],b[1]-a[1])<width) continue;
                // Curving or folded runs cannot support a straight printed name.
                if (Math.hypot(p[0]-(a[0]+b[0])/2,p[1]-(a[1]+b[1])/2)>6) continue;
                if ([0.25,0.75].some(t=>
                {
                    const q=hud.project(...this.sample(path,distance-half+2*half*t));
                    return Math.hypot(q[0]-a[0]-(b[0]-a[0])*t,q[1]-a[1]-(b[1]-a[1])*t)>6;
                })) continue;
                let angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
                if(angle>Math.PI/2)angle-=Math.PI;
                if(angle< -Math.PI/2)angle+=Math.PI;
                const w=Math.abs(Math.cos(angle))*width+Math.abs(Math.sin(angle))*26+12;
                const h=Math.abs(Math.sin(angle))*width+Math.abs(Math.cos(angle))*26+12;
                const box={x:p[0]-w/2,y:p[1]-h/2,w,h};
                if(box.x<8 || box.y<8 || box.x+w>512 || box.y+h>295)continue;
                candidates.push({name:path.name,text,p,angle,box,score:Math.hypot(p[0]-260,p[1]-170)});
            }
        }
        candidates.sort((a,b)=>a.score-b.score);
        const used=new Set();this.lastLabels=[];
        for(const label of candidates)
        {
            if(used.has(label.name))continue;
            const b=label.box;
            if(occupied.some(a=>b.x<a.x+a.w && b.x+b.w>a.x && b.y<a.y+a.h && b.y+b.h>a.y))continue;
            occupied.push(b);used.add(label.name);this.lastLabels.push(label);
            ctx.save();ctx.translate(...label.p);ctx.rotate(label.angle);
            ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
            ctx.lineWidth=5;ctx.strokeStyle='#182c30';ctx.fillStyle='#f5f1de';
            ctx.strokeText(label.text,0,0);ctx.fillText(label.text,0,0);ctx.restore();
            if(this.lastLabels.length>=12)break;
        }
    }
}
