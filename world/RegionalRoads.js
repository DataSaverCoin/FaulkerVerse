import {roadDirection} from './RoadDirections.js';
import { roadElevation } from './RiverBridges.js';
function roadOffset(points,index,half)
{
    const a=points[Math.max(0,index-1)],p=points[index],b=points[Math.min(points.length-1,index+1)];
    let dx=p[0]-a[0],dz=p[1]-a[1],ex=b[0]-p[0],ez=b[1]-p[1];
    if(Math.hypot(dx,dz)<0.001){dx=ex;dz=ez;}
    if(Math.hypot(ex,ez)<0.001){ex=dx;ez=dz;}
    const length=Math.hypot(dx,dz)||1,next=Math.hypot(ex,ez)||1;
    let nx=dz/length+ez/next,nz=-dx/length-ex/next;
    const n=Math.hypot(nx,nz);
    if(n<0.001)return [half*dz/length,-half*dx/length];
    nx/=n;nz/=n;
    const scale=Math.min(half*2,half/Math.max(0.5,nx*dz/length-nz*dx/length));
    return [nx*scale,nz*scale];
}

/* Batch road triangles by spatial cell; drape surfaces over regional terrain. */
export function createRegionalRoads(map)
{
    const groups=new Map();
    for(const road of map.data.roads)
    {
        const width=road.width*1.35;
        for(let i=1;i<road.points.length;i++)
        {
            const a=road.points[i-1], b=road.points[i];
            const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
            if(length<0.1) continue;
            const segment={a,b,width,name:road.name,bridge:road.bridge,oneway:roadDirection(a,b,map.roadDirections)};
            map.roads.push(segment);
            map.roadIndex.insert(segment,[a,b],110);
            if(road.bridge) map.bridges.insert(segment,[a,b],width);
            const count=Math.ceil(length/3);
            for(let j=0;j<count;j++)
            {
                const p=[a[0]+dx*j/count,a[1]+dz*j/count],q=[a[0]+dx*(j+1)/count,a[1]+dz*(j+1)/count];
                for(const type of ['sidewalk','road'])
                {
                    const key=`${type}:${Math.floor(p[0]/200)}:${Math.floor(p[1]/200)}`;
                    if(!groups.has(key)) groups.set(key,{positions:[],indices:[]});
                    const batch=groups.get(key), n=batch.positions.length/3;
                    const half=(width+(type==='sidewalk'?1.4:0))/2;
                    const vertices=[];
                    for(const [point,side] of [[p,-1],[p,1],[q,-1],[q,1]])
                    {
                        const start=roadOffset(road.points,i-1,half),end=roadOffset(road.points,i,half);
                        const t=point===p?j/count:(j+1)/count;
                        const x=point[0]+side*(start[0]+(end[0]-start[0])*t);
                        const z=point[1]+side*(start[1]+(end[1]-start[1])*t);
                        const y=roadElevation(map,road,x,z);
                        const vertex=[x,y+(type==='road'?0.16:0.12),z];
                        vertices.push(vertex);
                        batch.positions.push(...vertex);
                    }
                    if(type==='road') map.surface.add(vertices);
                    batch.indices.push(n,n+1,n+2,n+1,n+3,n+2);
                }
            }
        }
    }
    for(const [key,data] of groups)
    {
        const mesh=new BABYLON.Mesh(`Regional ${key}`,map.scene),vertices=new BABYLON.VertexData();
        vertices.positions=data.positions;vertices.indices=data.indices;vertices.normals=[];
        BABYLON.VertexData.ComputeNormals(vertices.positions,vertices.indices,vertices.normals);
        vertices.applyToMesh(mesh);mesh.material=map.materials[key.split(':')[0]];
        mesh.material.backFaceCulling=false;mesh.freezeWorldMatrix();
    }
}
