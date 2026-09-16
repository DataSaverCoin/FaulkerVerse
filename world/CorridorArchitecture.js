import { ScenicGeometry } from './ScenicGeometry.js';
import { landmarkSign } from './LandmarkArchitecture.js';

/* Apply facade depth to every mapped frontage along mapped downtown and Broadway streets. */
export function prepareCorridors(map)
{
    const roads=map.roads.filter(r=>/^(North Broadway|South Broadway|Washington Avenue|Market Street)$/.test(r.name));map.corridorBuildings=[];
    const distance=(x,z,r)=>{const dx=r.b[0]-r.a[0],dz=r.b[1]-r.a[1],t=Math.max(0,Math.min(1,((x-r.a[0])*dx+(z-r.a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-r.a[0]-dx*t,z-r.a[1]-dz*t);};
    for(const b of map.data.buildings)
    {
        let street=null;
        for(let i=0;i<b.points.length&&!street;i++)
        {
            const a=b.points[i],c=b.points[(i+1)%b.points.length],x=(a[0]+c[0])/2,z=(a[1]+c[1])/2;
            street=roads.find(r=>distance(x,z,r)<r.width/2+5)?.name;
        }
        if(street){b.corridor=street;map.corridorBuildings.push(b);}
    }
}

export function createCorridorDetails(map)
{
    const cells=new Map(),audit=[];
    for(const b of map.corridorBuildings)
    {
        if(/Stifel|Union Station|Enterprise|Courthouse/i.test(b.name))continue;
        const cx=b.points.reduce((s,p)=>s+p[0],0)/b.points.length,cz=b.points.reduce((s,p)=>s+p[1],0)/b.points.length;
        const key=`${Math.floor(cx/100)}:${Math.floor(cz/100)}`;
        if(!cells.has(key))cells.set(key,new ScenicGeometry(map.scene,`Street frontage ${key}`));const g=cells.get(key);
        const pale=/Ely Walker|Meridian|Railway|Terra Cotta|Dorsa|Banker/i.test(b.name)||/stone|concrete/.test(b.material||'');
        const trim=g.material(pale?'ivory terra cotta':'sandstone lintels',pale?'#d6cbb3':'#b9a082'),iron=g.material('dark cast iron','#334347');
        const base=b.baseElevation??map.terrain.getGroundHeightAt(cx,cz),height=b.height,floors=Math.max(1,b.levels||Math.round(height/1.05));
        const garage=/garage|parking/i.test(b.name)||b.kind==='parking';
        const edges=[];
        for(let i=1;i<b.points.length;i++)
        {
            const a=b.points[i-1],c=b.points[i],dx=c[0]-a[0],dz=c[1]-a[1],l=Math.hypot(dx,dz);if(l<3)continue;
            let nx=dz/l,nz=-dx/l;const x=(a[0]+c[0])/2,z=(a[1]+c[1])/2;if(nx*(x-cx)+nz*(z-cz)<0){nx=-nx;nz=-nz;}
            if(map.nearestRoad(x+nx,z+nz).distance>12)continue;
            const angle=Math.atan2(-dz,dx);edges.push({x,z,l,nx,nz,angle});
            // Keep projecting trim inside the mapped frontage to preserve road clearance.
            for(const [y,h,d] of [[height-.08,.19,.34],[height-.32,.11,.26],[1.35,.11,.16]])if(y<height)
                g.box('layered cornice / storefront lintel',x-nx*.08,base+y,z-nz*.08,l,h,d,trim,angle);
            const bays=Math.max(1,Math.floor(l/1.6));
            for(let j=0;j<=bays;j++)
            {
                const t=j/bays,px=a[0]+dx*t-nx*.1,pz=a[1]+dz*t-nz*.1;
                g.box('projecting masonry pier',px,base+height/2,pz,.12,height,.18,trim,angle);
            }
            for(let f=1;f<floors;f++)
            {
                const y=base+f*height/floors;
                if(garage){g.box('exposed parking slab',x,y,z,l,.14,.3,trim,angle);continue;}
                for(let j=0;j<bays;j++){const t=(j+.5)/bays;g.box('window sill with depth',a[0]+dx*t,y,c[1]-dz*(1-t),l/bays*.64,.075,.18,trim,angle);}
            }
            if(!garage&&/Washington Avenue|Broadway/.test(b.corridor))
            {
                for(let j=0;j<Math.min(4,bays);j++)
                {
                    const t=(j+.5)/Math.min(4,bays),px=a[0]+dx*t,pz=a[1]+dz*t;
                    g.box('cast iron storefront mullion',px,base+.65,pz,.065,1.3,.11,iron,angle);
                }
            }
        }
        if(garage&&edges.length){const e=edges.sort((a,b)=>b.l-a.l)[0],sign=landmarkSign(map.scene,'P  PARKING','#285e78',Math.min(4,e.l*.6),.55);sign.position.set(e.x+e.nx*.03,base+1.1,e.z+e.nz*.03);sign.rotation.y=e.angle;}
        audit.push({osmId:b.osmId||null,name:b.name||'Unnamed mapped building',street:b.corridor,frontages:edges.length,garage});
    }
    for(const g of cells.values())g.finish();map.corridorAudit=audit;
}
