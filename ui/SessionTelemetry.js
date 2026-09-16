/* Online browser diagnostics only; no account, location or gameplay-content collection. */
export function startSessionTelemetry()
{
    if(!/^https?:$/.test(location.protocol)||!location.pathname.startsWith('/previews/faulkerverse-downtown/'))return {ready(){}};
    let ready=false,stopped=false,busy=false;
    const endpoint=new URL('api/session',new URL('.',location.href));
    const state=()=>document.hidden?'hidden':ready?'playing':'loading';
    const send=async()=>{
        if(stopped||busy)return;busy=true;
        const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
        try{await fetch(endpoint,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({state:state()}),signal:controller.signal});}catch{}finally{clearTimeout(timeout);busy=false;}
    };
    const beacon=value=>{try{navigator.sendBeacon(endpoint,new Blob([JSON.stringify({state:value})],{type:'application/json'}));}catch{}};
    send();setInterval(send,20000);
    document.addEventListener('visibilitychange',()=>document.hidden?beacon('hidden'):send());
    window.addEventListener('pagehide',()=>{if(stopped)return;stopped=true;beacon('ended');});
    window.addEventListener('pageshow',()=>{stopped=false;send();});
    return {ready(){ready=true;send();const panel=document.createElement('details');panel.innerHTML='<summary>Online privacy</summary><p>This hosted game records your IP address, session activity and server traffic for private diagnostics, retained for up to 30 days. Offline play is not tracked.</p>';document.querySelector('#worldControls')?.appendChild(panel);}};
}
