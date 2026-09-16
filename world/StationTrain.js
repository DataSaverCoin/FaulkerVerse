/* Closed scenic game loop: OSM Union Station approach plus an original underground return. */
// Route is bundled here to avoid a late network request blocking game startup.
// Source and ODbL attribution: assets/maps/union-station-rail.json.
const UNION_STATION_ROUTE = {"source": "OpenStreetMap", "license": "ODbL-1.0", "attribution": "\u00a9 OpenStreetMap contributors", "osmWay": 28453520, "name": "Union Station MetroLink approach", "points": [[-390.2982850367132, -58.63001759985434], [-393.43941373275055, -60.279779999912904], [-396.3535671822372, -62.266841999879205], [-400.384334487568, -65.62313999994791], [-404.4151017925281, -70.77614279989402], [-407.74407207168764, -76.4968775998305], [-411.1278294793504, -83.89743119993949], [-419.3145918117228, -103.83818279994748], [-422.05394823281057, -109.45205039982156], [-426.5934531590045, -117.430354800038], [-430.6216115532424, -123.16110839985427], [-436.45513627440164, -129.58649879995747], [-442.5704233702442, -135.0166883998207], [-450.35802233838916, -140.30327519990414], [-458.302155959136, -144.29075759999284], [-465.6775470087011, -147.08600279991194], [-473.7886509256801, -149.10980039983295], [-481.0805568273146, -150.22856639985585], [-488.60987361875925, -150.94324079990236], [-508.1323537120786, -152.59634279999995], [-516.0008289174322, -152.8868879998359], [-523.8588684791553, -152.78669999985155], [-533.0735416972552, -151.83825359992068], [-540.741130764763, -150.48905519981514], [-549.4392396290916, -148.4385407998192], [-569.1652147709788, -143.20538759988563]]};

export class StationTrain
{
    static async create(map)
    {
        const approach=UNION_STATION_ROUTE.points.map(p=>[...p,4.8]);
        const loop=[...approach,[-620,-148,4.8],[-670,-115,1],[-690,-50,-12],[-660,60,-16],[-480,145,-16],[-230,205,-16],[40,210,-16],[275,100,-16],[290,-55,-16],[100,-200,-16],[-140,-220,-16],[-285,-185,-16],[-345,-140,-12],[-370,-100,0],approach[0]];
        return new StationTrain(map,{...UNION_STATION_ROUTE,name:'Union Station scenic loop',points:loop});
    }

    constructor(map,data)
    {
        this.name='Union Station scenic loop';this.map=map;this.data=data;this.distance=16;this.direction=1;this.dwell=5;this.reversals=0;
        this.lengths=[0];for(let i=1;i<data.points.length;i++)this.lengths.push(this.lengths[i-1]+Math.hypot(data.points[i][0]-data.points[i-1][0],data.points[i][1]-data.points[i-1][1]));
        this.total=this.lengths.at(-1);this.stationDistance=this.lengths[23];this.distance=this.stationDistance;this.dwell=10;this.laps=0;this.cars=[];
        this.elevations=data.points.map(p=>map.terrain.getGroundHeightAt(p[0],p[1])+(p[2]??4.8));
        const scene=map.scene,mat=(name,color)=>{const m=new BABYLON.StandardMaterial(name,scene);m.diffuseColor=BABYLON.Color3.FromHexString(color);return m;};
        const silver=mat('Metro silver','#c9d1d1'),blue=mat('Metro blue','#285889'),red=mat('Metro red stripe','#c43d38'),dark=mat('Metro glazing','#314b5b'),rail=mat('Rail steel','#969e95'),bed=mat('Viaduct concrete','#868b80');
        const glass=mat('Train transparent windows','#8cb8c7');glass.alpha=.24;glass.backFaceCulling=false;
        const tunnel=mat('Lit tunnel lining','#4a555d');tunnel.emissiveColor.set(.22,.25,.28);
        const strip=mat('Tunnel strip lighting','#b3def0');strip.emissiveColor.set(.65,.8,.9);
        const staticMeshes=[];
        const box=(name,w,h,d,p,material,parent=null)=>{const m=BABYLON.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);m.position.set(...p);m.material=material;m.parent=parent;if(!parent)staticMeshes.push(m);return m;};
        for(let d=0;d<this.total;d+=3)
        {
            const p=this.sample(Math.min(d+1.5,this.total)),y=p.y,angle=Math.atan2(p.dx,p.dz);
            const base=box('Rail viaduct',2.5,.35,3.05,[p.x,y-.2,p.z],bed);base.rotation.set(-p.pitch,angle,0);
            for(const side of [-1,1])
            {
                const m=box('Rail',.07,.1,3.08,[p.x+p.dz*side*.56,y+.02,p.z-p.dx*side*.56],rail);m.rotation.set(-p.pitch,angle,0);
            }
            const ground=map.terrain.getGroundHeightAt(p.x,p.z);
            if(d%30===0&&y>ground+.5)box('Rail support',.65,y-ground,.65,[p.x,(y+ground)/2,p.z],bed);
            if(p.offset<1){
                const ceiling=box('Tunnel ceiling',5,.25,3.15,[p.x,y+3.5,p.z],tunnel);ceiling.rotation.y=angle;
                for(const side of [-1,1]){const wall=box('Tunnel wall',.2,3.5,3.15,[p.x+p.dz*side*2.45,y+1.65,p.z-p.dx*side*2.45],tunnel);wall.rotation.y=angle;}
                if(d%12===0){const lamp=box('Tunnel guide light',.12,.08,2,[p.x+p.dz*2.25,y+2.6,p.z-p.dx*2.25],strip);lamp.rotation.y=angle;}
            }
        }
        const groups=new Map();for(const mesh of staticMeshes){if(!groups.has(mesh.material))groups.set(mesh.material,[]);groups.get(mesh.material).push(mesh);}
        for(const [material,meshes] of groups){const merged=BABYLON.Mesh.MergeMeshes(meshes,true,true);merged.material=material;merged.freezeWorldMatrix();}
        for(let i=0;i<2;i++)
        {
            const root=new BABYLON.TransformNode(`Union Station train car ${i+1}`,scene);
            box('Railcar floor',1.8,.18,7.8,[0,.42,0],silver,root);
            box('Railcar roof',1.8,.1,7.8,[0,2.02,0],silver,root);
            for(const side of [-1,1])box('Railcar side',.08,.5,7.8,[side*.87,.73,0],silver,root);
            for(const side of [-1,1])box('Blue lower panel',.04,.25,7.82,[side*.915,.61,0],blue,root);
            for(const side of [-1,1])box('Red livery',.04,.10,7.83,[side*.916,.92,0],red,root);
            for(const side of [-1,1])for(let z=-3;z<=3;z+=1.2)box('Passenger train window',.025,.62,.8,[side*.913,1.42,z],glass,root);
            for(const z of [-3.91,3.91])box('Driver windscreen',1.4,.6,.025,[0,1.43,z],glass,root);
            for(const z of [-2.6,2.6])box('Train bogie',1.5,.38,.8,[0,.25,z],dark,root);
            this.cars.push(root);
        }
        const platform=this.sample(this.stationDistance),p=box('Union Station approach platform',2,.4,19,[platform.x+platform.dz*2.5,platform.y,platform.z-platform.dx*2.5],bed);p.rotation.y=Math.atan2(platform.dx,platform.dz);
        const sign=box('Station blue sign',3,.7,.1,[platform.x+platform.dz*2.5,platform.y+1.7,platform.z-platform.dx*2.5],blue);
        const texture=new BABYLON.DynamicTexture('Union Station sign',{width:512,height:128},scene,false),ctx=texture.getContext();ctx.fillStyle='#244d77';ctx.fillRect(0,0,512,128);ctx.fillStyle='white';ctx.font='bold 45px sans-serif';ctx.textAlign='center';ctx.fillText('UNION STATION',256,82);texture.update();const signMat=mat('Station lettering','#ffffff');signMat.diffuseTexture=texture;sign.material=signMat;
        const road=map.nearestRoad(platform.x+platform.dz*5,platform.z-platform.dx*5);
        let entry=null;for(const radius of [0,3,6,10,16])for(let i=0;i<16;i++){const x=road.x+Math.cos(i*Math.PI/8)*radius,z=road.z+Math.sin(i*Math.PI/8)*radius;if(!entry&&!map.isBlocked(x,z,1,true))entry={x,z};}
        if(!entry)throw new Error('No clear Union Station boarding area');
        this.entrance=entry;const ground=map.terrain.getHeightAt(entry.x,entry.z);
        const ring=BABYLON.MeshBuilder.CreateTorus('Train boarding circle',{diameter:5,thickness:.12,tessellation:32},scene);ring.position.set(entry.x,ground+.15,entry.z);ring.material=strip;
        const boardSign=sign.clone('Train boarding sign');boardSign.position.set(entry.x,ground+2.5,entry.z-2.7);
        map.localLandmarks.push({name:'Union Station · Train ride',kind:'train',x:entry.x,z:entry.z,base:ground,height:4,entrance:entry,arrival:entry});
        this.update(0);
    }

    sample(distance)
    {
        const d=((distance%this.total)+this.total)%this.total;let i=this.lengths.findIndex(v=>v>d);i=Math.max(1,i);
        const a=this.data.points[i-1],b=this.data.points[i],length=this.lengths[i]-this.lengths[i-1],t=(d-this.lengths[i-1])/length;
        return {x:a[0]+(b[0]-a[0])*t,y:this.elevations[i-1]+(this.elevations[i]-this.elevations[i-1])*t,z:a[1]+(b[1]-a[1])*t,dx:(b[0]-a[0])/length,dz:(b[1]-a[1])/length,pitch:Math.atan2(this.elevations[i]-this.elevations[i-1],length),offset:a[2]+(b[2]-a[2])*t};
    }
    atStation(){return this.dwell>0&&Math.abs(this.distance-this.stationDistance)<.01;}
    secondsUntilStation(){return this.atStation()?0:((this.stationDistance-this.distance+this.total)%this.total)/10;}
    update(delta)
    {
        const dt=Math.min(Math.max(delta,0),.05);
        if(this.dwell>0)this.dwell=Math.max(0,this.dwell-dt);
        else{
            const remaining=(this.stationDistance-this.distance+this.total)%this.total,advance=10*dt;
            if(remaining>0&&remaining<=advance){this.distance=this.stationDistance;this.dwell=10;this.laps++;}
            else this.distance=(this.distance+advance)%this.total;
        }
        this.cars.forEach((car,i)=>{const p=this.sample(this.distance-i*8.2);car.position.set(p.x,p.y+.08,p.z);car.rotation.set(-p.pitch,Math.atan2(p.dx,p.dz),0);});
    }
}
