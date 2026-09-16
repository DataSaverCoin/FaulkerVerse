/* Minimal player-facing ride HUD. */

"use strict";

import { DowntownHUD } from "./DowntownHUD.js";

export class GameplayHUD
{
    constructor(wallet, rideSystem, session)
    {
        this.wallet = wallet;
        this.rideSystem = rideSystem;
        this.session = session;
        this.root = null;
        this.walletValue = null;
        this.objective = null;
        this.fare = null;
        this.status = null;
        this.distance = null;
        this.prompt = null;
        this.earnings = null;
    }

    initialize()
    {
        if (this.session.terrain.downtown)
        {
            this.downtownHUD = new DowntownHUD(this.session);
            this.downtownHUD.initialize();
        }
        this.root = document.createElement("section");
        this.root.id = "gameplayHUD";
        this.root.setAttribute("aria-label", "Ride information");
        this.root.innerHTML = `
            <div class="hudViews"><button type="button" class="walletToggle" aria-expanded="true">− Wallet</button><button type="button" class="hudMapToggle" aria-pressed="false">Mini map</button></div>
            <div class="walletContents">
            <div class="gameplayBrand">FAULKERVERSE RIDES</div>
            <div class="gameplayWallet">
                <span>WALLET</span>
                <strong id="walletValue">$0</strong>
            </div>
            <div class="gameplayLabel">CURRENT OBJECTIVE</div>
            <div id="rideObjective" class="gameplayObjective"></div>

            <div class="gameplayDetails">
                <span id="rideStatus"></span>
                <span id="rideFare"></span>
                <span id="rideDistance"></span>
            </div>
            <div id="rideEarnings" class="rideEarnings" aria-live="polite"></div>
            <div id="rideComplete" class="rideComplete" aria-live="polite">RIDE COMPLETE</div>
            </div><div class="hudMapSlot"></div>
            <div id="rideDirection"><span class="directionArrow">↑</span> <span class="directionLabel"></span></div>
        `;
        document.body.appendChild(this.root);
        this.root.querySelector('.walletToggle').onclick=()=>this.setMapMode(!this.mapMode);
        this.root.querySelector('.hudMapToggle').onclick=()=>this.setMapMode(!this.mapMode);
        this.session.toggleMap=()=>this.setMapMode(!this.mapMode);


        this.prompt = document.createElement("div");
        this.prompt.id = "interactionPrompt";
        document.body.appendChild(this.prompt);

        this.walletValue = document.getElementById("walletValue");
        this.objective = document.getElementById("rideObjective");
        this.fare = document.getElementById("rideFare");
        this.status = document.getElementById("rideStatus");
        this.distance = document.getElementById("rideDistance");
        this.earnings = document.getElementById("rideEarnings");
        this.completion = document.getElementById("rideComplete");
        this.lastState = null;

        this.wallet.subscribe((balance, amount) =>
        {
            this.walletValue.textContent = `$${balance}`;
            this.earnings.textContent = `${amount>=0?'+':'−'}$${Math.abs(amount)}`;
            this.earnings.classList.remove("show");
            void this.earnings.offsetWidth;
            this.earnings.classList.add("show");
        });
    }

    setMapMode(show)
    {
        if(!this.downtownHUD)return;
        this.mapMode=show;this.root.classList.toggle('mapMode',show);
        const map=this.downtownHUD.root;
        if(show){this.root.querySelector('.hudMapSlot').appendChild(map);map.classList.remove('collapsed');}
        else{document.body.appendChild(map);map.classList.add('collapsed');}
        this.root.querySelector('.walletToggle').textContent=show?'+ Wallet':'− Wallet';
        this.root.querySelector('.walletToggle').setAttribute('aria-expanded',String(!show));
        this.root.querySelector('.hudMapToggle').setAttribute('aria-pressed',String(show));
    }

    update()
    {
        this.downtownHUD?.update();
        const ride = this.rideSystem.getStatus();
        this.walletValue.textContent = `$${this.wallet.balance}`;
        this.objective.textContent = ride.objective;
        this.fare.textContent = ride.state==='IDLE'?'':`FARE  $${ride.fare}`;
        this.status.textContent = ride.state==='IDLE'&&!this.rideSystem.onDuty?'FREE ROAM':ride.state.replaceAll("_", " ");
        this.distance.textContent =
            ride.state === "IDLE" ? "" : ride.state === "COMPLETED"
                ? "NICE DRIVING!"
                : `${Math.round(ride.distance/(this.session.terrain.downtown?.data.scale||1))}m AWAY`;
        this.prompt.textContent = this.session.interactionPrompt;
        const drop=['PASSENGER_ONBOARD','DRIVING_TO_DESTINATION'].includes(ride.state);
        const target=drop?this.rideSystem.destination:this.rideSystem.pickup;
        const indicator=this.root.querySelector('#rideDirection');
        indicator.hidden=!target||['IDLE','COMPLETED'].includes(ride.state);
        if(!indicator.hidden){
            const camera=this.session.player.scene.activeCamera;
            const forward=camera.getForwardRay().direction;
            const position=this.session.player.isDriving?this.session.cart.position:this.session.player.position;
            const dx=target.x-position.x,dz=target.z-position.z;
            const angle=Math.atan2(dx*forward.z-dz*forward.x,dx*forward.x+dz*forward.z);
            indicator.querySelector('.directionArrow').style.transform=`rotate(${angle}rad)`;
            indicator.style.color=drop?'#49daf4':'#ffc354';
            indicator.querySelector('.directionLabel').textContent=`${drop?'Drop-off':'Pickup'} · ${Math.round(Math.hypot(dx,dz)/(this.session.terrain.downtown?.data.scale||1))}m · ${drop?this.rideSystem.destinationName:this.rideSystem.pickupName}`;
        }
        if (ride.state !== this.lastState)
        {
            this.completion.classList.toggle("show", ride.state === "COMPLETED");
            this.lastState = ride.state;
        }
    }
}
