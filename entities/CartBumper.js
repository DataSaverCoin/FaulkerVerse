/* Soft arcade impacts with swept clearance checks; obstacles remain solid. */
export class CartBumper
{
    constructor() { this.x = 0; this.z = 0; }
    reset() { this.x = 0; this.z = 0; }

    move(cart, forward, deltaSeconds)
    {
        const dt = Math.max(0, Math.min(deltaSeconds, 0.05));
        const map = cart.terrain.downtown?{isBlocked:(x,z)=>cart.blockedAt(x,z)}:null;
        const position = cart.position;
        const vx = forward.x * cart.speed + this.x;
        const vz = forward.z * cart.speed + this.z;
        this.x *= Math.exp(-8 * dt);
        this.z *= Math.exp(-8 * dt);
        if (!map)
        {
            position.x += vx * dt;
            position.z += vz * dt;
            return;
        }
        const steps = Math.max(1, Math.ceil(Math.hypot(vx, vz) * dt / 0.3));
        for (let i = 0; i < steps; i++)
        {
            const dx = vx * dt / steps, dz = vz * dt / steps;
            if (!map.isBlocked(position.x + dx, position.z + dz, 1.5))
            {
                position.x += dx;
                position.z += dz;
                continue;
            }
            // Approach the surface without stepping through thin walls or corners.
            let lo = 0, hi = 1;
            for (let j = 0; j < 9; j++)
            {
                const t = (lo + hi) / 2;
                if (map.isBlocked(position.x + dx*t, position.z + dz*t, 1.5)) hi = t;
                else lo = t;
            }
            position.x += dx * lo;
            position.z += dz * lo;
            const normal = this.normal(map, position, vx, vz);
            const incoming = Math.min(0, vx*normal.x + vz*normal.z);
            const impulse = Math.min(30, -incoming * 1.45);
            cart.onImpact?.(-incoming);
            this.x = normal.x * impulse;
            this.z = normal.z * impulse;
            cart.speed *= 0.82;

            // Turn glancing hits along the wall; head-on hits choose a side so
            // holding the accelerator does not trap the cart against the surface.
            let tx = vx - incoming*normal.x, tz = vz - incoming*normal.z;
            if (Math.hypot(tx,tz) < Math.max(0.5, Math.hypot(vx,vz)*0.2))
            {
                const side = cart.steering < -0.1 ? -1 : 1;
                tx = -normal.z * side;
                tz = normal.x * side;
            }
            const length = Math.hypot(tx,tz) || 1;
            const direction = cart.speed < 0 ? -1 : 1;
            const target = Math.atan2((tx/length + normal.x*0.35)*direction,
                (tz/length + normal.z*0.35)*direction);
            const angle = Math.atan2(Math.sin(target-cart.rotation.y), Math.cos(target-cart.rotation.y));
            const previousAngle=cart.rotation.y;
            cart.rotation.y += Math.max(-0.45, Math.min(0.45, angle));
            if(cart.blockedAt(position.x,position.z))cart.rotation.y=previousAngle;

            // A short outward nudge makes even low-speed impacts visible.
            const push = Math.min(0.24, 0.04 + Math.abs(incoming)*0.012);
            if (!map.isBlocked(position.x+normal.x*push, position.z+normal.z*push, 1.5))
            {
                position.x += normal.x*push;
                position.z += normal.z*push;
            }
            break;
        }
    }

    normal(map, position, vx, vz)
    {
        let x = 0, z = 0;
        for (let i = 0; i < 16; i++)
        {
            const angle = i * Math.PI / 8, dx = Math.cos(angle), dz = Math.sin(angle);
            if (!map.isBlocked(position.x+dx*0.35, position.z+dz*0.35, 1.5))
            {
                x += dx;
                z += dz;
            }
        }
        let length = Math.hypot(x,z);
        if (length < 0.01 || x*vx + z*vz >= 0)
        {
            x = -vx; z = -vz; length = Math.hypot(x,z) || 1;
        }
        return {x:x/length, z:z/length};
    }
}
