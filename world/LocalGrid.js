/* Nearby entity lookup avoids scanning the entire population for every agent. */
export class LocalGrid
{
    constructor(size=16){this.size=size;this.cells=new Map();}
    key(x,z){return `${Math.floor(x/this.size)}:${Math.floor(z/this.size)}`;}
    rebuild(items,position=item=>item.mesh.position)
    {
        this.cells.clear();
        for(const item of items){const p=position(item),key=this.key(p.x,p.z);if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(item);}
    }
    near(x,z,radius=12)
    {
        const found=[];
        for(let i=Math.floor((x-radius)/this.size);i<=Math.floor((x+radius)/this.size);i++)
            for(let j=Math.floor((z-radius)/this.size);j<=Math.floor((z+radius)/this.size);j++)found.push(...(this.cells.get(`${i}:${j}`)||[]));
        return found;
    }
}
