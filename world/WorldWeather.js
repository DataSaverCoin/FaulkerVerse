/* Bounded visual weather and a 20-minute day/night cycle; no live weather service. */
export class WorldWeather
{
    constructor(world,player)
    {
        this.name='World weather';this.world=world;this.scene=world.scene;this.player=player;this.hour=15;this.daytimeForever=false;this.elapsed=0;this.mode='clear';this.auto=true;this.wind=0;this.lightning=false;this.flash=0;this.nextLightning=12;
        this.modes=['clear','cloudy','rain','storm','fog','snow','hail'];this.moonPhase=.65;
        const scene=this.scene,mat=(name,color)=>{const m=new BABYLON.StandardMaterial(name,scene);m.diffuseColor=BABYLON.Color3.FromHexString(color);m.emissiveColor=m.diffuseColor;m.disableLighting=true;return m;};
        this.sun=BABYLON.MeshBuilder.CreateSphere('Visible sun',{diameter:110,segments:16},scene);this.sun.material=mat('Sun glow','#fff0b0');
        this.moon=BABYLON.MeshBuilder.CreateSphere('Visible moon',{diameter:75,segments:16},scene);this.moon.material=mat('Moon surface','#cbd3dd');
        const tex=new BABYLON.DynamicTexture('Moon craters',{width:256,height:128},scene,false),c=tex.getContext();c.fillStyle='#cbd3dd';c.fillRect(0,0,256,128);for(let i=0;i<30;i++){c.fillStyle='rgba(75,86,100,.25)';c.beginPath();c.arc(i*73%256,i*41%128,3+i%8,0,Math.PI*2);c.fill();}tex.update();this.moon.material.diffuseTexture=tex;
        for(const mesh of [this.sun,this.moon]){mesh.isPickable=false;mesh.applyFog=false;}
        const cm=new BABYLON.StandardMaterial('Cloud vapor',scene);cm.diffuseColor=new BABYLON.Color3(.91,.94,.96);cm.specularColor=BABYLON.Color3.Black();cm.alpha=.9;this.cloudMaterial=cm;
        const lumps=[];
        for(let i=0;i<5;i++){const m=BABYLON.MeshBuilder.CreateSphere('Cloud lobe',{diameter:1,segments:8},scene);m.scaling.set(90+i%3*30,25+i%2*12,55);m.position.set(i*50,Math.sin(i)*9,Math.cos(i)*24);m.material=cm;lumps.push(m);}
        this.cloudTemplate=BABYLON.Mesh.MergeMeshes(lumps,true,true);this.cloudTemplate.isVisible=false;this.clouds=[];
        for(let i=0;i<28;i++){const m=this.cloudTemplate.createInstance('Moving cloud');m.isPickable=false;this.clouds.push(m);}
        const lines=[];for(let i=0;i<180;i++){const a=i*2.3999,y=500+(i*137)%2300,r=Math.sqrt(3000*3000-y*y),p=new BABYLON.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);lines.push([p,p.add(new BABYLON.Vector3(2,1,0))]);}
        this.stars=BABYLON.MeshBuilder.CreateLineSystem('Night stars',{lines},scene);this.stars.color=new BABYLON.Color3(.8,.86,1);this.stars.isPickable=false;this.stars.applyFog=false;
        this.rain=new BABYLON.ParticleSystem('Local precipitation',1000,scene);
        const pt=new BABYLON.DynamicTexture('Weather particle',{width:16,height:32},scene,false),pc=pt.getContext();pc.clearRect(0,0,16,32);pc.fillStyle='white';pc.beginPath();pc.ellipse(8,16,4,14,0,0,Math.PI*2);pc.fill();pt.update();this.rain.particleTexture=pt;
        this.rain.emitter=new BABYLON.Vector3();this.rain.minEmitBox=new BABYLON.Vector3(-25,0,-25);this.rain.maxEmitBox=new BABYLON.Vector3(25,8,25);this.rain.colorDead=new BABYLON.Color4(.8,.9,1,0);this.rain.start();
        this.setMode('clear');this.update(0);
    }

    setMode(mode)
    {
        if(!this.modes.includes(mode))return;
        this.mode=mode;const snowy=mode==='snow',wet=['rain','storm','hail'].includes(mode),active=wet||snowy;
        this.rain.emitRate=active?(mode==='storm'?700:400):0;
        this.rain.minSize=snowy?.08:mode==='hail'?.06:.025;this.rain.maxSize=snowy?.18:mode==='hail'?.1:.055;
        this.rain.minLifeTime=snowy?3:.5;this.rain.maxLifeTime=snowy?5:1.1;
        this.rain.minEmitPower=snowy?2:mode==='hail'?16:25;this.rain.maxEmitPower=snowy?3:30;
        this.rain.color1=new BABYLON.Color4(.83,.89,.96,.65);this.rain.color2=new BABYLON.Color4(1,1,1,.85);
        this.rain.minScaleX=1;this.rain.maxScaleX=1;this.rain.minScaleY=snowy||mode==='hail'?1:6;this.rain.maxScaleY=snowy||mode==='hail'?1:9;
        this.rain.gravity=new BABYLON.Vector3(0,snowy?-.3:-7,0);
        this.world.terrain.downtown.materials.road.specularColor=new BABYLON.Color3(...(wet?[.35,.4,.45]:[.03,.03,.03]));
    }

    update(delta)
    {
        const dt=Math.min(Math.max(delta,0),.2);this.elapsed+=dt;this.hour=this.daytimeForever?12:(this.hour+dt/50)%24;
        if(this.auto&&this.elapsed>=90){this.elapsed=0;this.setMode(this.modes[(this.modes.indexOf(this.mode)+1)%this.modes.length]);}
        const angle=(this.hour-6)/24*Math.PI*2,day=Math.max(0,Math.sin(angle));this.wind=Math.sin(this.elapsed/14)*.5+(this.mode==='storm'?1:.1);
        const storm=this.mode==='storm',overcast=['cloudy','rain','storm','snow','hail','fog'].includes(this.mode),darkness=storm?.5:overcast?.78:1;
        const camera=this.scene.activeCamera,center=camera?.globalPosition||this.player.position;
        const sunOffset=new BABYLON.Vector3(Math.cos(angle)*2600,Math.sin(angle)*2600,700);
        this.sun.position.copyFrom(center.add(sunOffset));this.moon.position.copyFrom(center.subtract(sunOffset));
        this.sun.isVisible=day>.015;this.moon.isVisible=day<.08;this.stars.isVisible=day<.1;this.stars.position.copyFrom(center);
        const light=this.world.lighting;light.sun.direction=sunOffset.normalize().scale(-1);light.sun.intensity=(.09+day*1.15)*darkness;
        light.ambientLight.intensity=(.24+day*.4)*darkness;
        const horizon=BABYLON.Color3.Lerp(new BABYLON.Color3(.035,.055,.12),new BABYLON.Color3(.68,.79,.86),day*darkness);
        const zenith=BABYLON.Color3.Lerp(new BABYLON.Color3(.008,.015,.05),new BABYLON.Color3(.18,.47,.76),day*darkness);
        light.sky.material.setColor3('horizonColor',horizon);light.sky.material.setColor3('zenithColor',zenith);
        this.scene.fogColor=horizon;this.scene.fogDensity=this.mode==='fog'?.008:storm?.0025:overcast?.001:.00035;
        this.cloudMaterial.diffuseColor=BABYLON.Color3.Lerp(new BABYLON.Color3(.24,.29,.36),new BABYLON.Color3(.95,.96,.97),day*(storm?.4:1));
        this.clouds.forEach((m,i)=>{m.setEnabled(overcast||i<7);m.position.set(center.x+((i*317+this.elapsed*3)%2200)-1100,center.y+270+i%5*24,center.z+((i*613)%2200)-1100);});
        this.rain.emitter.copyFrom(this.player.position.add(new BABYLON.Vector3(0,14,0)));this.rain.direction1=new BABYLON.Vector3(this.wind*.25,-1,.03);this.rain.direction2=new BABYLON.Vector3(this.wind*.3,-1,.08);
        if(storm&&this.lightning){this.nextLightning-=dt;if(this.nextLightning<=0){this.flash=.12;this.nextLightning=12+Math.random()*15;}}
        this.flash=Math.max(0,this.flash-dt);if(this.flash>0)light.ambientLight.intensity=1.4;
        this.label=`${String(Math.floor(this.hour)).padStart(2,'0')}:${String(Math.floor(this.hour%1*60)).padStart(2,'0')} · ${this.mode}`;
    }
}
