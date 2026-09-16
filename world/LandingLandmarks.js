/* Original facade art on the existing road-cleared OSM buildings. */
const sites={
    '482917419':{name:'Horseshoe Casino',kind:'casino',wall:'#b59c78',trim:'#ebd9ad',accent:'#91272b',sign:'HORSESHOE · ST. LOUIS'},
    '482917416':{name:'Four Seasons Hotel',kind:'glasshotel',wall:'#637f87',trim:'#d3d8cf',accent:'#244b51',sign:'FOUR SEASONS'},
    '108706997':{name:'HoteLumière',kind:'lumiere',wall:'#ccbda7',trim:'#f0e2c7',accent:'#80623b',sign:'HOTELUMIÈRE'},
    '241172882':{name:'The Old Spaghetti Factory · Raeder Place',kind:'landing',wall:'#a75135',trim:'#d8b881',accent:'#653b2c',sign:'THE OLD SPAGHETTI FACTORY'}
};
export function prepareLandingLandmarks(map)
{
    map.landingFacadeAudit=[];
    for(const b of map.data.buildings){
        const x=b.points.reduce((s,p)=>s+p[0],0)/b.points.length,z=b.points.reduce((s,p)=>s+p[1],0)/b.points.length;
        let profile=sites[String(b.osmId)];
        if(!profile&&x>265&&x<355&&z>20&&z<115&&b.height<12){
            const seed=Number(b.osmId)%3;
            profile={name:b.name||'Laclede’s Landing warehouse',kind:'landing',wall:['#8e4835','#b36d48','#a35943'][seed],trim:'#d8c3a0',accent:'#354c43',sign:b.name||'LACLEDE’S LANDING'};
        }
        if(!profile)continue;
        b.venueProfile={...profile,height:b.height,floors:Math.max(1,b.levels||Math.round(b.height/1.05))};
        map.landingFacadeAudit.push({id:b.osmId,name:profile.name,x,z});
    }
}
export function landingFacade(c,p)
{
    if(p.kind==='glasshotel'){
        const glass=c.createLinearGradient(0,0,1024,1024);glass.addColorStop(0,'#b4d8da');glass.addColorStop(.45,'#47727f');glass.addColorStop(.7,'#8caeb3');glass.addColorStop(1,'#294753');c.fillStyle=glass;c.fillRect(0,0,1024,1024);
        c.fillStyle=p.trim;for(let x=0;x<1024;x+=64)c.fillRect(x,0,4,1024);for(let y=0;y<1024;y+=1024/p.floors)c.fillRect(0,y,1024,5);
        c.fillStyle='#c8bfa7';c.fillRect(0,910,1024,114);c.fillStyle='#254550';for(let x=20;x<1024;x+=128)c.fillRect(x,935,104,89);
    }
    if(p.kind==='casino'){
        c.fillStyle=p.wall;c.fillRect(0,0,1024,1024);c.strokeStyle='#9c815e';c.lineWidth=2;
        for(let y=0;y<1024;y+=64)for(let x=(y/64%2)*128;x<1024;x+=256)c.strokeRect(x,y,256,64);
        for(let x=50;x<1024;x+=170){c.fillStyle=p.trim;c.fillRect(x,120,18,750);c.fillStyle='#293941';c.fillRect(x+25,240,100,590);c.fillStyle='#d0a957';c.fillRect(x+33,254,84,10);}
        c.fillStyle=p.accent;c.fillRect(0,60,1024,100);c.fillStyle=p.trim;c.fillRect(0,52,1024,10);c.fillRect(0,164,1024,10);
    }
    if(p.kind==='lumiere'){
        c.fillStyle=p.trim;for(let x=0;x<1024;x+=128)c.fillRect(x,0,12,1024);
        for(let y=85;y<1024;y+=880/p.floors)c.fillRect(0,y,1024,10);
        c.fillStyle=p.accent;c.fillRect(0,20,1024,45);
    }
    if(p.kind==='landing'){
        for(let f=0;f<p.floors-1;f++)for(let x=20;x<1024;x+=128){const y=100+f*880/p.floors;c.strokeStyle=p.trim;c.lineWidth=9;c.beginPath();c.ellipse(x+40,y+24,47,28,0,Math.PI,0);c.stroke();c.fillStyle=p.trim;c.fillRect(x-5,y+880/p.floors*.73+8,90,7);}
        c.fillStyle=p.accent;c.fillRect(0,865,1024,159);for(let x=16;x<1024;x+=128){c.fillStyle='#d4aa67';c.fillRect(x,883,96,127);c.fillStyle='#2d3d3f';c.fillRect(x+7,890,82,115);c.fillStyle='#af8e54';c.fillRect(x+47,890,4,115);}
        c.fillStyle=p.trim;for(const y of [15,32,52])c.fillRect(0,y,1024,8);
    }
}
