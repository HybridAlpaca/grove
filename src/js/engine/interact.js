"use strict";

// Load dependancies

const THREE = require('three'),
    TWEEN = require('@tweenjs/tween.js'),
    $ = require('jquery');

let G = require('globals');
import { Item } from '../entity';
import { Inventory } from './gui';

// Initialize logic

let i = new Item('torch');
G.player.inv.add(i).equip(i.uuid);
let j = new Item('sword');
G.player.inv.add(j).equip(j.uuid);

function attack(e) {
    let slot = 'rh';
    if (e.which == 3 || e.which == 78) slot = 'lh';
    if (!G.player.inv.getSlot(slot)) return;
    // attack
    if (G.player.holding[slot].rotation.x !== 0) return;
    let raycaster = new THREE.Raycaster();
    raycaster.set(G.camera.getWorldPosition(), G.camera.getWorldDirection());
    let intersected;
    for (const entity of G.entities) {
        if (entity.id == 'player') continue;
        let intersects = raycaster.intersectObjects(entity.mesh.children, true);
        if (intersects.length)
            intersected = entity;
        else if (!intersects.length && !intersected) {
            intersects = raycaster.intersectObject(entity.mesh, true);
            if (intersects.length) intersected = entity;
        }
    }
    if (intersected)
        if (intersected.type == 'living') G.player.attack(G.player.inv.getSlot(slot).stats.dmg, intersected, slot); // pfft. Weakling.
    if (G.player.holding[slot].rotation.x !== 0) return;
    if ((Date.now() - G.player.last.used[slot]) < G.player.inv.getSlot(slot).stats.cooldown) return;
    G.player.publish('swing', { slot });
}

function interact() {
    let raycaster = new THREE.Raycaster();
    raycaster.set(G.camera.getWorldPosition(), G.camera.getWorldDirection());
    let intersected;
    for (const entity of G.entities) {
        if (entity.id == 'player') continue;
        let intersects = raycaster.intersectObjects(entity.mesh.children, true);
        if (intersects.length)
            intersected = entity;
        else if (!intersects.length && !intersected) {
            intersects = raycaster.intersectObject(entity.mesh, true);
            if (intersects.length) intersected = entity;
        }
    }
    if (intersected) intersected.publish('interact', G.player);
}

function tooltip() {
    raycaster.set(G.camera.getWorldPosition(), G.camera.getWorldDirection());
    let intersected = false;

    function makeshithappen(entity) {
        intersected = true;
        let text = '';
        let cross = '[ · ]';
        if (entity.type == 'item') cross = '<img src="/assets/icons/pick-up.png" width=35> ';
        if (entity.type == 'link') cross = '<img src="/assets/icons/door-icon.png" width=35> ';
        if (entity.type == 'living') {
            if (entity.behavior.id == 'bystander') cross = '<img src="/assets/icons/talk.png" width=35> ';
            else if (entity.behavior.id == 'aggressive') cross = '<img src="/assets/icons/attack.png" width=35> ';
        }
        if (entity.type != 'map') text += entity.name;
        $('#crosshair-tooltip').html(text);
        $('#crosshair-icon').html(cross);
    }

    for (const entity of G.entities) {
        if (entity.id == 'player') continue;
        if (!entity.mesh) continue;
        let intersects = raycaster.intersectObjects(entity.mesh.children, true);
        if (intersects.length) makeshithappen(entity);
        else if (!intersects.length && !intersected) {
            let intersectss = raycaster.intersectObject(entity.mesh, true);
            if (intersectss.length) makeshithappen(entity);
        }
    }
    if (!intersected) {
        $('#crosshair-tooltip').html('');
        $('#crosshair-icon').html('[ · ]');
    }

}

$(window).on('click', (event) => {
    if (!G.controls.enabled) return;
    G.events.publish('system.click');
    if (event.which == 2 || event.which == 4) interact(event); // middle click
    else if (event.which == 1 || event.which == 3) attack(event); // left / right click
});

$(window).on('keyup', (event) => {
    if (!G.controls.enabled) return;
    if (event.which == 78 || event.which == 77) attack(event);
    else if (event.which == 69) interact(event);
    else if (event.which == 73) Inventory('Character', '[ loading ]');

});

let raycaster = new THREE.Raycaster();

G.events.subscribe('system.tick', tooltip);
