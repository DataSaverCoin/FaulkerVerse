import {prepareLandingLandmarks} from './LandingLandmarks.js';
import {prepareFuelStations} from './FuelStations.js';
import { prepareSoulardVenues } from './SoulardVenues.js';
import { RenderProfile, yieldForBrowser } from "../engine/RenderProfile.js";
import { createCorridorParking } from './CorridorParking.js';
import { prepareCorridors, createCorridorDetails } from './CorridorArchitecture.js';
import { Riverfront } from './Riverfront.js';
import { createArchGrounds } from './ArchGrounds.js';
import { createCityPark } from './CityPark.js';
import { rideStops } from './RideDispatch.js';
import { UnionWheel } from './UnionWheel.js';
/* Locally bundled street geometry; no map service is needed during play. */
"use strict";

import { prepareRiverCrossings, createRiverBridges } from "./RiverBridges.js";
import { createStLouisBuildings } from "./StLouisBuildings.js";
import { createBuschStadium } from "./BuschStadium.js";
import { RoadNames } from "../ui/RoadNames.js";
import { RoadSurface } from "./RoadSurface.js";
import { RegionalGeology } from "./RegionalGeology.js";
import { MapSpatialIndex } from "./MapSpatialIndex.js";
import { createRegionalRoads } from "./RegionalRoads.js";

export class DowntownMap
{
    constructor(scene, terrain)
    {
        this.scene = scene;
        this.terrain = terrain;
        this.buildings = [];
        this.roads = [];
        this.buildingIndex = new MapSpatialIndex();
        this.bridges = new MapSpatialIndex();
        this.roadIndex = new MapSpatialIndex();
        this.surface = new RoadSurface();
    }

    async initialize()
    {
        const response = await fetch(new URL('../assets/maps/st-louis.json', import.meta.url));
        if (!response.ok) throw new Error('Downtown map could not be loaded');
        this.data = await response.json();
        const directionsResponse=await fetch(new URL('../assets/maps/road-directions.json',import.meta.url));
        if(!directionsResponse.ok)throw new Error('Road direction data could not be loaded');
        this.roadDirections=await directionsResponse.json();
        const parkingResponse=await fetch(new URL('../assets/maps/corridor-parking.json',import.meta.url));
        if(!parkingResponse.ok)throw new Error('Parking map could not be loaded');
        this.parkingData=await parkingResponse.json();
        const cityResponse=await fetch(new URL('../assets/maps/citypark.json',import.meta.url));
        if(!cityResponse.ok)throw new Error('CITYPARK map could not be loaded');
        this.cityParkData=await cityResponse.json();
        const clearanceResponse = await fetch(new URL('../assets/maps/road-clearance.json', import.meta.url));
        if (!clearanceResponse.ok) throw new Error('Road clearance data could not be loaded');
        const clearance = await clearanceResponse.json();
        this.data.buildings.forEach((b,index)=>b.sourceBuildingIndex=index);
        for (const kind of ['buildings','buildingParts'])
            this.data[kind] = this.data[kind].flatMap((building,index) =>
                clearance[kind][index] === undefined ? [building] :
                clearance[kind][index].map(points => ({...building,points})));
        this.data.stadium.points = clearance.stadium;
        this.placementAudit = clearance.audit;
        this.data.radiusMeters=3*1609.344;
        const radius=this.data.radiusMeters*this.data.scale;
        const inside=points=>points.every(p=>Math.hypot(p[0],p[1])<radius-5);
        this.data.roads=this.data.roads.filter(r=>inside(r.points));
        for(const kind of ['buildings','buildingParts'])this.data[kind]=this.data[kind].filter(b=>inside(b.points));
        this.data.stops=this.data.stops.filter(p=>Math.hypot(p.x,p.z)<radius-20);
        this.geology = new RegionalGeology(this.data);
        this.terrain.geology = this.geology;
        this.terrain.rebuildRegionalGround();
        this.materials = {};
        for (const [name, color] of Object.entries({
            road: [0.16, 0.19, 0.22], sidewalk: [0.55, 0.55, 0.50],
            brick: [0.50, 0.29, 0.22], stone: [0.62, 0.59, 0.48],
            glass: [0.26, 0.40, 0.47], water: [0.16, 0.39, 0.48],
            steel: [0.78, 0.83, 0.85], park: [0.25, 0.43, 0.25]
        }))
        {
            const material = new BABYLON.StandardMaterial(`Downtown-${name}`, this.scene);
            material.diffuseColor = new BABYLON.Color3(...color);
            material.specularColor = new BABYLON.Color3(0.03,0.03,0.03);
            if (name === "road") material.zOffset = -2;
            if (name === "sidewalk") material.zOffset = -1;
            this.materials[name] = material;
        }
        const ground = this.terrain.ground;
        ground.material = this.terrain.materials.get("Terrain");
        ground.useVertexColors = true;
        prepareRiverCrossings(this);
        await yieldForBrowser();
        this.createRoads();
        await yieldForBrowser();
        createRiverBridges(this);
        this.roadNames = new RoadNames(this);
        const venuesResponse=await fetch(new URL('../assets/maps/soulard-venues.json',import.meta.url));
        if(!venuesResponse.ok)throw new Error('Soulard venue map could not be loaded');
        prepareSoulardVenues(this,await venuesResponse.json());
        prepareFuelStations(this);
        prepareLandingLandmarks(this);
        prepareCorridors(this);
        await this.createBuildings();
        await yieldForBrowser();
        if(!RenderProfile.lite)createCorridorDetails(this);
        this.createLandmarks();
        this.geology.createFeatures(this);
        this.terrain.downtown = this;
        this.riverfront=new Riverfront(this);
        await yieldForBrowser();
        if(!RenderProfile.lite)createCorridorParking(this);
        this.wheel=new UnionWheel(this);
        this.stops=rideStops(this);
        this.spawn = this.nearestRoad(this.stops[0].x, this.stops[0].z - 14);
        this.scene.fogDensity = 0.00035;
    }

    createRoads()
    {
        createRegionalRoads(this);
    }

    async createBuildings()
    {
        await createStLouisBuildings(this);
        createBuschStadium(this);
        createCityPark(this);
    }

    createLandmarks()
    {
        createArchGrounds(this);
    }

    nearestRoad(x, z, global = false)
    {
        let best = { distance: Infinity, x, z };
        const local = global ? this.roads : this.roadIndex.at(x,z);
        for (const { a, b, name } of local.length ? local : this.roads)
        {
            const dx = b[0] - a[0], dz = b[1] - a[1];
            const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
            const px = a[0] + t * dx, pz = a[1] + t * dz;
            const distance = Math.hypot(x - px, z - pz);
            if (distance < best.distance) best = { x: px, z: pz, distance, street: name };
        }
        if (!global && best.distance > 100) return this.nearestRoad(x,z,true);
        return best;
    }

    isBlocked(x, z, radius = 1.2, ignoreTraffic = false)
    {
        if (!ignoreTraffic && this.traffic?.blocks(x,z,radius)) return true;
        if(this.servicePumps?.some(p=>Math.hypot(p.x-x,p.z-z)<radius+.65))return true;
        if (Math.hypot(x,z) + radius > this.geology.radius) return true;
        if (this.stadiumIsBlocked?.(x,z,radius)) return true;
        if(this.archPonds?.some(p=>((x-p.x)/(p.rx+radius))**2+((z-p.z)/(p.rz+radius))**2<1))return true;
        if(this.riverfront?.blocks(x,z,radius))return true;
        if (this.geology.isWater(x,z,radius) && !this.onBridge(x,z,radius)) return true;
        if (this.geology.outcrops?.some(p => Math.hypot(x-p.x,z-p.z) < p.radius+radius)) return true;
        for (const polygon of this.buildingIndex.at(x,z))
        {
            let inside = false;
            for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++)
            {
                const a = polygon[i], b = polygon[j];
                if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
                const dx = b[0] - a[0], dz = b[1] - a[1], length = dx * dx + dz * dz;
                const t = length ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / length)) : 0;
                if (Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz) < radius) return true;
            }
            if (inside) return true;
        }
        return false;
    }

    onBridge(x,z,radius=0)
    {
        return this.bridges.at(x,z).some(({a,b,width,bounded}) =>
        {
            const dx=b[0]-a[0],dz=b[1]-a[1];
            const projection=((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz);
            if(bounded&&(projection<radius/Math.hypot(dx,dz)||projection>1-radius/Math.hypot(dx,dz)))return false;
            const t=Math.max(0,Math.min(1,projection));
            return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz) <= width/2-radius;
        });
    }

    getDistrictBounds() { return { width: this.geology.radius*2, depth: this.geology.radius*2 }; }
    update() {}
}
