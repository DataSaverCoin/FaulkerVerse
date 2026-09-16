/* Delayed vehicle fire gives every occupant an explicit escape window. */
export class CartEmergency
{
    constructor(session)
    {
        this.session=session;this.stage='normal';this.elapsed=0;this.evacuated=[];
        session.cart.emergency=this;
        const scene=session.cart.scene;this.root=new BABYLON.TransformNode('Cart hazard effects',scene);
        const material=(name,color,alpha=1)=>{const m=new BABYLON.StandardMaterial(name,scene);m.diffuseColor=BABYLON.Color3.FromHexString(color);m.specularColor.set(0,0,0);m.emissiveColor=m.diffuseColor.scale(name==='smoke'?.15:1);m.alpha=alpha;return m;};
        const smoke=material('smoke','#42494b',.55),orange=material('flame','#ff6715',.9),yellow=material('flame core','#ffe26b'),black=material('charred wreck','#202626');
        this.puffs=Array.from({length:10},(_,i)=>{const m=BABYLON.MeshBuilder.CreateSphere('Cart smoke',{diameter:.5,segments:5},scene);m.parent=this.root;m.material=smoke;m.isPickable=false;return m;});
        this.flames=Array.from({length:6},(_,i)=>{const m=BABYLON.MeshBuilder.CreateCylinder('Cart fire',{height:1.2,diameterBottom:.35,diameterTop:0,tessellation:5},scene);m.parent=this.root;m.material=i%2?yellow:orange;m.position.set((i%3-1)*.28,.65,(i<3?-.35:.35));m.isPickable=false;return m;});
        this.blast=BABYLON.MeshBuilder.CreateSphere('Cart explosion',{diameter:1,segments:8},scene);this.blast.parent=this.root;this.blast.material=material('explosion','#ffb342',.8);this.blast.position.y=.6;this.blast.isPickable=false;
        this.wreck=BABYLON.MeshBuilder.CreateBox('Burned cart chassis',{width:.95,height:.24,depth:1.9},scene);this.wreck.parent=this.root;this.wreck.position.y=.27;this.wreck.rotation.z=.12;this.wreck.material=black;this.wreck.isPickable=false;
        this.reset();
    }
    get active(){return this.stage==='smoke'||this.stage==='fire';}
    get occupied(){return this.session.player.isDriving||['PASSENGER_ONBOARD','DRIVING_TO_DESTINATION'].includes(this.session.rideSystem.state);}
    get label(){return this.active?`${this.stage==='smoke'?'SMOKE':'FIRE'} · explosion in ${Math.ceil(24-this.elapsed)}s`:this.stage==='exploded'?'EXPLODED · Spawn a replacement':'';}
    begin()
    {
        if(this.stage!=='normal')return;
        this.stage='smoke';this.elapsed=0;this.session.cart.wrecked=true;
        this.session.life.clearInput();this.root.setEnabled(true);
    }
    evacuate()
    {
        const s=this.session;if(!this.active)return null;
        const spot=s.life.safeSpot(s.cart.position.x,s.cart.position.z,.3,false,6);
        if(!spot){s.life.message='Exit blocked. Try the evacuation button again.';return null;}
        const riderSpot=s.life.safeSpot(s.cart.position.x,s.cart.position.z,.3,false,6,spot);
        if(this.occupied&&!riderSpot){s.life.message='Exit blocked. Try evacuation again.';return null;}
        const driver=s.cart.driver;this.session.life.clearInput();
        if(driver){s.cart.driver=null;driver.exitVehicle(new BABYLON.Vector3(spot.x,s.terrain.getHeightAt(spot.x,spot.z)+1,spot.z));driver.verticalVelocity=0;}
        const r=s.rideSystem;
        if(['PASSENGER_ONBOARD','DRIVING_TO_DESTINATION'].includes(r.state)&&r.passengerAvatar)
        {
            const avatar=r.passengerAvatar;avatar.root.position.set(riderSpot.x,s.terrain.getHeightAt(riderSpot.x,riderSpot.z)+.02,riderSpot.z);avatar.root.setEnabled(true);avatar.update(0,false,false,false);
            this.evacuated.push({avatar,remaining:30});r.passengerAvatar=null;r.passenger=null;
        }
        s.life.cancelFare();s.life.immunity=Math.max(s.life.immunity,3);
        s.life.message='Everyone is clear. Spawn a fresh cart when ready.';
        s.player.cameraController?.restoreFollow();return driver||true;
    }
    update(delta)
    {
        const dt=Math.max(0,Math.min(delta,.1)),s=this.session;
        for(const person of this.evacuated){person.remaining-=dt;if(person.remaining<=0)person.avatar.dispose();}
        this.evacuated=this.evacuated.filter(p=>p.remaining>0);
        if(this.stage==='normal')return;
        this.elapsed+=dt;this.root.position.copyFrom(s.cart.position);this.root.rotation.y=s.cart.rotation.y;
        if(this.active&&this.elapsed>=12)this.stage='fire';
        if(this.active&&this.elapsed>=24)
        {
            this.stage='exploded';s.cart.visualRoot.setEnabled(false);this.wreck.setEnabled(true);
            if(Math.hypot(s.player.position.x-s.cart.position.x,s.player.position.z-s.cart.position.z)<3.5||s.player.isDriving)s.life.hurt(100,'Caught in the cart explosion');
            if(['PASSENGER_ONBOARD','DRIVING_TO_DESTINATION'].includes(s.rideSystem.state))s.life.cancelFare();
        }
        this.puffs.forEach((m,i)=>{const t=(this.elapsed*.45+i/10)%1;m.position.set(Math.sin(i*2.4+t)*.3,.5+t*2.8,Math.cos(i*2.4)*.3);m.scaling.setAll(.5+t*1.7);m.setEnabled(this.stage!=='exploded'||this.elapsed<29);});
        this.flames.forEach((m,i)=>{m.setEnabled(this.stage==='fire');m.scaling.y=.65+Math.sin(this.elapsed*17+i)*.3;});
        this.blast.setEnabled(this.stage==='exploded'&&this.elapsed<25);this.blast.scaling.setAll(Math.max(.1,(this.elapsed-24)*6));
    }
    reset()
    {
        this.stage='normal';this.elapsed=0;this.root.setEnabled(false);this.wreck.setEnabled(false);this.blast.setEnabled(false);this.flames.forEach(m=>m.setEnabled(false));
        this.session.cart.visualRoot.setEnabled(true);
    }
}
