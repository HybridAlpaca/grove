"use strict";

// Load dependancies

let Gl = require('globals');

// Initialize game

import initSave from './engine/socket';
initSave();
import initWorld from './engine/world';
initWorld();
import initScene from './engine/scene';
initScene();
import animate from './engine/update'; // start rendering loop
animate();

require('./engine/interact');


/**
 * 
 * TODO:
 * - Animation handler for entities
 * x Convert everything to JSON format
 * x Get Blender
 * 
*/