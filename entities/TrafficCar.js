import { GolfCart } from './GolfCart.js';

/* Traffic automobiles borrow the tested cart driving controller. */
export class TrafficCar extends GolfCart
{
    createModel()
    {
        const v=this.trafficVehicle;
        this.name={car:'Sedan',pickup:'Pickup',truck:'Delivery truck',motorcycle:'Motorcycle',bicycle:'Bicycle'}[v.kind];
        this.length=v.length;this.seatCapacity=v.kind==='car'?4:['bicycle','motorcycle'].includes(v.kind)?1:2;
        this.mesh=new BABYLON.TransformNode(`Player ${this.name}`,this.scene);
        this.mesh.position.copyFrom(v.mesh.position);this.mesh.rotation.copyFrom(v.mesh.rotation);
        this.visualRoot=new BABYLON.TransformNode('Automobile visuals',this.scene);this.visualRoot.parent=this.mesh;
        v.mesh.parent=this.visualRoot;v.mesh.position.setAll(0);v.mesh.rotation.setAll(0);
        this.trafficMesh=v.mesh;
        // Traffic keeps a world-space proxy for its grid, while the visible body is parented.
        v.mesh=this.mesh;
        const specs={car:[22,9,14,42],pickup:[18,7,13,55],truck:[13,4,10,70],motorcycle:[27,12,16,16],bicycle:[6,3,9,0]}[v.kind];
        [this.maxForwardSpeed,this.acceleration,this.braking,this.fuelCapacity]=specs;this.maxForwardSpeed+=v.kind==='bicycle'?0:v.id%3;this.fuel=v.kind==='bicycle'?Infinity:this.fuelCapacity;this.steeringSpeed=1.2;
        this.snapToTerrain();
    }
    get collisionRadius(){return (['bicycle','motorcycle'].includes(this.trafficVehicle.kind)?.35:.85)*this.modelScale;}
    get collisionProbes()
    {
        const end=Math.max(0,this.length/2-this.collisionRadius);
        return [-end,0,end];
    }
    snapToTerrain()
    {
        const a=this.rotation.y,end=this.length*.32,half=.78*this.modelScale;
        const heights=[];
        for(const x of [-half,half])for(const z of [-end,end])heights.push(this.terrain.getHeightAt(this.position.x+x*Math.cos(a)+z*Math.sin(a),this.position.z-x*Math.sin(a)+z*Math.cos(a)));
        this.position.y=Math.max(...heights)+.025;
    }
    updatePresentation(){}
    get driverPosition()
    {
        if(['bicycle','motorcycle'].includes(this.trafficVehicle.kind))return this.position.add(new BABYLON.Vector3(0,.85*this.modelScale,-.16*this.modelScale));
        const a=this.rotation.y,z=this.trafficVehicle.kind==='truck'?1.5:.4;
        return this.position.add(new BABYLON.Vector3(-.38*Math.cos(a)+z*Math.sin(a),-.05,.38*Math.sin(a)+z*Math.cos(a)).scale(this.modelScale));
    }
}
