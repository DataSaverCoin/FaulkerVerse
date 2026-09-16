/* Stylized St. Louis landforms, not a surveyed elevation or geologic map. */
"use strict";

export class RegionalGeology
{
    constructor(data)
    {
        this.radius = data.radiusMeters * data.scale;
        this.rivers = data.rivers;
        this.riverfront = data.roads.filter(r=>r.name.includes('Leonor K. Sullivan')).flatMap(r=>r.points.slice(1).map((b,i)=>({a:r.points[i],b})));

    }

    riverDistance(x, z)
    {
        let distance = Infinity;
        for (const line of this.rivers)
        {
            for (let i = 1; i < line.length; i++)
            {
                const a = line[i - 1], b = line[i];
                const dx = b[0] - a[0], dz = b[1] - a[1];
                const t = Math.max(0, Math.min(1, ((x-a[0])*dx + (z-a[1])*dz) / (dx*dx+dz*dz || 1)));
                distance = Math.min(distance, Math.hypot(x-a[0]-t*dx, z-a[1]-t*dz));
            }
        }
        return distance;
    }

    riverX(z)
    {
        for(const line of this.rivers) for(let i=1;i<line.length;i++)
        {
            const a=line[i-1],b=line[i];
            if(z>=Math.min(a[1],b[1])&&z<=Math.max(a[1],b[1])&&a[1]!==b[1])
                return a[0]+(b[0]-a[0])*(z-a[1])/(b[1]-a[1]);
        }
        return null;
    }

    halfWidth(z)
    {
        const center=this.riverX(z);
        if(center===null)return 91;
        let roadX=-Infinity;
        for(const {a,b} of this.riverfront)
        {
            if(z>=Math.min(a[1],b[1])-25&&z<=Math.max(a[1],b[1])+25)
            {
                const t=Math.max(0,Math.min(1,(z-a[1])/(b[1]-a[1]||1)));
                roadX=Math.max(roadX,a[0]+(b[0]-a[0])*t);
            }
        }
        // Leave dry pavement, a sidewalk and a bank between the road and water.
        return Math.max(28,Math.min(91,center-roadX-23));
    }

    isWater(x,z,radius=0)
    {
        return this.riverDistance(x,z)<this.halfWidth(z)+radius+2;
    }

    landHeight(x, z)
    {
        // Preserve the original downtown grade; rise gently into western uplands.
        const west = this.smooth(350, 1500, -x);
        const outer = this.smooth(420, 1000, Math.hypot(x, z));
        return 0.06 + outer * west * (16 + 7*Math.sin(z/360) + 5*Math.cos(x/300 + z/510));
    }

    height(x, z)
    {
        const d = this.riverDistance(x,z);
        return -5 + (this.landHeight(x,z) + 5) * this.smooth(this.halfWidth(z)-10, this.halfWidth(z)+14, d);
    }

    smooth(a, b, value)
    {
        const t = Math.max(0, Math.min(1, (value-a)/(b-a)));
        return t*t*(3-2*t);
    }

    describe(x,z)
    {
        if (this.riverDistance(x,z) < 210) return 'River alluvium · sand, silt & gravel';
        if (x < -550) return 'Loess uplands · limestone beneath';
        return 'Urban terrace · soil over sedimentary bedrock';
    }

    color(x,z)
    {
        const d = this.riverDistance(x,z);
        if (d < 112) return [0.49, 0.43, 0.30];
        const patch = 0.025*Math.sin(x/42)*Math.cos(z/53);
        return [0.26+patch,0.40+patch,0.22+patch];
    }

    createFeatures(map)
    {
        const scene = map.scene;
        for (const line of this.rivers)
        {
            const detailed=[];
            for(let i=1;i<line.length;i++)
            {
                const a=line[i-1],b=line[i],count=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/5);
                for(let j=0;j<count;j++)detailed.push([a[0]+(b[0]-a[0])*j/count,a[1]+(b[1]-a[1])*j/count]);
            }
            detailed.push(line.at(-1));
            const banks = [-1,1].map(side => detailed.map((p,i) =>
            {
                const a=detailed[Math.max(0,i-1)], b=detailed[Math.min(detailed.length-1,i+1)];
                const offset=side*this.halfWidth(p[1]);
                const length=Math.hypot(b[0]-a[0],b[1]-a[1]) || 1;
                return new BABYLON.Vector3(p[0]+offset*(b[1]-a[1])/length,-1.0,p[1]-offset*(b[0]-a[0])/length);
            }));
            const river = BABYLON.MeshBuilder.CreateRibbon('Mississippi River', {pathArray:banks,sideOrientation:BABYLON.Mesh.DOUBLESIDE}, scene);
            river.material=map.materials.water;
        }
        const stone = new BABYLON.StandardMaterial('Limestone beds',scene);
        stone.diffuseColor=new BABYLON.Color3(0.65,0.61,0.49);
        const soil = new BABYLON.StandardMaterial('Loess cap',scene);
        soil.diffuseColor=new BABYLON.Color3(0.49,0.35,0.20);
        this.outcrops=[];
        for (let i=0;i<500 && this.outcrops.length<24;i++)
        {
            const x=-620-(i%12)*145, z=-2100+Math.floor(i/12)*107;
            if (Math.hypot(x,z)>this.radius-70 || map.nearestRoad(x,z).distance<16 || map.isBlocked(x,z,8)) continue;
            this.outcrops.push({x,z,radius:7});
            const base=this.height(x,z);
            for(let layer=0;layer<4;layer++)
            {
                const rock=BABYLON.MeshBuilder.CreateCylinder(layer===3?'Loess cap':'Limestone stratum',{
                    diameterTop:12-layer*1.4,diameterBottom:14-layer*1.4,height:1.4,tessellation:7
                },scene);
                rock.position.set(x,base+layer*1.3+0.6,z);
                rock.rotation.y=i*1.7;
                rock.material=layer===3?soil:stone;
                rock.checkCollisions=true;
                rock.freezeWorldMatrix();
            }
        }
        const boundary=[];
        for(let i=0;i<=180;i++)
        {
            const angle=i*Math.PI/90,x=Math.cos(angle)*this.radius,z=Math.sin(angle)*this.radius;
            boundary.push(new BABYLON.Vector3(x,Math.max(0,this.height(x,z))+0.5,z));
        }
        const edge=BABYLON.MeshBuilder.CreateLines('Five-mile exploration boundary',{points:boundary},scene);
        edge.color=new BABYLON.Color3(0.9,0.70,0.29);
    }
}
