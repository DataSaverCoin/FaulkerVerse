import { insideFootprint } from './BuildingFootprints.js';
/* Landmark additions stay inside the mapped station footprint. */
export function unionStationDetails(map)
{
    const building=map.data.buildings.find(b=>String(b.osmId)==='108705187');if(!building)return;
    const points=building.points,xs=points.map(p=>p[0]),zs=points.map(p=>p[1]);let site=null;
    for(let x=Math.min(...xs)+3;x<Math.max(...xs)-3;x+=1)for(let z=Math.min(...zs)+3;z<Math.max(...zs)-3;z+=1)
        if([-2.5,2.5].every(dx=>[-2.5,2.5].every(dz=>insideFootprint(x+dx,z+dz,points)))&&(!site||x+z>site.x+site.z))site={x,z};
    if(!site)return;
    const scene=map.scene,root=new BABYLON.TransformNode('Union Station clock tower',scene);root.position.set(site.x,building.baseElevation||map.terrain.getGroundHeightAt(site.x,site.z),site.z);
    const stone=map.architecture.walls['hotel-union'];
    const roof=new BABYLON.StandardMaterial('Union Station red tile',scene);roof.diffuseColor=BABYLON.Color3.FromHexString('#964e38');roof.specularColor=new BABYLON.Color3(.03,.03,.03);
    const box=(name,w,h,d,y,mat)=>{const m=BABYLON.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);m.parent=root;m.position.y=y;m.material=mat;if(mat===stone){const uv=m.getVerticesData(BABYLON.VertexBuffer.UVKind);for(let i=1;i<uv.length;i+=2)uv[i]*=Math.max(1,h/3.2);m.setVerticesData(BABYLON.VertexBuffer.UVKind,uv);}return m;};
    box('Union tower masonry',4.5,17,4.5,8.5,stone);box('Tower cornice',4.9,.35,4.9,17,stone);
    const crown=BABYLON.MeshBuilder.CreateCylinder('Union Station pyramid roof',{height:3.7,diameterBottom:6.8,diameterTop:0,tessellation:4},scene);crown.parent=root;crown.rotation.y=Math.PI/4;crown.position.y=19.05;crown.material=roof;
    const texture=new BABYLON.DynamicTexture('Union Station clock face',{width:256,height:256},scene,false),ctx=texture.getContext();ctx.fillStyle='#c6bea8';ctx.fillRect(0,0,256,256);ctx.fillStyle='#f6ecd0';ctx.beginPath();ctx.arc(128,128,115,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#293435';ctx.lineWidth=6;ctx.stroke();
    for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(128+88*Math.sin(a),128-88*Math.cos(a));ctx.lineTo(128+101*Math.sin(a),128-101*Math.cos(a));ctx.stroke();}ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(80,100);ctx.lineTo(128,128);ctx.lineTo(128,47);ctx.stroke();texture.update();
    const face=new BABYLON.StandardMaterial('Station clock dial',scene);face.diffuseTexture=texture;face.emissiveColor=new BABYLON.Color3(.12,.11,.08);face.backFaceCulling=false;
    for(let i=0;i<4;i++){const a=i*Math.PI/2,m=BABYLON.MeshBuilder.CreatePlane('Union clock',{size:2.5},scene);m.parent=root;m.position.set(Math.sin(a)*2.27,15.1,Math.cos(a)*2.27);m.rotation.y=a;m.material=face;}
    map.stationTower=root;
}
