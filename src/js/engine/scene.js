"use strict";

// load dependancies

const THREE = require('three'),
    CANNON = require('cannon'),
    $ = require('jquery');

let G = require('globals');

import { Map } from '../entity';

// initialize scene

export default function initScene() {

    // scene

    let scene = G.scene;
    scene.fog = new THREE.FogExp2(0x778899, 0.01);

    var ambient = new THREE.AmbientLight(0x332233);
    scene.add(ambient);

    // Loading manager

    let loadingText = [
        'In the beginning, there was nothing...',
        '...except a seed.',
        'The seed was planted, and from it, a Tree;',
        'A great, marvelous Tree - full of Power',
        'One that would grow and spread...',
        'And eventually form a giant forest.',
        'It is this forest, that we call:',
        'THE GROVE<br><small>[ play ]</small>'
    ];

    let index = 0,
        loading = true;

    THREE.DefaultLoadingManager.onProgress = (item, loaded, total) => {
        $('#instructions').text(`${Math.floor(loaded/total*100)}% - v.${window.Grove.version}`);
    };
    THREE.DefaultLoadingManager.onLoad = () => {
        $('#instructions')
            .click(() => {
                loading = false;
                $('#instructions').html('THE GROVE<br><small>[ play ]</small>');
            });
        if (loading) $('#instructions').fadeOut(800);
        setTimeout(() => {
            if (!loading) return;
            $('#instructions').html(loadingText[index]);
            $('#instructions').fadeIn(800);
            index++;
            if (index == loadingText.length) loading = false;
            if (loading) setTimeout(THREE.DefaultLoadingManager.onLoad, 5000);
            else $('#instructions').html('THE GROVE<br><small>[ play ]</small>');
        }, 800);
    };
    THREE.DefaultLoadingManager.onError = (item) => console.error(`Error loading ${item}`);

    // initialize map

    let map = G.map = new Map(G.savedData.map); // well, that was easy

    // initialize player

    require('./player');

    // renderer

    let renderer = G.renderer;
    renderer.shadowMap.enabled = true;
    renderer.shadowMapSoft = true;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x778899, 1);

    document.body.appendChild(renderer.domElement);

    // misc

    window.addEventListener('resize', resize, false);


}

// handle window resizes

function resize() {
    G.camera.aspect = window.innerWidth / window.innerHeight;
    G.camera.updateProjectionMatrix();
    G.renderer.setSize(window.innerWidth, window.innerHeight);
}
