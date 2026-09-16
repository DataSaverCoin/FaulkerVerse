import {landingFacade} from './LandingLandmarks.js';
import { RenderProfile } from "../engine/RenderProfile.js";
import { civicFacade } from './CivicFacades.js';
/* Site IDs preserve the road-cleared OSM footprints. Heights use the city's scale. */
export const LOCAL_LANDMARKS = {
    '108705184': {name:'Stifel Theatre',kind:'stifel',height:8.1,floors:3,wall:'#c7bca5',trim:'#e4dbc6',sign:'STIFEL THEATRE',accent:'#605e53'},
    '238253086': {name:'Tin Roof · 1000 Clark',kind:'tinroof',height:5.76,floors:6,wall:'#944831',trim:'#c7a787',sign:'Tin Roof',accent:'#982d31'},
    '108706564': {name:'City Justice Center · city jail',kind:'jail',height:6.2,floors:6,wall:'#c4c0aa',trim:'#e3dfcf',sign:'ST. LOUIS CITY JUSTICE CENTER',accent:'#42676c'},
    '28656411': {name:'Stadium West Garage',kind:'garage',height:8.5,floors:9,wall:'#c4c2ae',trim:'#e3dfcf',sign:'STADIUM WEST PARKING',accent:'#266283'},
    '102759632': {name:'Stadium East Garage',kind:'garage',height:8.5,floors:9,wall:'#c4c2ae',trim:'#e3dfcf',sign:'STADIUM EAST PARKING',accent:'#266283'},

    '346589135': {name:'Imo’s Pizza · 1701 Delmar',kind:'imos',height:1.65,floors:1,wall:'#a55540',trim:'#ddc5a1',sign:"IMO’S PIZZA",accent:'#c72e32'},
    '237879557': {name:"Maggie O’Brien’s",kind:'maggie',height:2.5,floors:2,wall:'#174f3d',trim:'#d0bd85',sign:"MAGGIE O’BRIEN’S",accent:'#123e2e'},
    '238246519': {name:'Drury · Union Station / Lombardo’s',kind:'drury',height:5.2,floors:4,wall:'#9d4636',trim:'#d4c4a4',sign:'DRURY INN & SUITES',accent:'#812e2d'},
    '332927955': {name:'Police Headquarters · 1915 Olive',kind:'police',height:9.8,floors:9,wall:'#b5a787',trim:'#ded2b5',sign:'POLICE HEADQUARTERS',accent:'#263f61'},
    '346675366': {name:'Cookies · 2001 Olive',kind:'cookies',height:2.4,floors:1,wall:'#c0bdb0',trim:'#dfdccb',sign:'Cookies',accent:'#159ccc'},
    '201372543': {name:"Paddy O’s",kind:'paddy',height:3.4,floors:2,wall:'#a15640',trim:'#bda985',sign:"PADDY O’S",accent:'#17523a'},
    '108704347': {name:'Hyatt Regency · at the Arch',kind:'hyatt',height:18.9,floors:18,wall:'#c9bca5',trim:'#ece5d5',sign:'HYATT REGENCY',accent:'#333f4c'},
    '108706994': {name:'Hampton Inn · at the Arch',kind:'hampton',height:17.5,floors:16,wall:'#b56c52',trim:'#eee1cc',sign:'Hampton Inn',accent:'#922f39'},
    '108704344': {name:'Drury Plaza · at the Arch',kind:'plaza',height:12,floors:10,wall:'#a86a50',trim:'#e4d3b1',sign:'DRURY PLAZA',accent:'#812e2d'},
    '271634272': {name:'Imo’s Pizza · headquarters',kind:'imos',height:2.5,floors:2,wall:'#a55540',trim:'#ddc5a1',sign:"IMO’S PIZZA",accent:'#c72e32'}
};
const NAMED_LANDMARKS = {
    'Concentra Urgent Care': {name:'Concentra Urgent Care · Market Street',kind:'urgentcare',height:2.9,floors:1,wall:'#b6a183',trim:'#e1d9c5',sign:'CONCENTRA  ·  URGENT CARE',accent:'#1b6c83'},
    'Saint Louis University Hospital - South Campus': {name:'SLU Hospital · South Campus',kind:'hospital',height:7.7,floors:7,wall:'#c3b7a3',trim:'#e1ddd0',sign:'SLU HOSPITAL · SOUTH CAMPUS',accent:'#256777'},
    'Great Grizzly Bear': {name:'Great Grizzly Bear · Soulard',kind:'soulard',height:2.9,floors:2,wall:'#964d39',trim:'#c8b895',sign:'GREAT GRIZZLY BEAR',accent:'#304c3b'},
    "Carson's": {name:'Carson’s · Soulard',kind:'soulard',height:3.2,floors:3,wall:'#9c503b',trim:'#dec5a2',sign:'CARSON’S',accent:'#324e39'},
    'Social Bar & Grill Soulard': {name:'Social Bar & Grill · Soulard',kind:'soulard',height:3.1,floors:2,wall:'#a15b43',trim:'#cebb9c',sign:'SOCIAL BAR & GRILL',accent:'#303d43'},
    "Big Daddy's": {name:'Big Daddy’s · Soulard',kind:'soulard',height:3.1,floors:2,wall:'#a96749',trim:'#e0cdb0',sign:'BIG DADDY’S',accent:'#7c2f30'}
};
export function localLandmark(building)
{
    return building.venueProfile || LOCAL_LANDMARKS[String(building.osmId)] || NAMED_LANDMARKS[building.name] || (building.name==='White Castle'?{name:'White Castle',kind:'castle',height:1.65,floors:1,wall:'#eceee6',trim:'#ffffff',sign:'White Castle',accent:'#275b98'}:null);
}

export function landmarkFacade(scene,profile)
{
    const material=new BABYLON.StandardMaterial(`Landmark ${profile.kind}`,scene);
    const texture=new BABYLON.DynamicTexture(`${profile.name} facade`,{width:RenderProfile.landmarkTexture,height:RenderProfile.landmarkTexture},scene,true),c=texture.getContext();
    c.scale(RenderProfile.landmarkTexture/1024,RenderProfile.landmarkTexture/1024);
    const {wall,trim,kind,floors,accent}=profile;
    c.fillStyle=wall;c.fillRect(0,0,1024,1024);
    c.lineWidth=1;c.strokeStyle='rgba(45,24,14,.22)';
    for(let y=0;y<1024;y+=12){c.beginPath();c.moveTo(0,y);c.lineTo(1024,y);c.stroke();for(let x=(y/12%2)*24;x<1024;x+=48)c.strokeRect(x,y,48,12);}
    if(kind==='fuel'){c.fillStyle=wall;c.fillRect(0,0,1024,1024);c.fillStyle=accent;c.fillRect(0,80,1024,90);}
    if(kind==='hampton'){c.fillStyle=trim;c.fillRect(0,0,1024,225);}
    const floorHeight=880/floors,bays=kind==='police'?12:kind==='hyatt'?14:8;
    for(let f=0;f<floors;f++)for(let j=0;j<bays;j++)
    {
        const x=j*1024/bays+18,y=100+f*floorHeight,w=1024/bays-36,h=floorHeight*.73;
        c.fillStyle=trim;c.fillRect(x-4,y-4,w+8,h+8);
        const gradient=c.createLinearGradient(x,y,x+w,y+h);gradient.addColorStop(0,'#77959b');gradient.addColorStop(.45,'#405763');gradient.addColorStop(.5,'#8099a0');gradient.addColorStop(1,'#1b303a');
        c.fillStyle=gradient;c.fillRect(x,y,w,h);
        c.fillStyle='#a89d89';c.fillRect(x+2,y+2,w-4,h*.16);
        c.fillStyle=trim;c.fillRect(x+w*.5,y,2,h);
        if(kind==='drury'||kind==='plaza'){c.fillRect(x-9,y+h+7,w+18,5);c.fillRect(j*1024/bays+3,80,5,915);}
    }
    const groundY=kind==='cookies'||kind==='castle'?340:Math.max(760,1024-floorHeight);
    c.fillStyle=kind==='maggie'?wall:trim;c.fillRect(0,groundY,1024,1024-groundY);
    for(let j=0;j<6;j++)
    {
        const x=22+j*170,w=128,y=groundY+22,h=1000-y;c.fillStyle='#233d43';
        if(kind==='drury'||kind==='police') {c.beginPath();c.moveTo(x,1000);c.lineTo(x,y+55);c.ellipse(x+w/2,y+55,w/2,50,0,Math.PI,0);c.lineTo(x+w,1000);c.closePath();c.fill();}
        else c.fillRect(x,y,w,h);
        c.fillStyle='#708d90';c.fillRect(x+8,y+65,w-16,Math.max(4,h-70));
        c.fillStyle=trim;c.fillRect(x+w/2,y+60,5,h-60);
    }
    if(kind==='cookies'){c.fillStyle=accent;c.fillRect(0,35,1024,295);}
    if(kind==='castle'){c.fillStyle=accent;c.fillRect(0,210,1024,40);c.fillStyle='#e3963e';c.fillRect(0,260,1024,16);}
    c.fillStyle=trim;c.fillRect(0,12,1024,16);c.fillRect(0,65,1024,8);
    civicFacade(c,profile);landingFacade(c,profile);
    texture.update();material.diffuseTexture=texture;material.specularColor.set(.08,.08,.08);material.emissiveColor.set(.035,.035,.035);material.backFaceCulling=false;
    return material;
}
