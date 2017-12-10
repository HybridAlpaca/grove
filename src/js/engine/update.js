"use strict";

// load dependancies

const TWEEN = require('@tweenjs/tween.js');

let G = require('globals');

// Initialize logic

const dt = 1 / 60; // static delta time

// define game loop

export default function update(delta) {

    // call the update function as soon as brower has adequate resources
    requestAnimationFrame(update);

    if (!G.controls) return; // stop function if controls haven't loaded yet

    let time = G.clock.getDelta();

    for (let entity of G.entities) entity.update();
    for (let particle of G.particles) {
        if (!G.scene.getObjectByName(particle.group.mesh.name)) {
            G.particles.slice(G.particles.indexOf(particle), 1);
            continue;
        }
        particle.group.tick(time);
    }
    TWEEN.update(delta);
    for (let mod of G.mods) mod.update();

    if (G.controls.enabled) // update physics if controls are enabled (i.e. not paused)
        G.world.step(dt);

    G.controls.update(Date.now() - G.time); // update controls
    G.renderer.render(G.scene, G.camera); // render the scene
    // G.debugRenderer.update();

    G.time = Date.now(); // update current game time

    G.events.publish('system.tick', {
        delta
    });

}
