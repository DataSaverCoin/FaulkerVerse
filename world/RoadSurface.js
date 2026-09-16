import { MapSpatialIndex } from './MapSpatialIndex.js';

/* The vehicle samples the very triangles that are rendered as pavement. */
export class RoadSurface
{
    constructor() { this.index=new MapSpatialIndex(25); }
    add(vertices)
    {
        this.index.insert(vertices,vertices.map(p=>[p[0],p[2]]));
    }
    height(x,z)
    {
        let height=-Infinity;
        for(const quad of this.index.at(x,z))
        {
            for(const ids of [[0,1,2],[1,3,2]])
            {
                const [a,b,c]=ids.map(i=>quad[i]);
                const den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);
                if(Math.abs(den)<1e-9)continue;
                const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den;
                const v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den;
                if(u>=-1e-6&&v>=-1e-6&&u+v<=1.000001)height=Math.max(height,u*a[1]+v*b[1]+(1-u-v)*c[1]);
            }
        }
        return Number.isFinite(height)?height:null;
    }
}
