import { ScenicGeometry } from './ScenicGeometry.js';
import { landmarkSign, landmarkMaterial } from './LandmarkArchitecture.js';
import { TourHelicopter } from '../entities/TourHelicopter.js';

export class Riverfront
{
    constructor(map)
    {
        this.map=map;const scene=map.scene,g=new ScenicGeometry(scene,'Riverfront');this.walls=[];
        const hull=g.material('barge hulls','#343c3c'),deck=g.material('weathered decks','#777c70'),rail=g.material('safety railings','#dcc773'),cargo=g.material('covered cargo','#b4b4a8');
        const arch=map.data.arch,z=arch.z+24;
        const bank=map.geology.riverX(z)-map.geology.halfWidth(z);
        this.pad={x:bank+10,z,y:-.05};this.entrance={x:bank+5,z:z-7};
        g.box('stationary heliport barge',this.pad.x,-.65,z,24,.8,29,hull);
        g.box('helipad deck',this.pad.x,-.16,z,23.6,.2,28.6,deck);
        for(const side of [-1,1])for(let i=0;i<8;i++){g.box('mooring fender',this.pad.x+side*12,-.65,z-12+i*3.4,.5,.8,1,hull);}
        for(const side of [-1,1])g.box('deck edge rail',this.pad.x+side*11.6,.37,z,.08,.08,28,rail);
        const sign=landmarkSign(scene,'H','#2f6762',9,9);sign.position.set(this.pad.x,-.045,z);sign.rotation.x=Math.PI/2;
        const white=g.material('helipad white marking','#eeeede');
        for(const dx of [-.9,.9])g.box('Helipad H upright',this.pad.x+dx,.015,z,.4,.018,3.6,white);
        g.box('Helipad H crossbar',this.pad.x,.015,z,1.8,.018,.4,white);
        const ring=BABYLON.MeshBuilder.CreateTorus('Helipad landing circle',{diameter:10,thickness:.14,tessellation:48},scene);ring.position.set(this.pad.x,-.04,z);g.add(ring,rail);
        const shore=bank-17,shoreY=map.terrain.getHeightAt(shore,z-7),deckY=-.05;
        const ramp=[[shore,shoreY,z-9],[shore,shoreY,z-5],[bank+6,deckY,z-9],[bank+6,deckY,z-5]];
        const vd=new BABYLON.VertexData();vd.positions=ramp.flat();vd.indices=[0,2,1,1,2,3];vd.normals=[];BABYLON.VertexData.ComputeNormals(vd.positions,vd.indices,vd.normals);
        const gangway=new BABYLON.Mesh('Heliport accessible gangway',scene);vd.applyToMesh(gangway);g.add(gangway,deck);deck.backFaceCulling=false;deck.emissiveColor.set(.10,.10,.09);
        map.surface.add(ramp);map.surface.add([[bank-2,deckY,z-14],[bank+22,deckY,z-14],[bank-2,deckY,z+14],[bank+22,deckY,z+14]]);
        for(const seg of [{a:[shore,z-7],b:[bank+7,z-7],width:4},{a:[this.pad.x,z-14],b:[this.pad.x,z+14],width:24,bounded:true}])map.bridges.insert(seg,[seg.a,seg.b],seg.width);
        for(const side of [-1,1])g.tube('gangway handrail',[[shore,shoreY+.6,z-7+side*1.9],[bank+6,deckY+.6,z-7+side*1.9]],.045,rail);
        const boarding=BABYLON.MeshBuilder.CreateTorus('Helicopter boarding ring',{diameter:2.4,thickness:.07,tessellation:32},scene);boarding.position.set(this.entrance.x,.01,this.entrance.z);g.add(boarding,rail);
        const info=landmarkSign(scene,'HELICOPTER RIDES  ·  E / ENTER-EXIT','#214d56',6,.9);info.position.set(shore,shoreY+1.5,z-10);
        this.helicopter=new TourHelicopter(scene);this.helicopter.root.position.set(this.pad.x,this.pad.y,this.pad.z);
        this.barges=[];
        for(let i=0;i<3;i++)
        {
            const bz=arch.z-220+i*210,bx=map.geology.riverX(bz);if(bx===null)continue;
            for(let row=0;row<3;row++)for(let col=0;col<2;col++)
            {
                const px=bx+col*8,pz=bz+row*25;g.box('river cargo barge',px,-.6,pz,7.4,.9,24,hull);g.box('barge cargo cover',px,.12,pz,6.6,.65,21,cargo);this.barges.push({x:px,z:pz});
                for(let r=-8;r<=8;r+=4)g.box('cargo cover rib',px,.48,pz+r,6.8,.07,.09,deck);
            }
            g.box('towboat hull',bx+4,-.4,bz-18,7,1.1,10,hull);g.box('towboat wheelhouse',bx+4,1.3,bz-19,4,2.5,4,cargo);
            g.box('towboat bridge windows',bx+4,2.1,bz-16.95,3.6,.5,.08,g.material('towboat glass','#345969'));
        }
        const mural=landmarkMaterial(scene,'Original Paint Louis inspired murals','#6f756c',c=>{
            c.fillStyle='#858779';c.fillRect(0,0,512,512);
            const colors=['#ec8448','#53bbc0','#a572c8','#e7c558','#dc6589'];
            for(let i=0;i<70;i++){c.fillStyle=colors[i%5];c.globalAlpha=.2+(i%3)*.15;c.beginPath();c.arc((i*83)%512,(i*137)%512,12+i%36,0,Math.PI*2);c.fill();}c.globalAlpha=1;
            c.font='italic bold 110px sans-serif';c.lineWidth=12;c.strokeStyle='#24313c';c.textAlign='center';c.strokeText('RIVER',256,215);c.fillStyle='#62d5cc';c.fillText('RIVER',256,215);c.strokeText('CITY',256,335);c.fillStyle='#f4b54c';c.fillText('CITY',256,335);
            c.strokeStyle='#e9ddd0';c.lineWidth=4;c.beginPath();c.moveTo(45,415);c.bezierCurveTo(150,345,365,465,485,380);c.stroke();
        });
        for(let i=0;i<24;i++)
        {
            const wz=arch.z-130-i*10,wx=map.geology.riverX(wz)-map.geology.halfWidth(wz)-21,y=map.terrain.getGroundHeightAt(wx,wz);
            // Skip mapped streets and buildings instead of placing a wall through them.
            if(map.nearestRoad(wx,wz).distance<4||map.isBlocked(wx,wz,.4,true))continue;
            g.box('graffiti flood wall',wx,y+1.8,wz,.45,3.6,9.8,deck);
            for(const side of [-1,1]){const art=BABYLON.MeshBuilder.CreatePlane('Paint Louis inspired floodwall mural',{width:9.7,height:3.5},scene);art.position.set(wx+side*.24,y+1.8,wz);art.rotation.y=-side*Math.PI/2;g.add(art,mural);}
            this.walls.push({x:wx,z:wz});
        }
        g.finish();
        map.localLandmarks.push({name:'Riverfront helicopter rides',kind:'heliport',...this.pad,base:-.05,height:3,viewDistance:45,entrance:this.entrance,arrival:this.entrance});
        const wall=this.walls[0];if(wall)map.localLandmarks.push({name:'Paint Louis inspired graffiti floodwall',kind:'art',...wall,base:0,height:4,viewDistance:30,entrance:{x:wall.x+3,z:wall.z}});
    }
    blocks(x,z,radius){return this.walls.some(w=>Math.abs(x-w.x)<radius+.23&&Math.abs(z-w.z)<radius+4.9);}
    update(dt,flying=false){this.helicopter.update(Math.max(0,Math.min(dt,.1)),flying);}
}
