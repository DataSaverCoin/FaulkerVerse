import { buildingGeometry } from './BuildingGeometry.js';
import { insideFootprint } from './BuildingFootprints.js';
import { ScenicGeometry } from './ScenicGeometry.js';

export function createCorridorParking(map)
{
    const cells=new Map();map.parkingAudit=[];
    for(const lot of map.parkingData.lots)
    {
        const xs=lot.points.map(p=>p[0]),zs=lot.points.map(p=>p[1]),cx=(Math.min(...xs)+Math.max(...xs))/2,cz=(Math.min(...zs)+Math.max(...zs))/2;
        const key=`${Math.floor(cx/100)}:${Math.floor(cz/100)}`;if(!cells.has(key))cells.set(key,new ScenicGeometry(map.scene,`Mapped parking ${key}`));const g=cells.get(key);
        const asphalt=g.material('asphalt','#424a4b'),paint=g.material('parking stall paint','#d8d6b9');
        const geometry=buildingGeometry({...lot,height:.02,baseElevation:0},map.terrain),data=new BABYLON.VertexData();
        data.positions=geometry.positions;for(let i=0;i<data.positions.length;i+=3)data.positions[i+1]=map.terrain.getGroundHeightAt(data.positions[i],data.positions[i+2])+.028;
        data.indices=geometry.indices.slice(geometry.wallIndexCount);data.normals=[];BABYLON.VertexData.ComputeNormals(data.positions,data.indices,data.normals);
        const mesh=new BABYLON.Mesh(lot.name,map.scene);data.applyToMesh(mesh);asphalt.backFaceCulling=false;g.add(mesh,asphalt);
        let spaces=0;
        const safe=(x,z)=>insideFootprint(x,z,lot.points)&&!map.isBlocked(x,z,.2,true)&&map.surface.height(x,z)===null;
        // A sparse grid of marked bays leaves a center aisle; only paint inside the mapped lot.
        for(let x=Math.min(...xs)+1;x<Math.max(...xs)-1;x+=1.15)for(let z=Math.min(...zs)+1;z<Math.max(...zs)-1;z+=5)
        {
            if(![[-.5,-.9],[.5,-.9],[-.5,.9],[.5,.9]].every(([dx,dz])=>safe(x+dx,z+dz)))continue;
            const y=map.terrain.getGroundHeightAt(x,z)+.038;g.box('stall line',x,y,z,.025,.012,1.85,paint);spaces++;
            if(spaces%9===0&&spaces<90)
            {
                const body=g.material(`parked car ${spaces%3}`,['#aeb5b0','#914943','#354b62'][spaces%3]),glass=g.material('parked windshields','#334b57');
                g.box('parked car body',x+.47,y+.22,z,.68,.36,1.45,body);g.box('parked car cabin',x+.47,y+.48,z-.1,.59,.24,.74,glass);
            }
        }
        map.parkingAudit.push({osmId:lot.osmId,name:lot.name,spaces});
    }
    for(const g of cells.values())g.finish();
}
