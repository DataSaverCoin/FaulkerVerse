/* Uniform grid for local collision and bridge queries. */
export class MapSpatialIndex
{
    constructor(size=100) { this.size=size; this.cells=new Map(); }
    insert(item,points,padding=0)
    {
        const xs=points.map(p=>p[0]),zs=points.map(p=>p[1]);
        for(let x=Math.floor((Math.min(...xs)-padding)/this.size);x<=Math.floor((Math.max(...xs)+padding)/this.size);x++)
            for(let z=Math.floor((Math.min(...zs)-padding)/this.size);z<=Math.floor((Math.max(...zs)+padding)/this.size);z++)
            {
                const key=`${x}:${z}`;
                if(!this.cells.has(key)) this.cells.set(key,[]);
                this.cells.get(key).push(item);
            }
    }
    at(x,z) { return this.cells.get(`${Math.floor(x/this.size)}:${Math.floor(z/this.size)}`)||[]; }
}
