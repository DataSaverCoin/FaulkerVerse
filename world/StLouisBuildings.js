import { RenderProfile, yieldForBrowser } from "../engine/RenderProfile.js";
import { insideCityPark } from './CityPark.js';
import { createLocalLandmark } from './LocalLandmarks.js';
import { localLandmark } from './LocalLandmarkProfiles.js';
import { unionStationDetails } from './UnionStationDetails.js';
import { downtownFacade, facadeGeometry, lobbyGeometry } from './DowntownFacades.js';
import { arenaKind, createArena, landmarkSign } from './LandmarkArchitecture.js';
import { buildingGeometry, buildingBase } from './BuildingGeometry.js';
import { StLouisMaterials } from './StLouisMaterials.js';
import { shapedRoof } from './StLouisRoofs.js';
import { insideFootprint } from './BuildingFootprints.js';

export async function createStLouisBuildings(map)
{
    const palette=new StLouisMaterials(map.scene),groups=new Map();map.architecture=palette;
    const add=(key,mesh,material)=>{
        mesh.material=material;if(!groups.has(key))groups.set(key,[]);
        const batch=groups.get(key);batch.push(mesh);
        // Release temporary meshes throughout construction instead of holding the whole city.
        if(RenderProfile.lite&&batch.length>=8){const merged=BABYLON.Mesh.MergeMeshes(batch,true,true);merged.material=material;groups.set(key,[merged]);}
    };
    const inStadium=b=>map.data.stadium&&insideFootprint(
        b.points.reduce((sum,p)=>sum+p[0],0)/b.points.length,
        b.points.reduce((sum,p)=>sum+p[1],0)/b.points.length,map.data.stadium.points);
    const parents=map.data.buildings.filter(b=>!inStadium(b)&&!insideCityPark(map,b));
    for(const building of parents)
    {
        if(String(building.osmId)==='108705187'){building.roofShape='round';building.roofHeight=1.8;building.roofColour='#707976';}
        if(String(building.osmId)==='108704347'){building.height=18.9;building.levels=18;}
        building.baseElevation=buildingBase(building,map.terrain).base;
        map.buildings.push(building.points);map.buildingIndex.insert(building.points,building.points,8);
    }
    const shape=b=>[...new Set(b.points.map(p=>p.join(':')))].sort().join('|');
    // The Arch already has a dedicated steel mesh. OSM's segmented approximation
    // must not also become windowed office-building extrusions.
    const landmarkParts=new Set(map.data.arch.buildingPartIds||[]);
    const parts=(map.data.buildingParts||[]).filter(part=>!landmarkParts.has(part.osmId)&&!inStadium(part)&&!insideCityPark(map,part)).map(part=>
    {
        const x=part.points.reduce((s,p)=>s+p[0],0)/part.points.length,z=part.points.reduce((s,p)=>s+p[1],0)/part.points.length;
        const parent=parents.find(b=>insideFootprint(x,z,b.points));
        if(parent && (arenaKind(parent)||localLandmark(parent)))return null;
        return {...part,facadeProfile:parent?downtownFacade(parent):null,kind:part.kind||parent?.kind,baseElevation:parent?.baseElevation,name:part.name||parent?.name||'',material:part.material||parent?.material||''};
    }).filter(Boolean);
    const partShapes=new Set(parts.map(shape));
    const unique=new Map();
    for(const b of [...parents.filter(b=>!partShapes.has(shape(b))),...parts])
    {
        const key=shape(b)+':'+(b.minHeight||0);
        if(!unique.has(key)||unique.get(key).height<b.height)unique.set(key,b);
    }
    const records=[...unique.values()];
    map.renderedBuildings=[];
    const signed=new Set();
    let batch=0;
    for(const building of records)
    {
        if(RenderProfile.lite&&++batch%32===0)await yieldForBrowser();
        if(building.points.length<4)continue;
        if(createLocalLandmark(map,building))continue;
        if(arenaKind(building)){createArena(map,building);continue;}
        const geometry=buildingGeometry(building,map.terrain),style=palette.style(building),roofStyle=palette.roof(building);
        const wallMaterial=palette.mappedMaterial("wall",style,building.colour),roofMaterial=palette.mappedMaterial("roof",roofStyle,building.roofColour);
        const enhanced=!RenderProfile.lite&&downtownFacade(building);
        if(enhanced||/Broadway/.test(building.corridor||''))facadeGeometry(geometry,building);
        const tile=`${Math.floor(building.points[0][0]/200)}:${Math.floor(building.points[0][1]/200)}`;
        const make=(name,indices)=>
        {
            const mesh=new BABYLON.Mesh(name,map.scene),data=new BABYLON.VertexData();
            data.positions=geometry.positions;data.indices=indices;data.uvs=geometry.uvs;data.normals=[];
            BABYLON.VertexData.ComputeNormals(data.positions,indices,data.normals);data.applyToMesh(mesh);return mesh;
        };
        add(`${style}:${building.colour||""}:${tile}`,make(building.name||'STL facade',geometry.indices.slice(0,geometry.wallIndexCount)),wallMaterial);
        if(enhanced&&(Math.hypot(...building.points[0])<700||/hotel|retail|commercial/.test(building.kind||''))&&!building.minHeight&&style!=='city-parking'&&style!=='city-warehouse')
        {
            const lobby=lobbyGeometry(geometry,map.scene);
            if(lobby)add(`${style}-lobby:${tile}`,lobby,palette.walls[`${style}-lobby`]);
            if(building.name&&!style.startsWith('city-')&&!signed.has(building.name))
            {
                const edges=geometry.points.map((a,i)=>({a,b:geometry.points[(i+1)%geometry.points.length]}));
                edges.sort((a,b)=>Math.hypot(b.b[0]-b.a[0],b.b[1]-b.a[1])-Math.hypot(a.b[0]-a.a[0],a.b[1]-a.a[1]));
                const {a,b}=edges[0],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
                if(length>5)
                {
                    const text=building.name.replace(/ St\.? Louis.*$/,'').replace(/ at the Arch.*$/,'');
                    const sign=landmarkSign(map.scene,text,style==='village-brick'?'#8d292b':'#304c48',Math.min(18,length*.8),.85);
                    sign.position.set((a[0]+b[0])/2+dz/length*.05,Math.min((building.baseElevation||0)+1.8,geometry.roof-.5),(a[1]+b[1])/2-dx/length*.05);
                    sign.rotation.y=Math.atan2(-dz,dx);signed.add(building.name);
                }
            }
        }
        if(style==='hotel-drury'||style==='hotel-hyatt')
        {
            const cx=geometry.points.reduce((sum,p)=>sum+p[0],0)/geometry.points.length;
            const cz=geometry.points.reduce((sum,p)=>sum+p[1],0)/geometry.points.length;
            const rings=[geometry.roof+.03,geometry.roof+.45].map(y=>geometry.points.concat([geometry.points[0]]).map(p=>new BABYLON.Vector3(cx+(p[0]-cx)*.985,y,cz+(p[1]-cz)*.985)));
            const crown=BABYLON.MeshBuilder.CreateRibbon(`${building.name} roof cornice`,{pathArray:rings,sideOrientation:BABYLON.Mesh.DOUBLESIDE},map.scene);
            add(`hotel-cornice:${tile}`,crown,palette.roofs.stone);
        }
        if(geometry.roofRise>0)
        {
            const roof=shapedRoof(building,geometry,map.scene,roofMaterial);
            add(`roof-${roofStyle}:${building.roofColour||""}:${tile}`,roof,roofMaterial);
        }
        else add(`roof-${roofStyle}:${building.roofColour||""}:${tile}`,make('Roof',geometry.indices.slice(geometry.wallIndexCount)),roofMaterial);
        map.renderedBuildings.push({name:building.name,osmId:building.osmId,top:geometry.roof+geometry.roofRise,style,x:building.points.reduce((sum,p)=>sum+p[0],0)/building.points.length,z:building.points.reduce((sum,p)=>sum+p[1],0)/building.points.length,roofShape:building.roofShape||'flat'});
    }
    unionStationDetails(map);
    for(const [key,meshes] of groups)
    {
        const material=meshes[0].material;
        const merged=BABYLON.Mesh.MergeMeshes(meshes,true,true);
        if(!merged)continue;merged.name=`STL architecture ${key}`;merged.material=material;merged.checkCollisions=true;merged.freezeWorldMatrix();
    }
}
