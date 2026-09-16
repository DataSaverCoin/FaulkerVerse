/* Shared startup options, kept independent of rendering so the chooser is immediate. */
const colors=['#187cba','#cf3737','#f0bc32','#29834a','#844bc2','#e16a23','#e45c9d','#2dafae','#e8e7df','#34383e','#7c3431','#718b39','#3853a4','#bda775','#795746'];
const names=['Harbor Blue','Cherry Sport','Sunshine','Park Green','Violet Sprint','Orange Cargo','Rose Cruiser','Teal Tourer','Pearl Shuttle','Midnight GT','Brick Runner','Olive Ranger','Indigo Express','Champagne','Copper Classic'];
export const CART_CHOICES=names.map((name,i)=>({id:i,name,color:colors[i],speed:7+i%5*1.5,acceleration:4.5+i%4,braking:10+i%6,capacity:[2,4,6][i%3],tank:18+i%5*4,feature:['Compact two-seat','Four-seat cruiser','Six-seat shuttle'][i%3]+(i%2?' · luggage rack':' · sun canopy')}));
export const AVATAR_CHOICES=Array.from({length:20},(_,i)=>({id:i,name:['Corey','Alex','Jordan','Taylor','Morgan','Casey','Riley','Sam','Jamie','Avery','Cameron','Drew','Parker','Reese','Quinn','Skyler','Emery','Robin','Kai','Blake'][i],shirt:colors[i%15],skin:['#edbea1','#c18c70','#a36b4e','#70472f','#523528'][i%5],gender:i%2?'woman':'man',hair:['#453b30','#17191c','#b78c47','#713a26'][i%4],pants:colors[(i+7)%15],personal:i===0}));
export const playerChoice={avatar:0,cart:0,population:'busy'};
export function selectPlayerChoice(avatar,cart,population){playerChoice.avatar=Math.max(0,Math.min(19,Math.trunc(Number(avatar)||0)));playerChoice.cart=Math.max(0,Math.min(14,Math.trunc(Number(cart)||0)));playerChoice.population=population==='calm'?'calm':'busy';}
export function applyCartChoice(cart)
{
    const c=CART_CHOICES[playerChoice.cart];cart.name=c.name;cart.maxForwardSpeed=c.speed;cart.acceleration=c.acceleration;cart.braking=c.braking;cart.seatCapacity=c.capacity;cart.fuelCapacity=c.tank;cart.fuel=c.tank;
    cart.bodyMaterial.diffuseColor=BABYLON.Color3.FromHexString(c.color);
    for(const [i,seat] of cart.seats.entries()){seat.mesh.setEnabled(i<c.capacity);cart.visualRoot.getChildMeshes().filter(m=>m.name===`Seat back ${i}`).forEach(m=>m.setEnabled(i<c.capacity));}
    if(c.id%2){const m=cart.createMaterial('Luggage rack',[.12,.14,.16]);cart.createBox('Luggage carrier',[1.6,.2,1.2],[0,2.87,-1.1],m);}
}
