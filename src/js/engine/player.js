"use strict";

// Load dependancies

let G = require('globals'),
    THREE = require('three'),
    CANNON = require('cannon');

import { Player, NPC, Item } from '../entity';

// Initialize logic

let pointerlock = require('../extensions/pointerlock');
require('../extensions/pointerlock.manager.js');

var mass = 5,
    radius = 2;
let shape = new CANNON.Sphere(radius);
let body = new CANNON.Body({ mass, material: G.mat });
body.addShape(shape);
body.position.set(G.map.spawn[0], G.map.spawn[1], G.map.spawn[2]);
body.linearDamping = 0.9;
body.angularDamping = 0.95;

let controls = new pointerlock(G.camera, body);
G.controls = controls;

let player = G.player = new Player('player', controls.getObject(), body);

// new THREE.JSONLoader().load('/assets/models/rig-test/rig-test.json', (geometry, materials) => {
//     console.log(geometry.animations);
//     materials.forEach(function(material) {
//         material.skinning = true;
//     });
//     // materials = new THREE.MeshBasicMaterial({ color: 0xff0000 });
//     // materials.skinning = true;
//     let mesh = new THREE.SkinnedMesh(
//         geometry,
//         materials
//     );

//     let mixer = new THREE.AnimationMixer(mesh);

//     let walk = mixer.clipAction(geometry.animations[1]);
//     walk.setEffectiveWeight(1);
//     mixer.timeScale = 1 / 500000;
//     walk.enabled = true;

//     G.events.subscribe('system.tick', ({ delta }) => {
//         mixer.update(delta);
//     });

//     G.scene.add(mesh);

//     walk.play();
// });

let shape2 = new CANNON.Sphere(2.5);
let body2 = new CANNON.Body({ mass });
body2.addShape(shape2);
body2.linearDamping = 0.9;

let Bert = new NPC('bert', undefined, body2);
Bert.body.position.set(10, 3, 10);

let detah = new Item('torch');
Bert.inv.add(detah).equip(detah.uuid);
Bert.inv.add(new Item('sword'));
