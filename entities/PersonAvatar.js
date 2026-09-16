/* Lightweight articulated character, styled from the owner's latest turnaround. */
export class PersonAvatar
{
    constructor(scene,{name='Corey avatar',shirt='#151619',skin='#c18c70',personal=true,gender='man',age='adult',hair:hairColor='#453b30',pants='#17191c'}={})
    {
        this.root=new BABYLON.TransformNode(name,scene);this.phase=0;this.limbs=[];
        const material=(label,color)=>{const m=new BABYLON.StandardMaterial(`${name} ${label}`,scene);m.diffuseColor=BABYLON.Color3.FromHexString(color);m.specularColor=new BABYLON.Color3(.04,.04,.04);return m;};
        this.materials=[material('skin',skin),material('cotton',shirt),material('shorts',pants),material('white sneakers','#eeeae3'),material('hair',hairColor),material('eyes','#4a3b2c')];
        const [flesh,cloth,shorts,shoes,hair,eyes]=this.materials;
        const sphere=(label,size,p,mat,parent=this.root)=>
        {
            const mesh=BABYLON.MeshBuilder.CreateSphere(label,{diameter:1,segments:12},scene);
            mesh.scaling.set(...size);mesh.position.set(...p);mesh.parent=parent;mesh.material=mat;mesh.isPickable=false;return mesh;
        };
        const box=(label,size,p,mat,parent=this.root)=>
        {
            const mesh=BABYLON.MeshBuilder.CreateBox(label,{width:size[0],height:size[1],depth:size[2]},scene);
            mesh.position.set(...p);mesh.parent=parent;mesh.material=mat;mesh.isPickable=false;return mesh;
        };
        const cylinder=(label,top,bottom,height,p,mat,parent=this.root,depth=1)=>
        {
            const mesh=BABYLON.MeshBuilder.CreateCylinder(label,{diameterTop:top,diameterBottom:bottom,height,tessellation:16},scene);
            mesh.parent=parent;mesh.position.set(...p);mesh.scaling.z=depth;mesh.material=mat;mesh.isPickable=false;return mesh;
        };
        cylinder('T-shirt torso',.56,.52,.6,[0,1.16,0],cloth,this.root,.6);
        box('T-shirt hem',[.5,.14,.3],[0,.94,0],cloth);
        sphere('Neck',[.15,.18,.16],[0,1.5,0],flesh);
        sphere('Head',[.285,.36,.285],[0,1.72,.008],flesh);
        sphere('Jaw',[.24,.17,.23],[0,1.61,.035],flesh);
        sphere('Short brown hair',[.29,.135,.282],[0,1.868,-.005],hair);
        sphere('Swept hair',[.23,.05,.21],[-.015,1.914,.025],hair);
        sphere('Hair at nape',[.26,.17,.075],[0,1.78,-.116],hair);
        for(const side of [-1,1])
        {
            sphere('Ear',[.049,.085,.05],[side*.145,1.718,0],flesh);
            sphere('Eye white',[.055,.023,.018],[side*.064,1.747,.14],shoes);
            sphere('Brown iris',[.018,.021,.013],[side*.061,1.747,.15],eyes);
            const brow=box('Eyebrow',[.066,.012,.015],[side*.063,1.777,.142],hair);brow.rotation.z=side*.06;
            if(gender==='man'&&age==='adult')sphere('Beard jaw',[.048,.12,.13],[side*.101,1.61,.078],hair);
        }
        sphere('Nose',[.048,.066,.065],[0,1.711,.156],flesh);
        if(gender==='woman') { sphere('Long hair',[.33,.43,.16],[0,1.65,-.14],hair); sphere('Ponytail',[.16,.35,.17],[.08,1.61,-.23],hair); }
        if(gender==='man'&&age==='adult')sphere('Trimmed beard',[.167,.072,.08],[0,1.583,.109],hair);
        if(gender==='man'&&age==='adult')sphere('Moustache',[.11,.022,.035],[0,1.648,.153],hair);
        sphere('Lips',[.094,.012,.024],[0,1.631,.155],flesh);
        for(const side of [-1,1])
        {
            const arm=new BABYLON.TransformNode('Shoulder',scene);arm.parent=this.root;arm.position.set(side*.305,1.4,0);
            cylinder('Sleeve',.21,.19,.24,[0,-.075,0],cloth,arm,1.1);
            sphere('Upper arm',[.135,.28,.14],[0,-.235,0],flesh,arm);
            const elbow=new BABYLON.TransformNode('Elbow',scene);elbow.parent=arm;elbow.position.y=-.36;
            sphere('Forearm',[.105,.28,.12],[0,-.105,0],flesh,elbow);
            sphere('Hand',[.105,.145,.066],[0,-.28,.007],flesh,elbow);
            const leg=new BABYLON.TransformNode('Hip',scene);leg.parent=this.root;leg.position.set(side*.135,.88,0);
            cylinder('Black shorts leg',.245,.23,.34,[0,-.15,0],shorts,leg,1.15);
            sphere('Knee',[.143,.15,.145],[0,-.36,0],flesh,leg);
            const knee=new BABYLON.TransformNode('Knee joint',scene);knee.parent=leg;knee.position.y=-.38;
            sphere('Calf',[.128,.34,.145],[0,-.15,-.015],flesh,knee);
            cylinder('White sock',.135,.135,.095,[0,-.31,0],shoes,knee);
            sphere('White sneaker',[.18,.15,.31],[0,-.395,.065],shoes,knee);
            box('Sole',[.18,.035,.29],[0,-.445,.065],shoes,knee);
            for(let i=0;i<3;i++)box('Shoe lace',[.11,.012,.012],[0,-.333,.085+i*.025],shoes,knee);
            this.limbs.push({side,arm,elbow,leg,knee});
        }
        if(personal)
        {
            const tex=new BABYLON.DynamicTexture('Tree One Four shirt graphic',{width:512,height:512},scene,true),c=tex.getContext();
            c.fillStyle=shirt;c.fillRect(0,0,512,512);c.strokeStyle='#e4b94f';c.lineWidth=7;
            for(let ring=0;ring<3;ring++)
            {
                c.beginPath();for(let i=0;i<=24;i++){const a=i*Math.PI/12,r=(i%2?68:99)+ring*21;c.lineTo(256+Math.cos(a)*r,265+Math.sin(a)*r);}c.closePath();c.stroke();
            }
            c.strokeStyle='#dddcc8';for(const y of [176,236,296]){c.beginPath();c.ellipse(256,y,49,31,0,0,Math.PI*2);c.stroke();}
            c.fillStyle='#64c6dd';c.beginPath();c.ellipse(256,263,32,18,0,0,Math.PI*2);c.fill();c.fillStyle='#151619';c.beginPath();c.arc(256,263,11,0,Math.PI*2);c.fill();
            c.fillStyle='#69cbe1';c.font='bold 49px Georgia';c.textAlign='center';c.fillText('TREE ONE',256,87);c.fillText('FOUR',256,442);tex.update();
            const print=material('graphic','#ffffff');print.diffuseTexture=tex;this.materials.push(print);this.texture=tex;
            const patch=BABYLON.MeshBuilder.CreatePlane('Personal graphic shirt',{width:.36,height:.4,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene);patch.parent=this.root;patch.position.set(0,1.22,.171);patch.rotation.y=Math.PI;patch.material=print;patch.isPickable=false;
        }
    }

    update(dt,moving=false,running=false,seated=false)
    {
        this.phase+=Math.min(dt,.1)*(running?13:8);
        for(const l of this.limbs)
        {
            const swing=moving?Math.sin(this.phase)*l.side*(running?.65:.42):0;
            l.arm.rotation.x=seated?-1.05:-swing;l.arm.rotation.z=l.side*.06;
            l.elbow.rotation.x=seated?-.5:-.12;
            l.leg.rotation.x=seated?-Math.PI/2:swing;
            l.knee.rotation.x=seated?Math.PI/2:Math.max(0,-swing)*.7;
        }
    }

    dispose()
    {
        this.root.dispose();this.texture?.dispose();for(const m of this.materials)m.dispose();
    }
}
