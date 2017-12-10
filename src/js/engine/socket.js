/* global localStorage */

"use strict";

// load dependancies

let G = require('globals');

// init logic

export function Save(key, value) {
    localStorage[key] = value;
    G.savedData = localStorage;
}

export function Load() {
    G.savedData = localStorage;
}

export default function Init() {
    if (!localStorage.map) localStorage.map = 'helmfirth';

    Load();
}

// TODO: Implement client <-> server connections
