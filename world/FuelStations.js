/* Match actual named stations already in the bundled map. No remote requests. */
export function prepareFuelStations(map)
{
    const sites=[];
    for(const b of map.data.buildings){
        if(!/^(Phillips 66|Circle K|Mobil|Mobil Mart|Gas[ -]Mart|GAS MART|Shell Gas Station)$/.test(b.name||''))continue;
        const x=b.points.reduce((s,p)=>s+p[0],0)/b.points.length,z=b.points.reduce((s,p)=>s+p[1],0)/b.points.length;
        if(sites.some(p=>Math.hypot(p.x-x,p.z-z)<18))continue;
        sites.push({x,z});const accent=/Shell/.test(b.name)?'#e6ae22':/Mobil/.test(b.name)?'#275a9a':'#b33332';
        b.venueProfile={name:b.name+' · Fuel & Market',kind:'fuel',sign:b.name.toUpperCase(),height:b.height,floors:Math.max(1,b.levels||Math.round(b.height/1.05)),wall:'#ddd4be',trim:'#f2e8ce',accent};
    }
}
