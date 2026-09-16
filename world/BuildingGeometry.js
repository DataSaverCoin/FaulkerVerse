export function buildingBase(building, terrain)
{
    const heights=[];
    for(let i=1;i<building.points.length;i++)
    {
        const a=building.points[i-1],b=building.points[i];
        const count=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2));
        for(let j=0;j<=count;j++) heights.push(terrain.getGroundHeightAt(a[0]+(b[0]-a[0])*j/count,a[1]+(b[1]-a[1])*j/count));
    }
    return {base:Math.max(...heights),bottom:Math.min(...heights)-.5};
}

/* Concave footprint triangulation and ground-following foundations. */
export function buildingGeometry(building, terrain)
{
    let points = building.points.slice(0,-1).filter((p,i,a)=>!i || Math.hypot(p[0]-a[i-1][0],p[1]-a[i-1][1])>0.001);
    const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    const area=points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0);
    if(area<0) points.reverse();
    // Remove redundant collinear vertices before clipping ears.
    let changed=true;
    while(changed && points.length>3)
    {
        changed=false;
        for(let i=0;i<points.length;i++)
            if(Math.abs(cross(points[(i+points.length-1)%points.length],points[i],points[(i+1)%points.length]))<0.00001)
            {points.splice(i,1);changed=true;break;}
    }
    const remaining=points.map((_,i)=>i),triangles=[];
    while(remaining.length>3)
    {
        let clipped=false;
        for(let i=0;i<remaining.length;i++)
        {
            const a=remaining[(i+remaining.length-1)%remaining.length],b=remaining[i],c=remaining[(i+1)%remaining.length];
            if(cross(points[a],points[b],points[c])<=0.00001)continue;
            if(remaining.some(j=>j!==a&&j!==b&&j!==c && cross(points[a],points[b],points[j])>=-0.00001 && cross(points[b],points[c],points[j])>=-0.00001 && cross(points[c],points[a],points[j])>=-0.00001))continue;
            triangles.push(a,b,c);remaining.splice(i,1);clipped=true;break;
        }
        if(!clipped) break; // Invalid outlines must not produce enormous stray roof triangles.
    }
    if(remaining.length===3)triangles.push(...remaining);
    const positions=[],indices=[],uvs=[];
    const foundation=buildingBase(building,terrain);
    const base=building.baseElevation ?? foundation.base;
    const xs=points.map(p=>p[0]),zs=points.map(p=>p[1]);
    const span=Math.min(Math.max(...xs)-Math.min(...xs),Math.max(...zs)-Math.min(...zs));
    const shaped=['round','skillion','dome','gabled','hipped','pyramidal','quadruple_saltbox'].includes(building.roofShape);
    const roofRise=shaped?Math.min(building.height*.7,building.roofHeight || Math.min(span*.45,building.height*.35)):0;
    const roof=base+building.height-roofRise;
    const minimum=building.minHeight||0;
    for(let i=0;i<points.length;i++)
    {
        const a=points[i],b=points[(i+1)%points.length],n=positions.length/3;
        const bottomA=minimum?base+minimum:foundation.bottom;
        const bottomB=minimum?base+minimum:foundation.bottom;
        positions.push(a[0],bottomA,a[1],b[0],bottomB,b[1],b[0],roof,b[1],a[0],roof,a[1]);
        const bays=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/1.25));
        const floors=Math.max(.1,building.levels||(roof-base)/1.05);
        uvs.push(0,(bottomA-base)/(roof-base||1)*floors,bays,(bottomB-base)/(roof-base||1)*floors,bays,floors,0,floors);
        indices.push(n,n+1,n+2,n,n+2,n+3);
    }
    const offset=positions.length/3;
    const wallIndexCount=indices.length;
    for(const p of points) {positions.push(p[0],roof,p[1]);uvs.push(p[0]/5,p[1]/5);}
    if(remaining.length===3)indices.push(...triangles.map(i=>i+offset));
    return {positions,indices,uvs,wallIndexCount,roof,roofRise,points,roofTriangles:remaining.length===3?triangles:[]};
}
