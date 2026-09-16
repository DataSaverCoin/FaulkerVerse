import { PersonAvatar } from '../entities/PersonAvatar.js';
import { ACTOR_SCALE } from '../engine/ActorScale.js';
/* Small shared rooms: remote actors are visual, never local physics drivers. */
export class MultiplayerSession
{
    constructor(engine)
    {
        this.name='Multiplayer';this.engine=engine;this.peers=new Map();this.elapsed=0;
        const panel=document.createElement('details');panel.innerHTML='<summary>Multiplayer</summary><form><label>Room <input name="room" value="city" maxlength="24" pattern="[A-Za-z0-9_-]+" required></label><button>Join room</button><button type="button" class="leave">Leave</button></form><output>Solo</output>';
        engine.worldControls.root.appendChild(panel);this.status=panel.querySelector('output');
        panel.querySelector('form').onsubmit=e=>{e.preventDefault();this.leave();this.room=panel.querySelector('input').value;this.poll();};
        panel.querySelector('.leave').onclick=()=>this.leave();
        if(location.hostname==='appassets.androidplatform.net'){panel.querySelector('button').disabled=true;this.status.textContent='Choose Play online when starting the app to join friends.';}
        window.addEventListener('pagehide',()=>this.leave());
    }
    leave()
    {
        if(this.token)fetch(new URL('api/multiplayer',document.baseURI),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({room:this.room,token:this.token,leave:true}),keepalive:true}).catch(()=>{});
        this.generation=(this.generation||0)+1;this.room=null;this.token=null;this.status.textContent='Solo';
        for(const peer of this.peers.values()){peer.root.dispose();peer.avatar.materials.forEach(m=>m.dispose());}this.peers.clear();
    }
    async poll()
    {
        if(!this.room||this.pending)return;this.pending=true;const generation=this.generation;
        const e=this.engine,p=e.player.position,c=e.gameplaySession.cart.position;
        try
        {
            const response=await fetch(new URL('api/multiplayer',document.baseURI),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({room:this.room,token:this.token,state:{x:p.x,y:p.y,z:p.z,yaw:e.player.mesh.rotation.y,driving:e.player.isDriving,cart:{x:c.x,y:c.y,z:c.z,yaw:e.gameplaySession.cart.rotation.y}}}),signal:AbortSignal.timeout(5000)});
            if(!response.ok)throw new Error('Room unavailable');const data=await response.json();if(generation!==this.generation)return;
            this.token=data.token;this.status.textContent=`${this.room} · ${data.players.length+1} players online`;
            const ids=new Set(data.players.map(p=>p.id));for(const [id,peer] of this.peers)if(!ids.has(id)){peer.root.dispose();peer.avatar.materials.forEach(m=>m.dispose());this.peers.delete(id);}
            for(const state of data.players)
            {
                let peer=this.peers.get(state.id);
                if(!peer)
                {
                    const scene=e.world.scene,root=new BABYLON.TransformNode('Online player',scene);
                    const avatar=new PersonAvatar(scene,{personal:false,shirt:"#52c9bd"});avatar.root.parent=root;avatar.root.scaling.setAll(ACTOR_SCALE);avatar.root.position.y=-1;
                    const cart=e.golfCart.visualRoot.clone('Online cart',root);cart.setEnabled(false);
                    peer={root,avatar,cart,target:state};this.peers.set(state.id,peer);root.position.set(state.x,state.y,state.z);
                }
                peer.target=state;
            }
        }
        catch(error){if(generation===this.generation){this.status.textContent='Disconnected · retrying';for(const peer of this.peers.values()){peer.root.dispose();peer.avatar.materials.forEach(m=>m.dispose());}this.peers.clear();}}
        finally{this.pending=false;}
    }
    update(dt)
    {
        this.elapsed+=dt;if(this.elapsed>.15){this.elapsed=0;this.poll();}
        for(const peer of this.peers.values())
        {
            const s=peer.target;peer.root.setEnabled(true);peer.root.position=BABYLON.Vector3.Lerp(peer.root.position,new BABYLON.Vector3(s.x,s.y,s.z),Math.min(1,dt*10));peer.root.rotation.y=s.yaw;
            peer.avatar.root.setEnabled(!s.driving);peer.cart.setEnabled(s.driving);
            if(s.driving){peer.root.position.set(s.cart.x,s.cart.y,s.cart.z);peer.root.rotation.y=s.cart.yaw;}
        }
    }
}
