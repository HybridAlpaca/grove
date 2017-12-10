"use strict";

// Load dependancies

const THREE = require('three'),
    CANNON = require('cannon'),
    postal = require('postal');

let debugRenderer = require('./extensions/debug-renderer');

// Create global container object

let G = module.exports = {};

window.Grove = {
    version: '0.1.1',
    release: 'pre-alpha',
    revision: 7,
    globals() { return G },
};

console.log(`%cThe Grove\nv${window.Grove.version} ${window.Grove.release} r${window.Grove.revision}\nHave fun in the console 😉`, 'color: green; font-weight: bold; font-size: 14px;');

// Properties

G.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
G.scene = new THREE.Scene();
G.renderer = new THREE.WebGLRenderer({
    antialias: true
});

G.world = new CANNON.World();

G.items = require('../json/items');
G.adventures = require('../json/quests').adventures;
G.quests = require('../json/quests').quests;
G.npcs = require('../json/npcs');
G.maps = require('../json/maps'); // Google Maps @_@

G.map = null;
G.player = null;
G.entities = [];
G.particles = [];
G.tweens = [];
G.mods = [];
G.events = postal.channel('events');

G.controls = null;
G.time = Date.now();
G.clock = new THREE.Clock();
G.debugRenderer = new THREE.CannonDebugRenderer(G.scene, G.world);

// Methods

G.generateUUID = () => {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid.toUpperCase();
};

G.entityByID = (id) => {
    let ent;
    for (let entity of G.entities)
        if (entity.id == id) ent = entity;
    return ent || null;
};
G.entityByBodyID = (id) => {
    let ent;
    for (let entity of G.entities)
        if (entity.body.id == id) ent = entity;
    return ent || null;
};
