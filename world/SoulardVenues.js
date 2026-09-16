/* Bundled OSM venue locations; match existing walls without changing road clearance. */
export function prepareSoulardVenues(map, data)
{
    const distance=(v,points)=>{
        let inside=false,best=Infinity;
        for(let i=0,j=points.length-1;i<points.length;j=i++){
            const a=points[j],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1];
            if((a[1]>v.z)!==(b[1]>v.z)&&v.x<(b[0]-a[0])*(v.z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
            const t=Math.max(0,Math.min(1,((v.x-a[0])*dx+(v.z-a[1])*dz)/(dx*dx+dz*dz||1)));
            best=Math.min(best,Math.hypot(v.x-a[0]-t*dx,v.z-a[1]-t*dz));
        }
        return inside?0:best;
    };
    map.soulardVenueAudit=[];
    for(const venue of data.venues){
        if(venue.footprint){
            if(venue.footprint.points.some(p=>Math.hypot(...p)>map.data.radiusMeters*map.data.scale))throw new Error('Venue outline outside playable map: '+venue.name);
            map.data.buildings.push({...venue.footprint});
        }
        const sourceMatch=b=>venue.buildingIndex!==undefined&&b.sourceBuildingIndex===venue.buildingIndex;
        const candidates=map.data.buildings.map(b=>({b,d:distance(venue,b.points)}))
            .filter(c=>c.d<5||sourceMatch(c.b)||c.b.osmId==='venue-'+venue.osmId).sort((a,b)=>a.d-b.d);
        const match=candidates.find(c=>c.b.osmId==='venue-'+venue.osmId)||candidates.find(c=>sourceMatch(c.b))||candidates.find(c=>String(c.b.osmId)===venue.osmId)||candidates[0];
        if(!match){map.soulardVenueAudit.push({name:venue.name,matched:false});continue;}
        const b=match.b;
        if(b.venueProfile){b.venueProfile.name+=' / '+venue.name;b.venueProfile.sign=b.venueProfile.name;}
        else{
            const seed=[...venue.name].reduce((s,c)=>s+c.charCodeAt(0),0);
            b.venueProfile={name:venue.name,sign:venue.name.toUpperCase(),kind:'soulard',height:b.height,floors:Math.max(1,b.levels||Math.round(b.height/1.05)),wall:['#964d39','#a96749','#884a3c'][seed%3],trim:'#dec5a2',accent:/Irish|McGurk/.test(venue.name)?'#174f3d':['#304c3b','#7c2f30','#303d43'][seed%3]};
        }
        map.soulardVenueAudit.push({name:venue.name,matched:true,building:b.osmId,distance:match.d});
    }
}
