"use strict";

// load dependancies

const THREE = require('three'),
    CANNON = require('cannon'),
    TWEEN = require('@tweenjs/tween.js'),
    postal = require('postal'),
    $ = require('jquery');

let G = require('globals');
import { Save } from './engine/socket';
import * as Mixins from './mixins';
import * as Particles from './engine/particles';

// Virtual Classes

export default class Entity {
    constructor(id, mesh = new THREE.Object3D(), body = new CANNON.Body()) {
        this.id = id;
        this.uuid = G.generateUUID();
        if (typeof mesh == 'object') {
            this.mesh = mesh;
            this.mesh.castShadow = true;
            this.mesh.recieveShadow = true;
            G.scene.add(mesh); // add mesh to scene
        }
        else this.loadModel(mesh); // if `mesh` is a string, load it as a model
        this.body = body;
        G.world.add(body); // add body to world

        this.events = postal.channel(this.uuid);
        this.last = []; // i.e. last time attacked, list time entity spoke, etc.
        this.audio = Array;

        G.entities.push(this);
    }

    update() {
        if (!this.mesh) return;
        this.mesh.position.copy(this.body.position);
        if (this.meshData && this.meshData.offset) this.mesh.position.y += this.meshData.offset[1];
        this.publish('update');
    }
    remove() {
        G.scene.remove(this.mesh);
        G.world.remove(this.body);
        G.entities.splice(G.entities.indexOf(this), 1);
    }

    // events, cause my lazy ass didn't feel like ading events. in front of every subscribe call

    subscribe(key, cb) { return this.events.subscribe(key, cb) }

    publish(id, data) { return this.events.publish(id, data) }

    // audio

    loadAudio(id, uri) {}
    playAudio(id) {}

    // graphics

    loadModel(path) {
        this.mesh = new THREE.Object3D();
        G.scene.add(this.mesh);
        new THREE.JSONLoader().load(path, (geo, mat) => {
            let obj = new THREE.Mesh(geo, mat);
            obj.castShadow = true;
            obj.recieveShadow = true;
            this.mesh.add(obj);
        });
    }
}

export class Item {
    constructor(id, json = true) {
        this.id = id;
        this.uuid = G.generateUUID();
        this.slot = String;

        this.type = 'item';

        this.name = String;
        this.desc = String;
        this.value = Number;
        this.weight = Number;
        this.buffs = Array;
        this.stats = Array;

        if (json) this.loadFromJSON(json);
    }

    loadFromJSON(json) {
        if (!G.items[this.id]) throw `Uncaught ItemError: cannot find item with ID of ${this.id}!`;
        let item = G.items[this.id];
        for (let key in item)
            this[key] = item[key];
    }

    // entity

    drop(pos) {
        let geo = new THREE.SphereGeometry(0.2, 32, 32);
        let mat = new THREE.MeshLambertMaterial({ color: 0x0000ff });
        let shape = new CANNON.Sphere(0.2);
        let body = new CANNON.Body({ mass: 5 });
        body.addShape(shape);
        body.linearDamping = 0.9;
        this.entity = new Entity(this.id, this.model, body);
        this.entity.type = 'item';
        this.entity.name = this.name;
        this.entity.mesh.rotation.x = Math.PI / 2;
        this.entity.body.position.set(pos.x, pos.y, pos.z);
        if (this.meshData) {
            if (this.meshData.general) {
                if (this.meshData.general.scale) this.entity.mesh.scale.set(this.meshData.general.scale[0], this.meshData.general.scale[1], this.meshData.general.scale[2]);
            }
        }

        this.entity.subscribe('interact', (entity) => {
            this.entity.remove();
            this.entity = null;
            entity.inv.add(this);
            new Audio('/assets/audio/sfx/npc-pick-1.mp3').play();
        });
    }

    // buff management

    addBuff(id) {}
    removeBuff(id) {}
    clearBuffs() {}
}

export class Inventory {
    constructor(owner, weight, slots) {
        this.owner = owner;
        this.weight = 0;
        this.maxWeight = weight;
        this.equipped = {};
        this.inv = [];
    }

    // slot management

    addSlot(slot) {
        if (typeof slot == 'string' && !this.equipped[slot]) {
            this.equipped[slot] = null;
            this.owner.publish('inv.addSlot', { slot });
        }
        else if (typeof slot == 'object') {
            for (let id of slot) {
                if (this.equipped[id]) continue;
                this.equipped[id] = null;
                this.owner.publish('inv.addSlot', { slot: id });
            }
        }
        this.calculateWeight();
        return this;
    }
    getSlot(id) {
        if (!this.equipped[id]) return;
        return this.equipped[id];
    }
    setSlot(id, item) {
        if (this.equipped[id]) return;
        this.equipped[id] = item;
        this.calculateWeight();
        this.owner.publish('inv.setSlot');
        return this;
    }

    // item management

    add(item) {
        if (!item.id || !item.slot) throw 'Uncought ItemError: essential data not defined!';
        this.inv.push(item);
        let slot = item.slot;
        if (item.slot == 'hand') {
            if (this.equipped['rh']) slot = 'lh';
            else slot = 'rh';
            item.slot = slot;
        }
        if (!this.equipped[slot]) this.equip(item.uuid);
        this.calculateWeight();
        this.owner.publish('inv.add', { item });
        return this;
    }
    drop(uuid) {
        for (let item of this.inv)
            if (item.uuid == uuid) {
                this.inv.splice(this.inv.indexOf(item), 1);
                item.drop(this.owner.body.position);
            }
        this.calculateWeight();
        this.owner.publish('inv.drop');
        return this;
    }
    dropAll() {
        this.unequipAll();
        for (let item of this.inv)
            item.drop(this.owner.body.position);
        this.inv.splice(0, this.inv.length);
        this.owner.publish('inv.dropAll');
        this.calculateWeight();
    }

    equip(uuid) {
        let Item = null;
        for (let item of this.inv)
            if (item.uuid == uuid) {
                Item = item;
                this.inv.splice(this.inv.indexOf(Item), 1);
            }
        if (!Item) return this;
        let slot = Item.slot;
        if (Item.slot == 'hand') {
            if (this.equipped['rh']) slot = 'lh';
            else slot = 'rh';
        }
        this.setSlot(slot, Item);
        this.calculateWeight();
        this.owner.publish('inv.equip', { item: Item, slot });
        return this;
    }
    unequip(slot) {
        if (!this.equipped[slot]) return;
        this.inv.push(this.equipped[slot]);
        this.owner.publish('inv.unequip', { item: this.equipped[slot], slot });
        this.equipped[slot] = null;
        this.calculateWeight();
        return this;
    }
    unequipAll() {
        for (let key in this.equipped)
            this.unequip(key);
        this.owner.publish('inv.unequipAll');
        return this;
    }

    // general

    calculateWeight() {
        let weight = 0.0; // looks kinda like a face 0.0

        for (let key in this.equipped)
            if (this.equipped[key]) weight += this.equipped[key].weight;
        for (let key in this.inv)
            if (this.inv[key]) weight += this.inv[key].weight;

        this.weight = weight;
        if (this.weight > this.maxWeight) console.log('You are carrying to much to run.');

        return this;
    }
}

// Abstract Entities

export class Living extends Entity {
    constructor(id, mesh, body) {
        super(id, mesh, body);

        this.inv = new Inventory(this, 150, []);
        this.type = 'living'; // for update optimization

        this.holding = []; // holding meshes

        this.subscribe('swing', ({ slot }) => {
            if (!this.holding[slot]) return;
            if (this.holding[slot].rotation.x != 0) return;
            let item = this.inv.getSlot(slot);
            if (slot && this.holding[slot]) {
                let tween = new TWEEN.Tween(this.holding[slot].rotation)
                    .to({
                        x: [this.id == 'player' ? -Math.PI / 2 : Math.PI / 2, 0]
                    }, item.stats.spd)
                    .onComplete(() => {
                        G.tweens.splice(G.tweens.indexOf(this), 1);
                        this.last.used[slot] = Date.now();
                    })
                    .start();
                G.tweens.push(tween);
            }
        });

        this.last['spoke'] = Date.now();
        this.last['used'] = [];

        this.subscribe('inv.addSlot', ({ slot }) => {
            this.last['used'][slot] = Date.now();
        });

        this.stats = {
            hp: Number,
            hpMax: Number,
            stm: Number,
            stmMax: Number,
            mp: Number,
            mpMax: Number,

            str: Number,
            per: Number,
            end: Number,
            chr: Number,
            int: Number,
            agi: Number
        };
    }

    update() {
        super.update();
        // if (this.body.position.y < -50) {
        //     this.body.position.set(0, 40, 0);
        //     this.body.velocity.x = 0;
        //     this.body.velocity.y = 0;
        //     this.body.velocity.z = 0;
        // }
    }

    damage(dmg, attacker) {
        this.stats.hp -= dmg;
        this.publish('damage');
        if (this.stats.hp <= 0) {
            this.stats.hp = 0;
            this.kill(attacker);
        }
    }
    revive(hp = 0, stm = 0, mp = 0) {
        this.hp += hp;
        this.stm += stm;
        this.mp += mp;
        if (this.hp > this.hpMax) this.hp = this.hpMax;
        if (this.stm > this.stmMax) this.stm = this.stmMax;
        if (this.mp > this.mpMax) this.mp = this.mpMax;
    }

    attack(dmg, entity, slot) {
        if (!G.controls.enabled) return;
        entity.damage(dmg, this);
        this.publish('attack');
        this.publish('swing', { slot });
    }
    kill(attacker) {
        this.inv.dropAll();
        this.publish('kill', {
            attacker
        });
        G.events.publish('entity.kill', {
            killer: attacker.id,
            killed: this.id
        });
        this.remove();
    }

    speak(id) {}
}

export class AI extends Living {
    constructor(id, mesh, body, behavior = 'bystander') {
        super(id, mesh, body);

        if (typeof behavior == 'string') this.behavior = Mixins[behavior];
        else this.behavior = behavior;
        this.behavior = this.behavior.bind(this);

        this.hostility = Array;
        this.personality = Array;
        this.closest = null;
    }

    update() {
        super.update();
        if (!this.mesh) return;
        if (this.closest && this.mesh.position.distanceTo(this.closest.mesh.position) > 100) { // 2 * perception (50)
            this.publish('closest.lose');
            this.closest = null;
        }
        this.behavior();
        // logic
    }

    nearestEntity() {
        for (let entity of G.entities) {
            if (entity.uuid == this.uuid) continue;
            if (entity.type != 'living') continue;
            if (this.mesh.position.distanceTo(entity.mesh.position) > 50) continue;
            if (this.closest == null) this.closest = entity;
            if (this.closest && this.mesh.position.distanceTo(entity.mesh.position) < this.mesh.position.distanceTo(this.closest.mesh.position)) this.closest = entity;
        }
        return this.closest;
    }
}

export class Map {
    constructor(id) {
        this.id = id;
        this.type = 'map';

        this.loadModel(id);
    }

    loadModel(id) {
        this.loadData();

        function makeShitHappen(child) {
            if (!(child instanceof THREE.Mesh)) return;

            let buffer = child.geometry.clone();
            buffer.applyMatrix(new THREE.Matrix4().makeScale(30, 30, 30));

            let verts = [],
                faces = [];
            for (let i = 0; i < buffer.vertices.length; i++) {
                let v = buffer.vertices[i];
                verts.push(new CANNON.Vec3(v.x, v.y, v.z));
            }
            for (let i = 0; i < buffer.faces.length; i++) {
                let f = buffer.faces[i];
                faces.push([f.a, f.b, f.c]);
            }
            let cvph = new CANNON.ConvexPolyhedron(verts, faces);
            let Cbody = new CANNON.Body({
                mass: 0,
                material: G.mat
            });
            Cbody.addShape(cvph);
            Cbody.position.copy(child.position);
            Cbody.quaternion.copy(child.quaternion);

            let e = new Entity(child.name.toLowerCase(), child, Cbody);
            if (!this.meshData.blender) e.mesh.scale.set(1, 1, 1);
            e.type = 'map';
            e.name = child.name;
            for (let key in this.meshData.children) {
                let data = this.meshData.children[key];
                if (new RegExp(key, 'gi').test(child.name.toLowerCase())) {
                    if (data.type) {
                        e.type = data.type;
                        if (e.type == 'link')
                            e.subscribe('interact', () => {
                                Save('map', data.location);
                                window.location.reload();
                            });
                    }
                    if (data.name) e.name = data.name;
                }
            }
        }

        new THREE.JSONLoader().load(this.path, (arg, arg1) => {
            let mesh = new THREE.Mesh(arg, arg1);
            mesh.scale.set(30, 30, 30);
            makeShitHappen.bind(this)(mesh);
        });
    }

    loadData() {
        if (!G.maps[this.id]) throw `MapError: map with id ${this.id} not found!`;
        for (let key in G.maps[this.id])
            this[key] = G.maps[this.id][key];
    }
}

// Reusable Classes

export class Player extends Living {
    constructor(id, mesh, body) {
        super(id, mesh, body);

        this.stats.hp = this.stats.hpMax = 100;
        this.stats.stm = this.stats.stmMax = 100;
        this.stats.mp = this.stats.mpMax = 100;

        this.inv
            .addSlot(['head', 'chest', 'legs', 'lh', 'rh']);

        this.subscribe('inv.equip', ({ item, slot }) => {
            if (!(slot == 'rh' || slot == 'lh')) return;
            new THREE.JSONLoader().load(item.model, (geo, mat) => {
                let obj = new THREE.Mesh(geo, mat);
                if (item.meshData) {
                    if (item.meshData.general) {
                        if (item.meshData.general.scale) obj.scale.set(item.meshData.general.scale[0], item.meshData.general.scale[1], item.meshData.general.scale[2]);
                    }
                    if (item.meshData.equipped) {
                        if (item.meshData.equipped.particles) obj.add(new Particles[item.meshData.equipped.particles]().group.mesh);
                        if (item.meshData.equipped.light) {
                            let lightData = item.meshData.equipped.light;
                            let light = new THREE.PointLight(new THREE.Color(lightData[0]), lightData[1], lightData[2], lightData[3]);
                            light.translateY(0.5);
                            obj.add(light);
                        }
                        if (item.meshData.equipped.scale) {
                            let scale = item.meshData.equipped.scale;
                            obj.scale.set(scale[0], scale[1], scale[2]);
                        }
                    }
                }
                obj.position.set(slot == 'rh' ? 0.8 : -0.8, -0.5, -1);
                G.camera.add(obj);
                this.holding[slot] = obj;

                let unequip = this.subscribe('inv.unequip', (data) => {
                    if (slot != data.slot) return;
                    G.camera.remove(obj);
                    this.holding[slot] = null;
                    unequip.unsubscribe();
                });

            });
        });

    }

    attack(dmg, entity, slot) {
        if (this.holding[slot].rotation.x !== 0) return;
        if ((Date.now() - this.last.used[slot]) < this.inv.getSlot(slot).stats.cooldown) return;
        super.attack(dmg, entity, slot);
    }

    kill(attacker) {
        super.kill(attacker);
        $('#blocker').show();
        $('#instructions').html(`THOU HATH PERISHED<br><small>[ courtesy of ${attacker.name} ]<\/small>`);
    }
}

export class NPC extends AI {
    constructor(id, mesh, body) {
        super(id, mesh, body, 'bystander');

        if (!G.npcs[id]) throw `Uncaught EntityError: NPC with id ${this.id} not found!`;
        for (let key in G.npcs[id]) this[key] = G.npcs[id][key];
        if (!this.stats.hp && this.stats.hpMax) this.stats.hp = this.stats.hpMax;
        if (!this.stats.stm && this.stats.stmMax) this.stats.stm = this.stats.stmMax;

        this.inv
            .addSlot(['head', 'chest', 'legs', 'lh', 'rh']);

        this.loadModel(this.path);

        this.subscribe('damage', () => {
            this.behavior = Mixins.aggressive;
        });
        this.subscribe('inv.equip', ({ item, slot }) => {
            if (!(slot == 'rh' || slot == 'lh')) return;
            new THREE.JSONLoader().load(item.model, (geo, mat) => {
                let obj = new THREE.Mesh(geo, mat);
                obj.translateX(slot == 'rh' ? -1 : 1);
                obj.translateY(3);
                obj.translateZ(0.5);
                if (item.meshData) {
                    if (item.meshData.general) {
                        if (item.meshData.general.scale) obj.scale.set(item.meshData.general.scale[0], item.meshData.general.scale[1], item.meshData.general.scale[2]);
                    }
                    if (item.meshData.equipped) {
                        if (item.meshData.equipped.particles) obj.add(new Particles[item.meshData.equipped.particles]().group.mesh);
                        if (item.meshData.equipped.light) {
                            let lightData = item.meshData.equipped.light;
                            let light = new THREE.PointLight(new THREE.Color(lightData[0]), lightData[1], lightData[2], lightData[3]);
                            light.translateY(0.5);
                            obj.add(light);
                        }
                        if (item.meshData.equipped.scale) {
                            let scale = item.meshData.equipped.scale;
                            obj.scale.set(scale[0], scale[1], scale[2]);
                        }
                    }
                }
                this.mesh.add(obj);
                this.holding[slot] = obj;
            });
        });
        this.subscribe('closest.lose', () => {
            if (this.behavior == Mixins.aggressive) {
                this.behavior = Mixins.bystander;
            }
        });
        this.body.addEventListener('collide', (e) => {
            let entity = G.entityByBodyID(e.body.id);
            if (!entity) return; // Must be a map?
            if (entity.type == 'living' && Date.now() - this.last['spoke'] > 5000) {
                this.speak(Math.random() < 0.5 ? '/assets/audio/sfx/npc-bump-1.mp3' : '/assets/audio/sfx/npc-bump-2.mp3');
                this.last['spoke'] = Date.now();
            }
        });
    }

    attack(dmg, entity, slot) {
        if (this.holding[slot].rotation.x !== 0) return;
        if ((Date.now() - this.last.used[slot]) < this.inv.getSlot(slot).stats.cooldown) return;
        super.attack(dmg, entity, slot);
    }

    loadModel(path) {
        super.loadModel(path);
        if (this.meshData.scale) this.mesh.scale.set(this.meshData.scale[0], this.meshData.scale[1], this.meshData.scale[2]);
    }
}

export class Quest {
    constructor(id, json = true, start = true) {
        this.id = id;

        this.name = String;
        this.desc = String;
        this.listeners = Array;
        this.fulfilled = Number;
        this.onComplete = Array;

        if (json) {
            this.loadData(id);
            if (start) this.start();
        }
    }

    loadData(id) {
        if (!G.quests[id]) throw `QeustError: Quest with id ${id} not found!`;
        for (let key in G.quests[id]) this[key] = G.quests[id][key];
        this.fulfilled = this.listeners.length;
    }
    start() {
        for (let trigger of this.listeners) {
            let sub = G.events.subscribe(typeof trigger == 'string' ? trigger : trigger.id, (data) => {
                if (typeof trigger == 'object')
                    for (let key in trigger) {
                        if (key == 'id') continue;
                        if (data[key] != trigger[key]) return;
                    }
                this.fulfilled--;
                if (this.fulfilled <= 0) this.complete();
                sub.unsubscribe();
            });
        }
    }
    complete() {
        console.log(`Quest ${this.id} complete!`);
        for (let reward of this.onComplete) {
            switch (reward.type) {
                case 'give':
                    let entity = G.entityByID(reward.target);
                    entity.inv.add(new Item(reward.item));
                    break;
                default:
                    return;
            }
        }
        if (this.oncomplete) this.oncomplete();
    }
}

export class Adventure extends Quest {
    constructor(id) {
        super(id, true, true);

        this.listeners = null;
    }

    loadData(id) {
        if (!G.adventures[id]) throw `AdventureError: Adventure with id ${id} not found!`;
        for (let key in G.adventures[id]) this[key] = G.adventures[id][key];
        this.fulfilled = 0;
    }
    start() {
        for (let i = 0; i < this.quests.length; i++) {
            this.quests[i] = new Quest(this.quests[i], true, false);
            this.quests[i].oncomplete = () => {
                this.fulfilled++;
                if (this.quests[this.fulfilled]) this.quests[this.fulfilled].start();
                else console.log('Adventure completed!');
            };
        }
        this.quests[0].start();
    }
}

export class Mod {
    constructor(id, init, cb) {
        this.id = id;
        this.init = init;
        this.callback = cb;
        let ROG = (function() { return G })(); // read-only globals
        ROG.Item = Item; // well, maybe
        ROG.Quest = Quest;
        this.init(ROG);
        G.mods.push(this);
        console.log(`Mod ${this.id} attached!`);
    }

    update() {
        let ROG = (function() { return G })(); // read-only globals
        ROG.Item = Item; // well, maybe
        ROG.Quest = Quest;
        this.callback(ROG);
    }

    Get(key) {
        return G[key];
    }
    Set(key, val) {
        if (key == 'scene' || key == 'renderer' || key == 'world') throw `ModError: Permission denied to set ${key}!`;
        G[key] = val;
    }
}
