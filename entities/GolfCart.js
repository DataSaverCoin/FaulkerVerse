import { ACTOR_SCALE } from '../engine/ActorScale.js';
/*
========================================================

FaulkerVerse Engine

File:
    GolfCart.js

Purpose:
    Responsive, lightweight golf cart gameplay entity.

========================================================
*/

"use strict";

import { CartBumper } from "./CartBumper.js";

export class GolfCart
{
    constructor(scene, input, terrain, position, trafficVehicle=null)
    {
        this.trafficVehicle=trafficVehicle;
        this.name = "E-Z-GO Express 6 style";
        this.modelScale=ACTOR_SCALE;this.seatCapacity=6;this.length=6.1*this.modelScale;this.seats=[];
        this.scene = scene;
        this.input = input;
        this.terrain = terrain;
        this.mesh = null;
        this.driver = null;
        this.speed = 0;
        this.throttle = 0;
        this.steering = 0;
        this.maxForwardSpeed = 8;
        this.maxReverseSpeed = 3;
        this.acceleration = 5.5;
        this.braking = 12;
        this.drag = 3.2;
        this.steeringSpeed = 1.45;
        this.throttleResponse = 3.5;
        this.steeringResponse = 7;
        this.steeringReturnResponse = 14;
        this.wheels = [];
        this.bumper = new CartBumper();

        this.fuelCapacity=30;this.fuel=30;
        this.createModel(position);
    }

    createModel(position)
    {
        this.mesh = new BABYLON.TransformNode("GolfCart", this.scene);
        this.mesh.position.copyFrom(position);
        this.visualRoot = new BABYLON.TransformNode("GolfCartVisuals", this.scene);
        this.visualRoot.parent = this.mesh;
        this.visualRoot.scaling.setAll(this.modelScale);

        const bodyMaterial = this.bodyMaterial = this.createMaterial("CartBody", [0.05, 0.44, 0.72]);
        const darkMaterial = this.createMaterial("CartDark", [0.035, 0.045, 0.05]);
        const seatMaterial = this.createMaterial("CartSeat", [0.82, 0.77, 0.62]);

        this.createBox("Extended chassis",[1.9,.4,5.2],[0,.65,0],bodyMaterial);
        this.createBox("Long floor",[1.8,.13,4.8],[0,.97,0],darkMaterial);
        this.createBox("Sculpted hood",[1.85,.4,.85],[0,1.13,2.08],bodyMaterial);
        this.createBox("Long canopy",[2.1,.13,4.7],[0,2.72,-.15],bodyMaterial);
        this.createBox("Rear foot platform",[1.9,.15,.75],[0,.65,-2.65],darkMaterial);
        for(const [row,z] of [1.05,-.3,-1.65].entries())for(const x of [-.43,.43])
        {
            const seat=this.createBox(`EZGO seat ${this.seats.length+1}`,[.81,.23,.67],[x,1.24,z],seatMaterial);
            this.createBox(`Seat back ${this.seats.length-1}`,[.81,.63,.16],[x,1.62,z+(row===2?.35:-.35)],seatMaterial);
            this.seats.push({mesh:seat,x,z,rearFacing:row===2});
        }
        for(const x of [-.88,.88])for(const z of [-1.7,1.65])
        {
            const wheel=BABYLON.MeshBuilder.CreateCylinder('EZGO wheel',{height:.32,diameter:.76,tessellation:16},this.scene);
            wheel.parent=this.visualRoot;wheel.position.set(x,.5,z);wheel.rotation.z=Math.PI/2;wheel.material=darkMaterial;wheel.metadata={front:z>0};this.wheels.push(wheel);
            this.createBox('Wheel arch',[.34,.2,1.02],[x,.91,z],bodyMaterial);
        }
        for(const x of [-.86,.86])for(const z of [-1.8,1.65])this.createBox('Canopy support',[.07,1.6,.07],[x,1.88,z],darkMaterial);
        const glass=this.createMaterial('EZGO windscreen',[.55,.73,.78]);glass.alpha=.25;
        this.createBox('Windscreen',[1.65,.82,.035],[0,2.17,1.73],glass);
        const lamp=this.createMaterial('EZGO LED lights',[1,.94,.75]);lamp.emissiveColor=new BABYLON.Color3(.45,.4,.25);
        for(const x of [-.62,.62])this.createBox('Front LED',[.42,.12,.045],[x,1.18,2.52],lamp);
        const tail=this.createMaterial('EZGO tail lamps',[.7,.02,.01]);tail.emissiveColor=new BABYLON.Color3(.8,.01,.005);
        for(const x of [-.7,.7])this.createBox('Rear tail light',[.26,.17,.06],[x,.82,-2.63],tail);
        const steering=BABYLON.MeshBuilder.CreateTorus('Steering wheel',{diameter:.35,thickness:.045,tessellation:16},this.scene);steering.parent=this.visualRoot;steering.position.set(-.43,1.78,1.66);steering.rotation.x=.65;steering.material=darkMaterial;
        const badge=this.createBox('E-Z-GO badge',[.55,.16,.03],[0,1.2,2.53],seatMaterial);
        const texture=new BABYLON.DynamicTexture('E-Z-GO lettering',{width:256,height:64},this.scene,false),ctx=texture.getContext();ctx.fillStyle='#172b36';ctx.fillRect(0,0,256,64);ctx.fillStyle='white';ctx.font='bold 42px sans-serif';ctx.textAlign='center';ctx.fillText('E-Z-GO',128,48);texture.update();
        const badgeMat=this.createMaterial('EZGO badge material',[1,1,1]);badgeMat.diffuseTexture=texture;badge.material=badgeMat;

        this.snapToTerrain();
    }

    createBox(name, size, position, material)
    {
        const box = BABYLON.MeshBuilder.CreateBox(
            name,
            { width: size[0], height: size[1], depth: size[2] },
            this.scene
        );
        box.parent = this.visualRoot;
        box.position.set(position[0], position[1], position[2]);
        box.material = material;
        return box;
    }

    createMaterial(name, color)
    {
        const material = new BABYLON.StandardMaterial(name, this.scene);
        material.diffuseColor = new BABYLON.Color3(...color);
        material.specularColor = new BABYLON.Color3(0.18, 0.18, 0.18);
        return material;
    }

    update(deltaSeconds)
    {
        // Bound a resumed frame and integrate steering, speed and contacts on the same clock.
        const elapsed=Math.max(0,Math.min(Number.isFinite(deltaSeconds)?deltaSeconds:0,.1));
        const steps=Math.max(1,Math.ceil(elapsed*60));
        for(let i=0;i<steps;i++)this.updateStep(elapsed/steps);
    }

    updateStep(deltaSeconds)
    {
        if(this.wrecked){this.speed=0;this.throttle=0;this.snapToTerrain(deltaSeconds);return;}
        if (!this.driver)
        {
            this.applyDrag(deltaSeconds);
            this.snapToTerrain(deltaSeconds);
            return;
        }

        const throttleInput = this.fuel>0?this.input.getVehicleThrottle():0;
        if(this.fuel<=0)this.throttle=0;
        if(this.trafficVehicle?.kind!=='bicycle')this.fuel=Math.max(0,this.fuel-Math.abs(this.speed)*deltaSeconds/180);
        const steeringInput = this.input.getVehicleSteering();
        const isBraking = this.input.isDown("Space");

        this.throttle = this.damp(this.throttle, throttleInput, this.throttleResponse, deltaSeconds);
        // Center promptly on release so brief corrections do not keep turning.
        const steeringResponse = steeringInput === 0 ? this.steeringReturnResponse : this.steeringResponse;
        this.steering = this.damp(this.steering, steeringInput, steeringResponse, deltaSeconds);

        if (isBraking)
        {
            this.speed = this.moveToward(this.speed, 0, this.braking * deltaSeconds);
        }
        else if (Math.abs(this.throttle) > 0.01)
        {
            const target = this.throttle > 0 ?
                this.maxForwardSpeed * this.throttle :
                this.maxReverseSpeed * this.throttle;
            const changingDirection = Math.sign(target) !== Math.sign(this.speed) && Math.abs(this.speed) > 0.2;
            const force = changingDirection ? this.braking : this.acceleration;
            this.speed = this.moveToward(this.speed, target, force * deltaSeconds);
        }
        else
        {
            this.applyDrag(deltaSeconds);
        }

        const speedRatio = Math.min(1, Math.abs(this.speed) / this.maxForwardSpeed);
        const steeringGrip = 1 - speedRatio * 0.65;
        const reverseDirection = this.speed < 0 ? -1 : 1;
        const previousAngle=this.mesh.rotation.y;
        this.mesh.rotation.y += this.steering * reverseDirection *
            this.steeringSpeed * steeringGrip * Math.min(1, Math.abs(this.speed) / 4) * deltaSeconds;

        if(this.blockedAt(this.position.x,this.position.z))this.mesh.rotation.y=previousAngle;
        const forward = new BABYLON.Vector3(
            Math.sin(this.mesh.rotation.y),
            0,
            Math.cos(this.mesh.rotation.y)
        );
        if (isBraking) { this.bumper.x *= 0.7; this.bumper.z *= 0.7; }
        this.bumper.move(this, forward, deltaSeconds);
        this.updatePresentation(deltaSeconds, speedRatio);
        this.snapToTerrain(deltaSeconds);
    }

    applyDrag(deltaSeconds)
    {
        this.speed = this.moveToward(this.speed, 0, this.drag * deltaSeconds);
    }

    moveToward(value, target, amount)
    {
        if (value < target)
        {
            return Math.min(value + amount, target);
        }
        return Math.max(value - amount, target);
    }

    damp(value, target, response, deltaSeconds)
    {
        return BABYLON.Scalar.Lerp(value, target, 1 - Math.exp(-response * deltaSeconds));
    }

    updatePresentation(deltaSeconds, speedRatio)
    {
        const wheelTravel = this.speed * deltaSeconds / 0.36;
        const steeringAngle = this.steering * 0.38;

        for (const wheel of this.wheels)
        {
            wheel.rotation.x += wheelTravel;
            wheel.rotation.y = wheel.metadata.front ? steeringAngle : 0;
        }

        const desiredRoll = -this.steering * speedRatio * 0.075;
        this.visualRoot.rotation.z = this.damp(
            this.visualRoot.rotation.z,
            desiredRoll,
            4.5,
            deltaSeconds
        );
        // Smooth pavement has no artificial engine-driven vertical bob.
        this.visualRoot.position.y = 0;
    }

    get collisionProbes(){return [-1.95,0,1.55].map(d=>d*this.modelScale);}
    get collisionRadius(){return 1.1*this.modelScale;}

    blockedAt(x,z)
    {
        const map=this.terrain.downtown;if(!map)return false;
        return this.collisionProbes.some(d=>map.isBlocked(x+Math.sin(this.rotation.y)*d,z+Math.cos(this.rotation.y)*d,this.collisionRadius));
    }

    snapToTerrain(deltaSeconds=null)
    {
        const a=this.rotation.y;
        const heights=this.wheels.map(wheel=>{
            const x=wheel.position.x*this.modelScale,z=wheel.position.z*this.modelScale;
            return this.terrain.getHeightAt(this.position.x+x*Math.cos(a)+z*Math.sin(a),this.position.z-x*Math.sin(a)+z*Math.cos(a));
        });
        const average=heights.reduce((sum,h)=>sum+h,0)/heights.length;
        const target=average-.12*this.modelScale+.018;
        const teleported=!this.supportPosition||Math.hypot(this.position.x-this.supportPosition.x,this.position.z-this.supportPosition.z)>3;
        const blend=deltaSeconds===null||teleported?1:1-Math.exp(-14*Math.max(0,deltaSeconds));
        this.mesh.position.y+=(target-this.mesh.position.y)*blend;
        // Fit a gentle support plane through the four tires instead of snapping to the highest one.
        const front=(heights[1]+heights[3])/2,rear=(heights[0]+heights[2])/2;
        const left=(heights[0]+heights[1])/2,right=(heights[2]+heights[3])/2;
        const pitch=Math.max(-.3,Math.min(.3,-Math.atan2(front-rear,3.35*this.modelScale)));
        const roll=Math.max(-.3,Math.min(.3,Math.atan2(right-left,1.76*this.modelScale)));
        this.mesh.rotation.x+=(pitch-this.mesh.rotation.x)*blend;
        this.mesh.rotation.z+=(roll-this.mesh.rotation.z)*blend;
        this.supportPosition={x:this.position.x,z:this.position.z};
    }

    enter(driver)
    {
        if (this.wrecked)return false;
        if (this.driver)
        {
            return false;
        }
        this.bumper.reset();
        this.driver = driver;
        driver.enterVehicle(this);
        return true;
    }

    exit()
    {
        if(this.emergency?.active&&this.driver)return this.emergency.evacuate();
        if (!this.driver || Math.abs(this.speed) > 1.5)
        {
            return null;
        }
        const right = new BABYLON.Vector3(
            Math.cos(this.mesh.rotation.y),
            0,
            -Math.sin(this.mesh.rotation.y)
        );
        const exitPosition = this.mesh.position.add(right.scale(2));
        if (this.terrain.downtown?.isBlocked(exitPosition.x, exitPosition.z, 0.5*ACTOR_SCALE)) return null;
        exitPosition.y = this.terrain.getHeightAt(exitPosition.x, exitPosition.z) + 1;
        const driver = this.driver;
        this.driver = null;
        this.bumper.reset();
        driver.exitVehicle(exitPosition);
        return driver;
    }

    get driverPosition()
    {
        const angle=this.mesh.rotation.y;
        return this.mesh.position.add(new BABYLON.Vector3(-.38*Math.cos(angle)+1.05*Math.sin(angle),1.15,.38*Math.sin(angle)+1.05*Math.cos(angle)).scale(this.modelScale));
    }

    get position()
    {
        return this.mesh.position;
    }

    get rotation()
    {
        return this.mesh.rotation;
    }

    get speedMph()
    {
        return Math.round(Math.abs(this.speed) * 2.237);
    }
}
