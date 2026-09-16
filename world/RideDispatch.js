/* Independent random dispatch with physical separation and recent-stop memory. */
export class RideDispatch
{
    constructor(stops,random=Math.random)
    {
        this.stops=stops;this.random=random;this.recent=[];
    }
    next(position,lastDropoff)
    {
        const distance=(a,b)=>b?Math.hypot(a.x-b.x,a.z-b.z):Infinity;
        const pickups=this.stops.filter(s=>distance(s,position)>=25&&distance(s,lastDropoff)>=25);
        const fresh=pickups.filter(s=>!this.recent.includes(s.name));
        const pool=fresh.length?fresh:pickups;
        if(!pool.length)return null;
        const pickup=pool[Math.floor(this.random()*pool.length)];
        const destinations=this.stops.filter(s=>s!==pickup&&distance(s,pickup)>=40&&s.name!==lastDropoff?.name);
        if(!destinations.length)return null;
        const destination=destinations[Math.floor(this.random()*destinations.length)];
        this.recent.push(pickup.name,destination.name);this.recent=this.recent.slice(-8);
        return [pickup,destination];
    }
}

export function rideStops(map)
{
    const stops=map.data.stops.filter(s=>Math.hypot(s.x,s.z)<700).map(s=>({...s,category:'venue'}));
    for(const building of map.data.buildings)
    {
        const name=building.name||'';
        const category=/hotel|hilton|hyatt|drury|marriott|westin|hampton|loews|four seasons|inn\b|suites/i.test(name)?'hotel':/restaurant|grill|tavern|cafe|café|kitchen|soda fountain|brew|steak|bar\b/i.test(name)?'restaurant':/stadium|center|theatre|theater|museum|aquarium|village/i.test(name)?'venue':null;
        if(!category)continue;
        const x=building.points.reduce((a,p)=>a+p[0],0)/building.points.length,z=building.points.reduce((a,p)=>a+p[1],0)/building.points.length;
        if(Math.hypot(x,z)<700)stops.push({name,x,z,category});
    }
    if(map.wheel)stops.push({name:'The St. Louis Wheel',x:map.wheel.root.position.x,z:map.wheel.root.position.z,category:'venue'});
    const result=[];
    for(const stop of stops)
    {
        const point={...stop,...map.nearestRoad(stop.x,stop.z)};
        if(point.distance>65||map.isBlocked(point.x,point.z,1.2,true)||result.some(s=>s.name===point.name||Math.hypot(s.x-point.x,s.z-point.z)<8))continue;
        result.push(point);
    }
    return result;
}
