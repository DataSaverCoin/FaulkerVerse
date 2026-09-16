/* Downtown-wide textures, retaining site-specific hotel and landmark treatments. */
export function downtownFacade(building)
{
    if(building.facadeProfile)return building.facadeProfile;
    const name=building.name||'',id=String(building.osmId||'');
    const sites={
        '255486247':'village-brick', '743116497':'village-glass',
        '743116498':'hotel-modern', '743116499':'village-glass',
        '1168333021':'village-brick', '1321451725':'village-brick',
        '108705187':'hotel-union', '109152484':'hotel-historic',
        '108704347':'hotel-hyatt', '108704344':'hotel-drury'
    };
    if(sites[id])return sites[id];
    if(building.corridor==='Washington Avenue'&&!/garage|parking/i.test(name))
    {
        if(/Ely Walker|Meridian|Railway|Terra Cotta|Dorsa|Banker/i.test(name))return 'city-historic';
        if(building.height<15)return 'city-warehouse';
    }
    const x=building.points.reduce((s,p)=>s+p[0],0)/building.points.length;
    const z=building.points.reduce((s,p)=>s+p[1],0)/building.points.length;
    if(/Courthouse|^Busch Stadium$|^Enterprise Center$|^The Dome/.test(name))return null;
    if(/garage|parking/i.test(name)||building.kind==='parking')return 'city-parking';
    if(/^(North|South) Broadway$/.test(building.corridor)&&building.height<=22&&building.material!=='glass')
        return /stone|concrete|limestone/.test(building.material||'')?'broadway-stone':/warehouse|industrial/.test(building.kind||'')?'broadway-warehouse':'broadway-brick';
    if(building.kind==='residential'||(building.kind!=='hotel'&&!/hotel|hilton|hyatt|marriott|drury|westin|hampton|loews|four seasons|residence inn|pear tree|courtyard|fairfield|embassy suites|le m[eé]ridien/i.test(name)))
    {
        if(/church|cathedral|basilica|post office|library|museum/i.test(name)||/church|civic/.test(building.kind||''))return 'city-historic';
        if(building.material==='glass'||building.height>22)return 'city-glass';
        if(/warehouse|industrial/.test(building.kind||'')||/warehouse|factory|loft/i.test(name))return 'city-warehouse';
        if(/stone|granite|limestone|concrete/.test(building.material||''))return 'city-stone';
        return 'city-brick';
    }
    if(/Four Seasons|Hyatt|Loews/.test(name))return 'hotel-modern';
    if(/Westin|Union Station|Residence Inn/.test(name))return 'hotel-brick';
    if(/Magnolia|Saint Louis|Pennywell|Last Hotel|Museum|Athletic/.test(name))return 'hotel-historic';
    return 'hotel-stone';
}

export function installDowntownFacades(palette)
{
    const colors={
        'hotel-union':['#b39b82','#394a50','#d2bca4'],
        'hotel-modern':['#a7adb0','#467386','#c8d2d2'],
        'hotel-brick':['#985640','#344a55','#d5bb97'],
        'hotel-historic':['#cbbba0','#354955','#eee2c9'],
        'hotel-stone':['#bca88c','#3c5766','#e1d3b9'],
        'village-brick':['#a94b35','#28473e','#d3a57d'],
        'village-glass':['#5a6b72','#345f73','#b1c2c6'],
        'hotel-hyatt':['#c6b7a2','#435d6e','#eee1cb'],
        'hotel-drury':['#a55842','#354d54','#e0c5a1'],
        'broadway-brick':['#a2573e','#344e52','#d5b996'],
        'broadway-stone':['#b6aa91','#3c5358','#e4d4b4'],
        'broadway-warehouse':['#824734','#344247','#bba080'],
        'city-brick':['#91523e','#3c535d','#cdb99d'],
        'city-stone':['#b8b3a4','#3f5965','#dcd8c9'],
        'city-historic':['#c6b594','#3e5058','#ecdec1'],
        'city-glass':['#6e8087','#31586d','#a7bbc0'],
        'city-warehouse':['#9d644b','#394b50','#b09b83'],
        'city-parking':['#a9aca4','#303a3c','#c5c8bf']
    };
    for(const [name,[wall,glass,trim]] of Object.entries(colors))
    {
        const modern=/modern|glass/.test(name),brick=/brick|drury|warehouse/.test(name),historic=/historic|drury|union/.test(name);
        const material=new BABYLON.StandardMaterial(`Downtown ${name}`,palette.scene);
        material.emissiveColor=new BABYLON.Color3(.045,.045,.04);
        material.specularColor=new BABYLON.Color3(...(modern?[.25,.28,.3]:[.05,.05,.05]));
        const tex=new BABYLON.DynamicTexture(`${name} four-bay facade`,{width:512,height:512},palette.scene,true),ctx=tex.getContext();
        ctx.fillStyle=wall;ctx.fillRect(0,0,512,512);
        // Seeded flecks add surface variation without a new random texture on each load.
        for(let i=0;i<3800;i++)
        {
            ctx.fillStyle=i%2?'rgba(255,255,235,.065)':'rgba(30,22,18,.055)';
            ctx.fillRect((i*97)%512,(i*193+Math.floor(i/512)*17)%512,2,2);
        }
        ctx.strokeStyle=brick?'#754333':'#a79780';ctx.lineWidth=1;
        const row=brick?12:64,col=brick?40:128;
        for(let y=0;y<512;y+=row)
        {
            ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(512,y);ctx.stroke();
            for(let x=(y/row%2)*col/2;x<512;x+=col){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+row);ctx.stroke();}
        }
        for(let floor=0;floor<2;floor++)for(let bay=0;bay<4;bay++)
        {
            const x=bay*128,y=floor*256,margin=modern?7:27,w=128-margin*2;
            ctx.fillStyle=trim;ctx.fillRect(x+margin-5,y+28,w+10,198);
            const reflection=ctx.createLinearGradient(x,0,x+128,0);
            reflection.addColorStop(0,glass);reflection.addColorStop(.48,'#73949e');reflection.addColorStop(.51,glass);reflection.addColorStop(1,'#233842');
            ctx.fillStyle=reflection;ctx.fillRect(x+margin,y+34,w,182);
            ctx.fillStyle=(floor+bay)%3===0?'#b5a98b':'#6b7673';
            ctx.fillRect(x+margin+2,y+36,w-4,18+((bay*7+floor*11)%30));
            ctx.fillStyle=trim;ctx.fillRect(x+62,y+34,4,182);
            if(!modern)ctx.fillRect(x+margin,y+122,w,4);
            ctx.fillStyle='rgba(10,18,22,.5)';ctx.fillRect(x+margin-5,y+226,w+10,5);
            if(historic){ctx.fillStyle='#e9ddc4';ctx.fillRect(x+9,y,9,256);ctx.fillRect(x+110,y,9,256);ctx.fillRect(x+22,y+17,84,9);}
        }
        if(name==='city-parking')
        {
            ctx.fillStyle=wall;ctx.fillRect(0,0,512,512);
            for(const y of [0,256])
            {
                ctx.fillStyle='#253437';ctx.fillRect(0,y+60,512,145);
                ctx.fillStyle='#777f79';ctx.fillRect(0,y+182,512,26);
                ctx.fillStyle=trim;ctx.fillRect(0,y+218,512,30);
                for(let x=0;x<512;x+=128){ctx.fillStyle=wall;ctx.fillRect(x,y,18,256);}
            }
        }
        if(name.startsWith('broadway-')){
            // Deep lintels and cast-iron ties distinguish Broadway masonry.
            for(const y of [18,274])for(let x=0;x<512;x+=128){ctx.fillStyle=trim;ctx.fillRect(x+18,y,92,9);ctx.fillStyle='#303a38';ctx.fillRect(x+8,y+94,8,8);}
        }
        ctx.fillStyle=trim;for(const y of [0,248,504])ctx.fillRect(0,y,512,8);
        tex.update();tex.anisotropicFilteringLevel=8;tex.wrapU=tex.wrapV=BABYLON.Texture.WRAP_ADDRESSMODE;
        material.diffuseTexture=tex;palette.walls[name]=material;
        const lobby=new BABYLON.StandardMaterial(`${name} street frontage`,palette.scene);
        const entrance=new BABYLON.DynamicTexture(`${name} storefront`,{width:512,height:256},palette.scene,true),c=entrance.getContext();
        c.fillStyle=wall;c.fillRect(0,0,512,256);c.fillStyle=trim;c.fillRect(0,0,512,28);
        c.fillStyle='#243d46';c.fillRect(18,46,476,196);
        for(let x=24;x<512;x+=64){c.fillStyle=trim;c.fillRect(x,46,5,196);c.fillStyle='#81918a';c.fillRect(x+7,50,45,25);}
        c.fillStyle=name==='village-brick'?'#9c2427':modern?'#374f54':'#385d4c';c.fillRect(10,28,492,32);
        c.fillStyle='#d6b573';for(const x of [48,208,368])c.fillRect(x,69,20,7);
        entrance.update();lobby.diffuseTexture=entrance;lobby.specularColor=new BABYLON.Color3(.15,.15,.15);
        palette.walls[`${name}-lobby`]=lobby;
    }
    const roof=new BABYLON.StandardMaterial('Downtown detailed roof',palette.scene);
    const tex=new BABYLON.DynamicTexture('Roof membrane seams',{width:256,height:256},palette.scene,true),ctx=tex.getContext();
    ctx.fillStyle='#737976';ctx.fillRect(0,0,256,256);ctx.strokeStyle='#59625f';ctx.lineWidth=3;
    for(let y=0;y<256;y+=64){ctx.strokeRect(0,y,128,64);ctx.strokeRect(128,y,128,64);}
    tex.update();roof.diffuseTexture=tex;roof.specularColor=new BABYLON.Color3(.03,.03,.03);palette.roofs['downtown-roof']=roof;
}

export function facadeGeometry(geometry,building)
{
    // The facade texture contains four bays and two floors; preserve sensible window scale.
    for(let i=0;i<geometry.wallIndexCount/6;i++)
    {
        const n=i*12,u=i*8,p=geometry.positions;
        const bays=Math.max(.5,Math.hypot(p[n+3]-p[n],p[n+5]-p[n+2])/1.35)/4;
        const floors=Math.max(1,building.levels||(geometry.roof-(building.baseElevation||0))/1.05)/2;
        geometry.uvs.splice(u,8,0,0,bays,0,bays,floors,0,floors);
    }
}

export function lobbyGeometry(geometry,scene)
{
    const positions=[],indices=[],uvs=[];
    for(let i=0;i<geometry.wallIndexCount/6;i++)
    {
        const p=geometry.positions,j=i*12,dx=p[j+3]-p[j],dz=p[j+5]-p[j+2],length=Math.hypot(dx,dz);
        if(length<2)continue;
        const floor=Math.max(p[j+1],p[j+4])+.5,top=Math.min(floor+1.35,geometry.roof-.12);
        if(top<=floor)continue;
        const ox=dz/length*.025,oz=-dx/length*.025,n=positions.length/3;
        positions.push(p[j]+ox,floor,p[j+2]+oz,p[j+3]+ox,floor,p[j+5]+oz,p[j+3]+ox,top,p[j+5]+oz,p[j]+ox,top,p[j+2]+oz);
        indices.push(n,n+1,n+2,n,n+2,n+3);uvs.push(0,0,length/5,0,length/5,1,0,1);
    }
    if(!indices.length)return null;
    const mesh=new BABYLON.Mesh('Downtown hotel and village street frontage',scene),vd=new BABYLON.VertexData();
    Object.assign(vd,{positions,indices,uvs,normals:[]});BABYLON.VertexData.ComputeNormals(positions,indices,vd.normals);vd.applyToMesh(mesh);return mesh;
}
