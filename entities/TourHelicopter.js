/* Lightweight civilian sightseeing helicopter; rotor parts remain animated. */
export class TourHelicopter
{
    constructor(scene)
    {
        this.root=new BABYLON.TransformNode('Riverfront sightseeing helicopter',scene);
        const mat=(n,c)=>{const m=new BABYLON.StandardMaterial(n,scene);m.diffuseColor=BABYLON.Color3.FromHexString(c);return m;};
        const body=mat('Helicopter white fuselage','#e3e7dc'),red=mat('Helicopter red trim','#b23832'),glass=mat('Helicopter cockpit glazing','#315e75'),metal=mat('Helicopter dark metal','#29383d');
        glass.specularColor.set(.7,.8,.85);
        const box=(name,p,size,m,parent=this.root)=>{const mesh=BABYLON.MeshBuilder.CreateBox(name,{width:size[0],height:size[1],depth:size[2]},scene);mesh.parent=parent;mesh.position.set(...p);mesh.material=m;return mesh;};
        const cabin=BABYLON.MeshBuilder.CreateSphere('Helicopter rounded cabin',{diameter:1,segments:12},scene);cabin.parent=this.root;cabin.position.y=.95;cabin.scaling.set(1.7,1.5,2.8);cabin.material=body;
        const windscreen=BABYLON.MeshBuilder.CreateSphere('Helicopter panoramic cockpit',{diameter:1,segments:12},scene);windscreen.parent=this.root;windscreen.position.set(0,1.04,.68);windscreen.scaling.set(1.62,1.3,1.55);windscreen.material=glass;
        box('Helicopter roof',[0,1.65,.2],[1.2,.12,1.75],red);
        box('Helicopter tail boom',[0,1.08,-2.6],[.25,.28,3.5],body);
        box('Helicopter tail fin',[0,1.48,-4.2],[.12,1.25,.6],red);
        box('Helicopter tail stabilizer',[0,1.05,-3.6],[1.8,.08,.4],red);
        for(const x of [-.85,.85]){box('Helicopter landing skid',[x,.12,0],[.09,.12,3.2],metal);for(const z of [-.6,.65])box('Helicopter skid strut',[x*.7,.4,z],[.1,.6,.1],metal);}
        box('Helicopter rotor mast',[0,1.98,-.2],[.1,.6,.1],metal);
        this.rotor=new BABYLON.TransformNode('Main rotor',scene);this.rotor.parent=this.root;this.rotor.position.set(0,2.25,-.2);
        for(const angle of [0,Math.PI/2]){const blade=box('Main rotor blade',[0,0,0],[7.3,.045,.14],metal,this.rotor);blade.rotation.y=angle;}
        this.tailRotor=new BABYLON.TransformNode('Tail rotor',scene);this.tailRotor.parent=this.root;this.tailRotor.position.set(.21,1.48,-4.15);
        box('Tail rotor blade',[0,0,0],[.04,1.1,.12],metal,this.tailRotor);box('Tail rotor cross',[0,0,0],[.04,.12,1.1],metal,this.tailRotor);
    }
    update(dt,flying=false){this.rotor.rotation.y+=dt*(flying?44:7);this.tailRotor.rotation.x+=dt*(flying?65:12);}
}
