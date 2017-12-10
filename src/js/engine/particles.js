"use strict";

// Load dependancies

const THREE = require('three'),
    SPE = require('../extensions/spe.min.js');

let G = require('globals');

// init logic

export function Basic() {

    let group = new SPE.Group({
        texture: {
            value: THREE.ImageUtils.loadTexture('/assets/icons/glow.png')
        }
    });

    let emitter = new SPE.Emitter({
        maxAge: {
            value: 2
        },
        position: {
            value: new THREE.Vector3(0, 0, 0),
            spread: new THREE.Vector3(0, 0, 0)
        },

        acceleration: {
            value: new THREE.Vector3(0, -10, 0),
            spread: new THREE.Vector3(10, 0, 10)
        },

        velocity: {
            value: new THREE.Vector3(0, 25, 0),
            spread: new THREE.Vector3(10, 7.5, 10)
        },

        color: {
            value: [new THREE.Color('red'), new THREE.Color('tan')]
        },

        size: {
            value: 1
        },

        particleCount: 2000
    });

    group.addEmitter(emitter);
    // mesh = group.mesh
    let obj = { group, emitter };
    G.particles.push(obj);
    return obj;
}

export function Fire() {

    this.group = new SPE.Group({
        texture: {
            value: THREE.ImageUtils.loadTexture('/assets/icons/glow.png')
        },
        maxParticleCount: 20,
        fog: false
    });

    this.emitter = new SPE.Emitter({
        maxAge: {
            value: 1.5
        },
        position: {
            value: new THREE.Vector3(0, 0.5, 0),
            spread: new THREE.Vector3(0.1, 0.1, 0.1)
        },

        acceleration: {
            value: new THREE.Vector3(0, 0, 0),
            spread: new THREE.Vector3(0.2, 0, 0.2)
        },

        velocity: {
            value: new THREE.Vector3(0, 1, 0),
            spread: new THREE.Vector3(0.2, 0, 0.2)
        },

        color: {
            value: [new THREE.Color('orange'), new THREE.Color('yellow'), new THREE.Color('#111111')]
        },

        opacity: {
            value: [1, 0]
        },

        size: {
            value: [1.5, 1]
        },

        particleCount: 20
    });
    
    this.group.mesh.name = Math.random();

    this.group.addEmitter(this.emitter);
    G.scene.add(this.group.mesh);
    G.particles.push(this);
}

export function Ambient() {
    this.group = new SPE.Group({
        texture: {
            value: THREE.ImageUtils.loadTexture('/assets/icons/glow.png')
        },
        maxParticleCount: 2000,
        fog: true
    });

    this.emitter = new SPE.Emitter({
        maxAge: {
            value: 2
        },
        position: {
            value: new THREE.Vector3(0, 0, 0),
            spread: new THREE.Vector3(150, 20, 150)
        },

        acceleration: {
            value: new THREE.Vector3(0, 0, 0),
            spread: new THREE.Vector3(0.1, 0.1, 0.1)
        },

        velocity: {
            value: new THREE.Vector3(0, 0, 0),
            spread: new THREE.Vector3(0.1, 0.1, 0.1)
        },

        color: {
            value: [new THREE.Color('grey'), new THREE.Color('grey')]
        },

        opacity: {
            value: [0, 1, 1, 0]
        },

        size: {
            value: [0.1, 0.2]
        },

        particleCount: 2000,
    });

    this.group.addEmitter(this.emitter);
    G.scene.add(this.group.mesh);
    G.particles.push(this);
}
