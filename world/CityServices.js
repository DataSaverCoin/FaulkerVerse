import {ScenicGeometry} from './ScenicGeometry.js';
import {landmarkSign} from './LandmarkArchitecture.js';
import {VehicleRadio} from '../engine/VehicleRadio.js';
/* Purchases and cash rewards use the same wallet as passenger fares. */
export class CityServices
{
    constructor(session,parent){
        this.session=session;this.map=session.terrain.downtown;this.wallet=session.rideSystem.wallet;this.stations=[];this.map.servicePumps=this.stations;this.cash=[];this.hunger=100;this.thirst=100;this.elapsed=0;
        this.radio=new VehicleRadio(session,parent);
        this.root=document.createElement('details');this.root.className='cityServices';this.root.innerHTML='<summary>Fuel, food & money</summary><div class="supplyMeters"></div><p class="stationHint"></p><button class="fuelBuy">Gas · 5 L / $10</button> <button class="foodBuy">Sandwich · $8</button> <button class="drinkBuy">Water · $3</button><p class="supplyMessage" role="status">Go on duty for fares. Collect glowing cash on foot.</p>';
        parent.appendChild(this.root);for(const [cls,item] of [['fuelBuy','fuel'],['foodBuy','food'],['drinkBuy','drink']])this.root.querySelector('.'+cls).onclick=()=>this.buy(item);
        this.createStations();this.createCash();this.draw();
    }
    createStations(){
        for(const site of (this.map.localLandmarks||[]).filter(s=>s.kind==='fuel')){
            let spot=null;
            for(const radius of [3,6,10,15,22,30]){for(let i=0;i<24;i++){
                const a=i*Math.PI/12,x=site.entrance.x+Math.cos(a)*radius,z=site.entrance.z+Math.sin(a)*radius,road=this.map.nearestRoad(x,z);
                if(road.distance>3.5&&!this.map.isBlocked(x,z,.7,true)){spot={x,z};break;}
            }if(spot)break;}
            if(!spot)continue;
            const y=this.session.terrain.getHeightAt(spot.x,spot.z),g=new ScenicGeometry(this.map.scene,site.name),red=g.material('paint','#bf3431'),white=g.material('enamel','#e9e7d9'),dark=g.material('rubber','#26363a');
            g.box('Pump base',spot.x,y+.08,spot.z,1.2,.16,1,white);g.box('Fuel pump',spot.x,y+.8,spot.z,.7,1.5,.5,red);g.box('Pump display',spot.x,y+1.1,spot.z+.26,.5,.32,.04,dark);
            g.tube('Pump hose',[[spot.x+.4,y+1.2,spot.z],[spot.x+.65,y+.3,spot.z],[spot.x+.8,y+.7,spot.z]],.045,dark);g.box('Pump canopy',spot.x,y+2.1,spot.z,1.8,.16,1.5,red);g.finish();
            const sign=landmarkSign(this.map.scene,'GAS  ·  $2 / L', '#26363a',1.6,.36);sign.position.set(spot.x,y+1.8,spot.z+.3);
            this.stations.push({...spot,name:site.name});
        }
    }
    createCash(){
        const g=new ScenicGeometry(this.map.scene,'Cash finds'),mat=g.material('cash green','#40ba65');mat.emissiveColor=new BABYLON.Color3(.08,.28,.1);
        const points=[...this.map.data.stops,...this.stations];
        for(const [i,p] of points.entries()){
            const spot=this.session.life.safeSpot(p.x,p.z,.25,false);if(!spot)continue;
            const mesh=BABYLON.MeshBuilder.CreateBox('Collectible cash',{width:.5,height:.12,depth:.3},this.map.scene);mesh.material=mat;mesh.position.set(spot.x,this.session.terrain.getHeightAt(spot.x,spot.z)+.3,spot.z);this.cash.push({mesh,amount:5+i%5*5,collected:false});
        }
    }
    nearest(){
        const s=this.session,p=s.player.isDriving?s.cart.position:s.player.position;
        return this.stations.filter(x=>Math.hypot(x.x-p.x,x.z-p.z)<6).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
    }
    buy(item){
        const s=this.session,station=this.nearest(),v=s.cart;
        if(!station||s.life.dead||s.wheelRide.active||s.helicopterRide.active||s.emergency.active||Math.abs(v.speed)>1.5){this.message('Stop beside a station pump to shop.');return false;}
        const price={fuel:10,food:8,drink:3}[item];if(!price)return false;
        if(item==='fuel'&&(v.trafficVehicle?.kind==='bicycle'||Math.hypot(v.position.x-station.x,v.position.z-station.z)>=6||v.fuelCapacity-v.fuel<.01)){this.message('Bring a vehicle that needs gas beside the pump.');return false;}
        if(item==='food'&&this.hunger>=100&&s.life.health>=100||item==='drink'&&this.thirst>=100&&s.life.health>=100){this.message('You are already refreshed.');return false;}
        const liters=item==='fuel'?Math.min(5,v.fuelCapacity-v.fuel):0,cost=item==='fuel'?Math.ceil(liters*2):price;
        if(!this.wallet.spend(cost)){this.message('Not enough cash. Earn a fare or find a glowing cash bundle.');return false;}
        if(item==='fuel')v.fuel=Math.min(v.fuelCapacity,v.fuel+liters);
        if(item==='food'){this.hunger=Math.min(100,this.hunger+40);s.life.health=Math.min(100,s.life.health+15);}
        if(item==='drink'){this.thirst=Math.min(100,this.thirst+45);s.life.health=Math.min(100,s.life.health+5);}
        this.message(item==='fuel'?`Added ${liters.toFixed(1)} L · $${cost}`:item==='food'?'Sandwich eaten · restored food and health.':'Water enjoyed · restored thirst and health.');this.draw();return true;
    }
    message(text){this.root.querySelector('.supplyMessage').textContent=text;}
    draw(){
        const s=this.session,v=s.cart,station=this.nearest();
        this.root.querySelector('.supplyMeters').textContent=`${v.name} · ${Number.isFinite(v.fuel)?v.fuel.toFixed(1)+' / '+v.fuelCapacity+' L':'pedal power'} · Food ${Math.round(this.hunger)}% · Water ${Math.round(this.thirst)}%`;
        this.root.querySelector('.stationHint').textContent=station?station.name:'Visit a Fuel & Market landmark and pull beside its pump.';
        for(const b of this.root.querySelectorAll('button'))b.disabled=!station||s.life.dead||s.emergency.active||Math.abs(v.speed)>1.5;
    }
    update(dt){
        this.radio.update(dt);const s=this.session,t=Math.min(Math.max(dt,0),.1);this.elapsed+=t;
        if(!s.life.dead){this.hunger=Math.max(0,this.hunger-t/12);this.thirst=Math.max(0,this.thirst-t/8);}
        if(!s.life.dead&&!s.player.isDriving&&!s.helicopterRide.active&&!s.wheelRide.active)for(const cash of this.cash){
            if(!cash.collected&&BABYLON.Vector3.Distance(s.player.position,cash.mesh.position)<1.7){cash.collected=true;cash.mesh.setEnabled(false);this.wallet.deposit(cash.amount);s.audio.play('money');this.message(`Found $${cash.amount}!`);}
        }
        if(this.elapsed>.25){this.elapsed=0;this.draw();}
    }
}
