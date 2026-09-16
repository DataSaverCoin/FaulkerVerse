import { StreetRides } from './StreetRides.js';

/* Optional work and nearby conversations work with both keyboard and touch. */
export class StreetLife
{
    constructor(session)
    {
        this.session=session;this.rides=new StreetRides(session);this.person=null;
        this.root=document.createElement('section');this.root.id='streetLife';
        this.root.innerHTML='<div class="streetButtons"><button class="duty">Go on duty</button><button class="talk">Talk · F</button><button class="cancelFare" hidden>Cancel fare</button></div><div class="streetDialog" hidden role="dialog" aria-label="Street conversation"><select class="talkPerson" aria-label="Talk to nearby person"></select><strong class="personName"></strong><p class="conversationText" role="status"></p><button class="greet">Say hello</button><button class="offerRide">Do you need a ride?</button><button class="closeTalk">Goodbye</button></div>';
        document.body.appendChild(this.root);
        this.dialog=this.root.querySelector('.streetDialog');
        this.root.querySelector('.duty').onclick=()=>this.toggleDuty();
        this.root.querySelector('.talk').onclick=()=>this.talk();
        this.root.querySelector('.cancelFare').onclick=()=>{session.life.cancelFare();session.life.message='Fare canceled. No payment received.';};
        this.root.querySelector('.greet').onclick=()=>this.say(this.person?.greeting|| (this.person?.age==='baby'?'The baby smiles from the stroller.':this.person?.age==='toddler'?'The toddler waves, staying close to their guardian.':'Hi! Nice day to explore downtown.'));
        this.root.querySelector('.offerRide').onclick=()=>{if(this.person){const reply=this.rides.offer(this.person);this.say(reply);if(this.rides.group.length){this.person=null;this.root.querySelector('.offerRide').disabled=true;}}};
        this.root.querySelector('.closeTalk').onclick=()=>this.close();
        this.root.querySelector('.talkPerson').onchange=e=>this.talk(this.nearby().find(p=>String(p.id)===e.target.value));
    }
    toggleDuty()
    {
        const r=this.session.rideSystem;if(!r.onDuty&&this.session.cart.seatCapacity<2){this.session.life.message='Choose a vehicle with a passenger seat to earn fares.';return;}r.onDuty=!r.onDuty;
        if(!r.onDuty&&['ASSIGNED','DRIVING_TO_PICKUP'].includes(r.state))this.session.life.cancelFare();
        if(r.onDuty&&r.state==='IDLE')r.assignNextRide();
        this.session.life.message=r.onDuty?'On duty: dispatch will find fares.':'Off duty: explore freely. You can still offer street rides.';
    }
    nearby()
    {
        const s=this.session,p=s.player.isDriving?s.cart.position:s.player.position;
        return (s.terrain.downtown?.pedestrians?.people||[]).filter(other=>!other.riding&&!other.down&&Math.hypot(p.x-other.position.x,p.z-other.position.z)<3.5&&Math.abs(p.y-other.position.y)<2).sort((a,b)=>BABYLON.Vector3.DistanceSquared(a.position,p)-BABYLON.Vector3.DistanceSquared(b.position,p));
    }
    nearest(){return this.nearby()[0];}
    talk(selected=null)
    {
        const s=this.session,nearby=this.nearby(),p=nearby.includes(selected)?selected:nearby[0];
        if(s.life.dead||s.wheelRide.active||s.helicopterRide?.active||s.emergency.active)return;
        if(s.player.isDriving&&Math.abs(s.cart.speed)>1.5){s.life.message='Stop before talking to someone.';return;}
        if(!p){s.life.message='Walk or pull up beside someone to talk.';return;}
        this.close();s.life.clearInput();this.person=p;(p.guardian||p).talking=true;
        const select=this.root.querySelector('.talkPerson');select.replaceChildren();
        for(const resident of nearby){const option=document.createElement('option');option.value=String(resident.id);option.textContent=`${resident.name} · ${resident.age}`;select.appendChild(option);}
        select.value=String(p.id);select.hidden=nearby.length<2;
        this.dialog.hidden=false;this.root.querySelector('.personName').textContent=`${p.name} · ${p.age==='adult'?p.gender:p.age}${p.guardian?' · with family':''}`;
        this.root.querySelector('.offerRide').disabled=false;
        this.say(p.greeting||(p.guardian?'Their guardian joins the conversation. The family travels together.':'Hello! What is on your mind?'));
    }
    say(text){this.root.querySelector('.conversationText').textContent=text;}
    close(){if(this.person)(this.person.guardian||this.person).talking=false;this.person=null;this.dialog.hidden=true;}
    update()
    {
        const s=this.session,r=s.rideSystem;this.rides.update();
        if(s.input.consumePressed('KeyF'))this.talk();
        if(s.input.consumePressed('Escape'))this.close();
        if(this.person&&(s.life.dead||s.emergency.active||Math.hypot(s.player.position.x-this.person.position.x,s.player.position.z-this.person.position.z)>5))this.close();
        const button=this.root.querySelector('.duty');button.textContent=r.onDuty?'Go off duty':'Go on duty';button.setAttribute('aria-pressed',String(r.onDuty));
        this.root.querySelector('.cancelFare').hidden=['IDLE','COMPLETED'].includes(r.state);
    }
}
