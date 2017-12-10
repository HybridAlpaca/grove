"use strict";

// Load dependancies

const THREE = require('three'),
    CANNON = require('cannon');

// Entity Mixins

export function bystander() {
    this.behavior.id = 'bystander';
    
    let closest = this.nearestEntity();
    if (!closest) return;
    let pos = new THREE.Vector3().copy(closest.mesh.position);
    pos.y = this.mesh.position.y;
    this.mesh.lookAt(pos);
}

export function aggressive() {
    
    this.behavior.id = 'aggressive';

    let closest = this.nearestEntity();
    if (!closest) return;
    let pos = new THREE.Vector3().copy(closest.mesh.position);
    pos.y = this.mesh.position.y;
    this.mesh.lookAt(pos);
    this.body.quaternion.copy(this.mesh.quaternion);

    const VELOCITYCAP = 7;

    if (this.mesh.position.distanceTo(closest.mesh.position) > 5) {
        let localForward = new CANNON.Vec3(0, 0, -1);
        let worldForward = new CANNON.Vec3();
        this.body.vectorToWorldFrame(localForward, worldForward);
        this.body.velocity.x -= worldForward.x;
        this.body.velocity.z -= worldForward.z;

        if (this.body.velocity.x > VELOCITYCAP) this.body.velocity.x = VELOCITYCAP;
        else if (this.body.velocity.x < -VELOCITYCAP) this.body.velocity.x = -VELOCITYCAP;
        if (this.body.velocity.z > VELOCITYCAP) this.body.velocity.z = VELOCITYCAP;
        else if (this.body.velocity.z < -VELOCITYCAP) this.body.velocity.z = -VELOCITYCAP;
    }
    else {
        if (this.body.velocity.x > 1) this.body.velocity.x = 1;
        else if (this.body.velocity.x < -1) this.body.velocity.x = -1;
        if (this.body.velocity.z > 1) this.body.velocity.z = 1;
        else if (this.body.velocity.z < -1) this.body.velocity.z = -1;

        let slot = Math.random() < 0.5 ? 'rh' : 'lh';
        this.attack(this.inv.getSlot(slot).stats.dmg, closest, slot);
    }

}

// Miscelaneous Mixins
