import { downtownFacade, installDowntownFacades } from './DowntownFacades.js';
/* Repeating architectural bays, generated locally; no image service during play. */
export class StLouisMaterials
{
    constructor(scene)
    {
        this.scene=scene;this.walls={};this.roofs={};
        for(const [name,color] of Object.entries({brick:'#884b38',stone:'#c5b7a0',glass:'#4b6670',warehouse:'#a76b48',classical:'#e0d9c8'}))
        {
            const material=new BABYLON.StandardMaterial(`STL ${name} facade`,scene);
            material.specularColor=new BABYLON.Color3(.04,.04,.04);
            material.diffuseColor=BABYLON.Color3.FromHexString(color);
            if(typeof document!=='undefined')
            {
                const texture=new BABYLON.DynamicTexture(`STL ${name} architectural bay`,{width:256,height:256},scene,true);
                const ctx=texture.getContext();ctx.fillStyle=color;ctx.fillRect(0,0,256,256);
                if(name==='brick'||name==='warehouse')
                {
                    ctx.strokeStyle='#603b31';ctx.lineWidth=2;
                    for(let y=0;y<256;y+=16){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(256,y);ctx.stroke();for(let x=(y/16%2)*32;x<256;x+=64){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+16);ctx.stroke();}}
                }
                ctx.fillStyle=name==='glass'?'#889ca2':'#d0b995';
                ctx.fillRect(38,22,180,214);
                const light=ctx.createLinearGradient(0,28,256,214);
                light.addColorStop(0,'#819ba7');light.addColorStop(.42,'#344e5a');light.addColorStop(1,'#1c303c');
                ctx.fillStyle=light;ctx.fillRect(48,32,160,194);
                ctx.fillStyle=name==='glass'?'#a0acac':'#b4a087';
                ctx.fillRect(125,32,6,194);ctx.fillRect(48,116,160,6);
                ctx.fillStyle=name==='brick'?'#c49c77':'#ddd0b5';ctx.fillRect(30,228,196,10);
                ctx.fillStyle=name==='glass'?'#93a2a6':'#aa9276';ctx.fillRect(0,248,256,8);
                if(name==='stone'){ctx.fillStyle='#ded0b6';ctx.fillRect(0,0,15,256);ctx.fillRect(241,0,15,256);}
                if(name==='classical')
                {
                    ctx.fillStyle='#e0d9c8';ctx.fillRect(0,0,256,256);
                    ctx.fillStyle='#b9b2a4';ctx.fillRect(18,0,14,256);ctx.fillRect(224,0,14,256);
                    ctx.fillStyle='#f0eadc';ctx.fillRect(32,0,18,256);ctx.fillRect(206,0,18,256);
                    ctx.fillStyle='#4b5654';ctx.fillRect(100,74,56,130);
                    ctx.fillStyle='#dad2bd';ctx.fillRect(125,74,6,130);ctx.fillRect(100,132,56,6);
                    ctx.fillStyle='#f0eadc';ctx.fillRect(0,225,256,18);
                }
                texture.wrapU=BABYLON.Texture.WRAP_ADDRESSMODE;texture.wrapV=BABYLON.Texture.WRAP_ADDRESSMODE;
                texture.anisotropicFilteringLevel=4;texture.update();material.diffuseTexture=texture;material.diffuseColor=BABYLON.Color3.White();
            }
            this.walls[name]=material;
        }
        for(const [name,color] of Object.entries({slate:'#535956',copper:'#6f978e',stone:'#bcb3a2',brick:'#7c4635',field:'#427b36',seats:'#8d2e29',dirt:'#ac8258'}))
        {
            const mat=new BABYLON.StandardMaterial(`STL ${name}`,scene);mat.diffuseColor=BABYLON.Color3.FromHexString(color);mat.specularColor=new BABYLON.Color3(.02,.02,.02);this.roofs[name]=mat;
        }
        installDowntownFacades(this);
    }
    mappedMaterial(type,key,color)
    {
        const collection=type==='wall'?this.walls:this.roofs,original=collection[key];
        if(!color||!/^#[0-9a-f]{6}$|^[a-z]+$/i.test(color))return original;
        const id=`${key}:${color}`;if(collection[id])return collection[id];
        const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,1,1);const rgba=ctx.getImageData(0,0,1,1).data;
        const material=original.clone(`Mapped ${type} ${id}`);
        if(material.diffuseTexture!==original.diffuseTexture)material.diffuseTexture?.dispose();material.diffuseTexture=original.diffuseTexture;
        material.diffuseColor=new BABYLON.Color3(rgba[0]/255,rgba[1]/255,rgba[2]/255);collection[id]=material;return material;
    }
    style(building)
    {
        const enhanced=downtownFacade(building);
        if(enhanced)return enhanced;
        const name=building.name||'';
        if(/Courthouse/.test(name))return 'classical';
        if(building.material==='glass')return 'glass';
        if(/Courthouse|Cathedral|Basilica|Metropolitan Square|Post Office/.test(name)||/stone|granite|limestone/.test(building.material||''))return 'stone';
        if(building.height>22)return 'glass';
        if(/Loft|Warehouse|Station/.test(name))return 'warehouse';
        return 'brick';
    }
    roof(building)
    {
        const color=(building.roofColour||'').toLowerCase();
        if(downtownFacade(building)&&! /green|copper|6f978e|78a49a/.test(color))return 'downtown-roof';
        return /6f978e|78a49a|green|copper/.test(color)?'copper':'slate';
    }
}
