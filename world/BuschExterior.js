import { ScenicGeometry } from './ScenicGeometry.js';

/* Projecting brick piers, arched reveals, cream cornices and dark-green awnings. */
export function createBuschExterior(map,outer,cx,cz,base,height)
{
    const g=new ScenicGeometry(map.scene,'Busch arcade');
    const brick=g.material('brick reveals','#984331'),stone=g.material('limestone cornices','#cdbda0'),green=g.material('painted green steel','#284a3c');
    for(let i=1;i<outer.length;i++)
    {
        const a=outer[i-1],b=outer[i],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);if(l<3)continue;
        const mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2,h=height*((mx-cx)+(mz-cz)>15?.38:1);
        let nx=dz/l,nz=-dx/l;if(nx*(mx-cx)+nz*(mz-cz)<0){nx=-nx;nz=-nz;}
        const angle=Math.atan2(-dz,dx),count=Math.max(1,Math.round(l/5.5)),bay=l/count;
        g.box('stone coping',mx-nx*.08,base+h,mz-nz*.08,l,.24,.38,stone,angle);
        for(let j=0;j<count;j++)
        {
            const t=(j+.5)/count,x=a[0]+dx*t,z=a[1]+dz*t,r=Math.min(bay*.34,h*.19),spring=base+h-r-.5;
            const arch=[];for(let k=0;k<=16;k++){const theta=Math.PI-k/16*Math.PI;arch.push([x+dx/l*Math.cos(theta)*r+nx*.04,spring+Math.sin(theta)*r,z+dz/l*Math.cos(theta)*r+nz*.04]);}
            g.tube('rounded brick arch',arch,.12,brick);
            for(const side of [-1,1])g.box('brick arcade pier',x+dx/l*side*bay*.44-nx*.03,base+h/2,z+dz/l*side*bay*.44-nz*.03,.34,h,.26,brick,angle);
            if(h>3){const canopy=g.box('green entrance awning',x-nx*.1,base+1.7,z-nz*.1,bay*.72,.13,.65,green,angle);canopy.rotation.x=.2;}
            for(const y of [h*.4,h*.68])if(y>1.8)g.box('green concourse girder',x,base+y,z,bay*.78,.14,.13,green,angle);
        }
    }
    g.finish();
}
