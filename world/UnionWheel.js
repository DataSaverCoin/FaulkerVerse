/* 200-foot wheel / 42 enclosed gondolas, scaled to the map's 30% geography. */
export class UnionWheel
{
    constructor(map)
    {
        this.name='The St. Louis Wheel';this.map=map;this.angle=0;this.radius=8.5;
        const scene=map.scene;this.root=new BABYLON.TransformNode(this.name,scene);
        const x=(-90.2095768-map.data.origin[0])*111320*Math.cos(map.data.origin[1]*Math.PI/180)*map.data.scale,z=(38.627755-map.data.origin[1])*111320*map.data.scale;
        this.root.position.set(x,map.terrain.getGroundHeightAt(x,z),z);this.root.rotation.y=Math.PI/2+.26;
        const material=(name,color)=>{const m=new BABYLON.StandardMaterial(name,scene);m.diffuseColor=BABYLON.Color3.FromHexString(color);return m;};
        const steel=material('Wheel white steel','#e0e5e9'),glass=material('Wheel cabin glass','#486f86'),base=material('Wheel plaza','#aaa395');
        glass.alpha=.65;
        this.led=material('Wheel colored LEDs','#6b95db');
        const box=(name,w,h,d,x,y,z,mat,parent=this.root)=>{const m=BABYLON.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);m.parent=parent;m.position.set(x,y,z);m.material=mat;return m;};
        box('Wheel boarding platform',10,.2,4,0,.1,0,base);
        for(const z of [-1.1,1.1])for(const x of [-3.4,3.4])
        {
            const m=BABYLON.MeshBuilder.CreateTube('Wheel A-frame',{path:[new BABYLON.Vector3(x,.2,z*2),new BABYLON.Vector3(0,9.3,z)],radius:.18,tessellation:8},scene);m.parent=this.root;m.material=steel;
        }
        this.rotor=new BABYLON.TransformNode('Rotating wheel',scene);this.rotor.parent=this.root;this.rotor.position.y=9.3;
        for(const z of [-.45,.45])for(const [radius,mat] of [[8.5,steel],[8.3,this.led]])
        {
            const path=[];for(let i=0;i<=126;i++)path.push(new BABYLON.Vector3(Math.cos(i/126*Math.PI*2)*radius,Math.sin(i/126*Math.PI*2)*radius,z));
            const rim=BABYLON.MeshBuilder.CreateTube('Wheel rim',{path,radius:.065,tessellation:6},scene);rim.parent=this.rotor;rim.material=mat;
        }
        const lines=[];for(let i=0;i<42;i++){const a=i/42*Math.PI*2;for(const z of [-.45,.45])lines.push([new BABYLON.Vector3(0,0,z),new BABYLON.Vector3(Math.cos(a)*8.5,Math.sin(a)*8.5,z)]);}
        const spokes=BABYLON.MeshBuilder.CreateLineSystem('Wheel spokes',{lines},scene);spokes.parent=this.rotor;spokes.color=new BABYLON.Color3(.8,.84,.88);
        this.cabins=[];
        for(let i=0;i<42;i++)
        {
            const cabin=new BABYLON.TransformNode(`Gondola ${i+1}`,scene);cabin.parent=this.root;
            box('Enclosed gondola',.58,.7,.75,0,-.2,0,glass,cabin);box('Gondola roof',.64,.12,.8,0,.22,0,steel,cabin);box('Gondola floor',.62,.12,.78,0,-.58,0,steel,cabin);this.cabins.push(cabin);
        }
        const spot=map.nearestRoad(x,z);
        this.entrance=new BABYLON.Vector3(spot.x,map.terrain.getHeightAt(spot.x,spot.z)+.04,spot.z);
        const marker=BABYLON.MeshBuilder.CreateTorus('Ferris wheel boarding area',{diameter:5,thickness:.12,tessellation:48},scene);
        marker.position.copyFrom(this.entrance);marker.material=this.led;
        const sign=BABYLON.MeshBuilder.CreatePlane('Wheel boarding sign',{width:3,height:.8},scene);
        sign.position.copyFrom(this.entrance);sign.position.y+=1.7;sign.billboardMode=BABYLON.Mesh.BILLBOARDMODE_ALL;
        const texture=new BABYLON.DynamicTexture('Boarding instructions',{width:768,height:192},scene,false);
        texture.drawText('FERRIS WHEEL • E / ENTER',null,115,'bold 38px sans-serif','white','#173d4e',true);
        const signMaterial=material('Boarding sign','#ffffff');signMaterial.diffuseTexture=texture;signMaterial.emissiveColor.set(.6,.6,.6);sign.material=signMaterial;
        this.update(0);
    }
    update(delta)
    {
        this.angle=(this.angle+Math.min(Math.max(delta||0,0),.1)*Math.PI*2/120)% (Math.PI*2);
        this.rotor.rotation.z=this.angle;
        this.cabins.forEach((c,i)=>{const a=i/42*Math.PI*2+this.angle;c.position.set(Math.cos(a)*this.radius,9.3+Math.sin(a)*this.radius,0);});
        const hour=this.map.weather?.hour??15,night=hour<6.5||hour>17.5;
        this.led.emissiveColor.set(night?.25:.03,night?.35:.03,night?1:.04);
    }
}
