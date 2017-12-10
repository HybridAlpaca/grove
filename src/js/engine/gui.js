"use strict";

// Load dependancies

const $ = require('jquery');

let G = require('globals');

// init logic

$(document).on('contextmenu', (e) => e.preventDefault());

export default function GUI(title = '', content = '') {
    if ($('#gui').is(':visible')) return;
    $('#gui-title').text(title).click(() => { $('#gui').hide() });
    $('#gui-content').html(content);
    document.exitPointerLock();
    $('#gui').show();
}

export function Inventory() {
    let content = $('<div>');
    for (let key in G.player.inv.equipped) { // hacky, but it works
        let item = G.player.inv.equipped[key];
        if (!item) continue;
        $('<img>')
            .attr('src', item.icon)
            .attr('title', item.name)
            .width(50)
            .css('margin', '3px')
            .css('border', '2px solid blue')
            .data('item', item)
            .appendTo(content);
    }
    for (let key in G.player.inv.inv) { // hacky, but it works
        let item = G.player.inv.inv[key];
        if (!item) continue;
        $('<img>')
            .attr('src', item.icon)
            .attr('title', item.name)
            .width(50)
            .css('margin', '3px')
            .data('item', item)
            .appendTo(content);
    }
    content.on('click', 'img', function(e) {
        e.preventDefault();
        let item = $(this).data('item');
        if (!/none/gi.test($(this).css('border'))) {
            $(this).css('border', 'none');
            G.player.inv.unequip(item.slot);
            return;
        }
        else {
            if (G.player.inv.getSlot('rh')) return;
            $(this).css('border', '2px solid blue');
            item.slot = 'rh';
            G.player.inv.equip(item.uuid);
        }
    });
    content.on('contextmenu', 'img', function(e) {
        e.preventDefault();
        let item = $(this).data('item');
        if (!/none/gi.test($(this).css('border'))) {
            $(this).css('border', 'none');
            G.player.inv.unequip(item.slot);
            return;
        }
        else {
            if (G.player.inv.getSlot('lh')) return;
            $(this).css('border', '2px solid blue');
            item.slot = 'lh';
            G.player.inv.equip(item.uuid);
        }
    });
    new GUI('Inventory', content);
}
