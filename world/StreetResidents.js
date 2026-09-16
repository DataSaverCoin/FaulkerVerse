/* Fictional adult residents; everyday conversations, with no sexual scenes. */
export function addStreetResidents(population)
{
    const adults=population.people.filter(p=>p.age==='adult'&&!population.people.some(child=>child.guardian===p));
    const wheel=population.map.wheel?.entrance||{x:-350,z:-60},arch=population.map.data.arch;
    const profiles=[
        {name:'Drew',role:'unhoused resident',x:wheel.x,z:wheel.z,greeting:'Hi, I’m Drew. I’m staying outside while I look for a stable place. I like watching the trains from here.'},
        {name:'Robin',role:'unhoused resident',x:arch.x-90,z:arch.z+40,greeting:'Hello. I’m between places to live right now. Thanks for stopping to talk—this riverside walk is a good place for some quiet.'},
        {name:'Lee',role:'unhoused resident',x:-120,z:115,greeting:'Hey, I’m Lee. I’m working on finding housing. I used to work around these old warehouse buildings.'},
        {name:'Vanessa',role:'adult sex worker',x:wheel.x+25,z:wheel.z,greeting:'Hi, I’m Vanessa. I do sex work, but I’m off the clock and waiting for a friend. Have you tried the Ferris wheel?'},
        {name:'Cameron',role:'adult sex worker',x:-30,z:110,greeting:'Hi, I’m Cameron. I’m an adult sex worker. Right now I’m just taking a break and enjoying the neighborhood.'}
    ];
    population.residents=[];
    for(const [i,profile] of profiles.entries())
    {
        const p=adults[i];if(!p)continue;
        const options=population.paths.map(path=>{const d=Math.max(1,Math.min(path.length-1,(profile.x-path.a.x)*path.dx+(profile.z-path.a.z)*path.dz));return {path,d,distance:Math.hypot(profile.x-path.a.x-path.dx*d,profile.z-path.a.z-path.dz*d)};}).sort((a,b)=>a.distance-b.distance);
        if(!options.length)continue;
        Object.assign(p,{name:profile.name,role:profile.role,greeting:profile.greeting,path:options[0].path,distance:options[0].d,speed:.25,wait:20+i*5});
        if(profile.role==='unhoused resident')
        {
            const scene=population.map.scene;
            const material=new BABYLON.StandardMaterial(`${profile.name} canvas backpack`,scene);material.diffuseColor=BABYLON.Color3.FromHexString(['#5f7059','#7a5e47','#596b7b'][i]);
            p.belongings=BABYLON.MeshBuilder.CreateBox(`${profile.name} travel backpack`,{width:.22,height:.3,depth:.16},scene);p.belongings.material=material;
        }
        population.residents.push(p);population.place(p);
    }
}
