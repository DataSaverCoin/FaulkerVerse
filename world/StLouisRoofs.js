/* Roof silhouettes follow the restored OSM building-part outlines. */
export function shapedRoof(building, geometry, scene, material)
{
    const points=geometry.points,xs=points.map(p=>p[0]),zs=points.map(p=>p[1]);
    const minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
    const cx=(minX+maxX)/2,cz=(minZ+maxZ)/2;
    let mesh;
    if(building.roofShape==='dome')
    {
        const paths=[];
        for(let i=0;i<=12;i++)
        {
            const angle=i/12*Math.PI/2,r=Math.cos(angle),y=geometry.roof+Math.sin(angle)*geometry.roofRise;
            paths.push([...points,points[0]].map(p=>new BABYLON.Vector3(cx+(p[0]-cx)*r,y,cz+(p[1]-cz)*r)));
        }
        mesh=BABYLON.MeshBuilder.CreateRibbon(building.name||'Courthouse copper dome',{pathArray:paths,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene);
    }
    else
    {
        const positions=[],indices=[];
        const elevation=p=>
        {
            const x=Math.abs(p[0]-cx)/((maxX-minX)/2||1),z=Math.abs(p[1]-cz)/((maxZ-minZ)/2||1);
            if(building.roofShape==='skillion')return geometry.roof+geometry.roofRise*(p[0]-minX)/(maxX-minX||1);
            if(building.roofShape==='round'){const t=maxX-minX>maxZ-minZ?z:x;return geometry.roof+geometry.roofRise*Math.sqrt(Math.max(0,1-t*t));}
            const amount=building.roofShape==='gabled'?(maxX-minX>maxZ-minZ?z:x):Math.max(x,z);
            return geometry.roof+geometry.roofRise*Math.max(0,1-amount);
        };
        const triangle=(a,b,c,depth)=>
        {
            if(depth){const mid=(p,q)=>[(p[0]+q[0])/2,(p[1]+q[1])/2];const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);triangle(a,ab,ca,depth-1);triangle(ab,b,bc,depth-1);triangle(ca,bc,c,depth-1);triangle(ab,bc,ca,depth-1);return;}
            const n=positions.length/3;for(const p of [a,b,c])positions.push(p[0],elevation(p),p[1]);indices.push(n,n+1,n+2);
        };
        for(let i=0;i<geometry.roofTriangles.length;i+=3)triangle(...geometry.roofTriangles.slice(i,i+3).map(j=>points[j]),2);
        // Close raised gable edges so the pitched roof cannot expose a gap above walls.
        for(let i=0;i<points.length;i++)
        {
            const a=points[i],b=points[(i+1)%points.length],n=positions.length/3;
            positions.push(a[0],geometry.roof,a[1],b[0],geometry.roof,b[1],b[0],elevation(b),b[1],a[0],elevation(a),a[1]);
            indices.push(n,n+1,n+2,n,n+2,n+3);
        }
        mesh=new BABYLON.Mesh(building.name||'STL roof crown',scene);const data=new BABYLON.VertexData();data.positions=positions;data.indices=indices;data.normals=[];BABYLON.VertexData.ComputeNormals(positions,indices,data.normals);data.applyToMesh(mesh);
    }
    const vertices=mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind),uv=[];for(let i=0;i<vertices.length;i+=3)uv.push(vertices[i]/5,vertices[i+2]/5);mesh.setVerticesData(BABYLON.VertexBuffer.UVKind,uv);
    mesh.material=material;material.backFaceCulling=false;mesh.freezeWorldMatrix();return mesh;
}
