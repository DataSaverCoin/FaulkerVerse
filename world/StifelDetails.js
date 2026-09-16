import { landmarkSign } from './LandmarkArchitecture.js';
/* Eight-column limestone portico, granite terrace and the two Missouri bears. */
export function stifelDetails(scene,base,box,stone,metal)
{
    const center={x:-152.52,z:-32.31},ux=.952,uz=-.305,nx=.305,nz=.952,angle=Math.atan2(-uz,ux);
    const at=(name,u,y,v,w,h,d,m=stone)=>box(name,w,h,d,center.x+ux*u+nx*v,base+y,center.z+uz*u+nz*v,m,angle);
    at('granite entrance terrace',0,.32,-.35,22,.64,1.5);
    for(let i=0;i<5;i++)at('front entrance steps',0,.07+i*.06,.8-i*.13,17,.12,.28);
    at('portico entablature',0,7.1,-.45,23,.7,1.5);
    at('limestone roof cornice',0,7.6,-.45,24,.22,1.65);
    for(let i=0;i<8;i++)
    {
        const u=(i-3.5)*2.5;
        at('column pedestal',u,1.95,-.25,.9,.5,.9);
        at('Corinthian capital',u,6.56,-.25,.86,.44,.86);
        const shaft=BABYLON.MeshBuilder.CreateCylinder('Stifel fluted limestone column',{diameterTop:.48,diameterBottom:.62,height:4.2,tessellation:16},scene);
        shaft.position.set(center.x+ux*u-nx*.25,base+4.3,center.z+uz*u-nz*.25);shaft.material=stone;
        shaft.freezeWorldMatrix();
        for(const side of [-1,1])at('capital volute',u+side*.3,6.62,-.05,.18,.2,.3);
    }
    for(const u of [-10,10])
    {
        at('Missouri bear pedestal',u,.9,.6,1.1,1.25,1);
        at('Missouri bear body',u,1.63,.6,.85,.48,.45);
        at('Missouri bear head',u+(u<0?.38:-.38),1.77,.63,.34,.36,.42);
        for(const offset of [-.28,.28])at('Missouri bear paws',u+offset,1.43,.84,.23,.18,.3);
        at('carved relief panel',u,4.25,-.53,1.4,3.1,.16);
    }
    const sign=landmarkSign(scene,'STIFEL THEATRE','#9c9585',18,.58);sign.position.set(center.x+nx*.35,base+7.12,center.z+nz*.35);sign.rotation.y=angle+Math.PI;
    for(let i=0;i<9;i++)at('bronze entry doors',(i-4)*1.7,1.05,-.55,1.3,1.4,.08,metal);
}
