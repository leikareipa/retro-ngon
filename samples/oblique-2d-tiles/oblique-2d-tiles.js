/*
 * 2021 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

import {tile_filler} from "./tile-filler.js";
import {apply_lighting_to_tile} from "./tile-lighter.js";

const groundTileWidth = 22;
const groundTileHeight = 22;

const grass1 = Rngon.texture({
	"width":22,
	"height":21,
	"channels":"rgba:5+5+5+1",
	"encoding":"base64",
	"pixels":"AAAAAAAAAAAAAAAAAAAAAAAAAAApiYyFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAApicaEKYmMhQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACMhYyFKYnGhCmJKYkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAApiSmJC4XGhIyFKYnGhIyFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACMhYyFxoQLhcaEjIWMhQuFjIUpiQAAAAAAAAAAAAAAAAAAAAAAAAAAAAALhcaExoSMhSmJKYmMhcaECIWMhQuFKYkAAAAAAAAAAAAAAAAAAAAAAAAIhcaEC4UpiSmJC4XGhCmJKYkpiSmJKYnGhMaEAAAAAAAAAAAAAAAAAACMhYyFKYnGhCmJjIXGhIyFCIUpiQuFxoQpiSmJCIUpiQAAAAAAAAAAAADGhCmJKYkIhayJrInGhKyJxoTGhAuFC4XGhMaExoQpiSmJjIUAAAAAAAAIhSmJC4WMhQiFxoQpiSmJjIWsicaEKYnGhIyFKYnGhCmJC4WMhSmJAAALhYyFKYnGhMaErImsiQuFxoQIhYyFxoQIhcaExoTGhCmJKYmsiSmJrImMhQAAxoQpiSmJxoSMhcaExoSMhSmJjIUIhayJKYmMhQuFC4UpiYyFxoQpiQAAAAAAAAiFC4XGhIyFKYkLhSmJxoQpiQiFrIkIhQiFrIkpiYyFKYmsiQAAAAAAAAAAAACsicaExoQIhSmJC4UpicaECIUpiSmJrImMhcaEKYkpiQAAAAAAAAAAAAAAAAAAxoSsiSmJCIWMhQiFjIUpicaEKYmsiSmJKYmMhQAAAAAAAAAAAAAAAAAAAAAAAKyJrIkIhQuFxoSsiQuFrIkpicaErIkpiQAAAAAAAAAAAAAAAAAAAAAAAAAAAAApiayJC4UIhcaExoQpiayJKYmsiQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACIUpicaEC4UpiayJKYnGhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACmJjIXGhCmJKYkpiQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACsiSmJ7oGsiQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAjIUpiQAAAAAAAAAAAAAAAAAAAAAAAAAA"
});

const grass2 = Rngon.texture({
	"width":22,
	"height":21,
	"channels":"rgba:5+5+5+1",
	"encoding":"base64",
	"pixels":"AAAAAAAAAAAAAAAAAAAAAAAAAADmhIyFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAphayJrInnhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADmhGuJSoULhaWESoUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAphSiJB4WlhKyJa4UHheeEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAApheeIxoAIiUqFKYkoiUqF54QphQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAphWuJpIQIiaWExoQpieuECImMheeE5oQAAAAAAAAAAAAAAAAAAAAAAACEhAeJyYAIiQiJ54QpicaEC4WMiWuFCIlKiSmFAAAAAAAAAAAAAAAAAADJgIyJyYBKhQiJpYSMiYyFxoSMhSmJjImEhKWE54SEhAAAAAAAAAAAAADnhCiJpYTqgEqFKInrhAuFxoTnhCmJB4UpiSiJCIlrieeEKYkAAAAAAACMhSmFB4kIiWuFxoQpiSmJC4UpiQiFpYQLhSmJKYmMiSiJa4kHiSmFAAApiYyFC4XGhIyFjIWMhSmJCIXGhKyJxoQIhQiFC4UpiQuFxoQpiaWE7oEpiQAAjIWEhAeJpYSlhIyJxoSMhcaErImMhYyFKYnGhIuFjImlhOqEpYTmhAAAAAAAACmJKYXJgOqACInrhMaEjImMhQiFKYnGhCmJ54SlhOeEpYQphQAAAAAAAAAAAACEhOaEjIlKhQiJa4XGhCmJxoSMhSmJ64RrheqAyYDmhAAAAAAAAAAAAAAAAAAAKYkphaSECIkIiYyJKYkLhQuF64QIieaExoAphQAAAAAAAAAAAAAAAAAAAAAAAIyFhIQpiaWEi4nGhKyJxoQIieeE54QphQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAqhYSEKYnnhOeErIlrhUqFpYQphQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASokphSmJa4XGhKWEjImEhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACmF54QpicaECInJgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHieeEKYnnhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKYmMhQAAAAAAAAAAAAAAAAAAAAAAAAAA"
});

const wall1 = Rngon.texture({
	"width":22,
	"height":63,
	"channels":"rgba:5+5+5+1",
	"encoding":"base64",
	"pixels":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAs50AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAs52znbOdAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMI2znTCNs52znQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAs52znTCNMI2znTCNOecAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMI2znbOds50wjTCNOec55wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMI2znTCNMI2znTCNOee3zjnnAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMI0wjbOdMI2znbOdOee3ztbat84AAAAAAAAAAAAAAAAAAAAAAAAAAAAAs50wjbOdMI2znbOdOee3zrfOOec55wAAAAAAAAAAAAAAAAAAAAAAAAAAMI0wjbOdMI2znTCNt8699znnUsq99znnAAAAAAAAAAAAAAAAAAAAADEls52znbOdMI0wjTCNt84559baOec559baOecAAAAAAAAAAAAAAAAAAAAAMI2znbOds50wjTCN99733rfOUso55/fe99733gAAAAAAAAAAAAAAAAAAy4gwjTCNMI0wjbOdt86997fOOec55xjjOec55znnAAAAAAAAAAAAAAAAAAANjQ2NDY2znTCN99733vfet84557Ods50Y4/feOecAAAAAAAAAAAAAAAAAAA2NDY3LiA2Nt8455znnOec557Od7JzsnLOdOee3zgAAAAAAAAAAAAAAAAAADY0NjcuIy4g55733t863zrOd/3/snOycs5333vfeAAAAAAAAAAAAAAAAAADLiA2NDY3LiDnnUso557fOs53/f+yc7Jyznffe994AAAAAAAAAAAAAAAAAAMuIDY3LiMuIt863zjnns50AAP9/7JzsnLOd99455wAAAAAAAAAAAAAAAAAAy4jLiMuIDY23zrfOOeeznQAA/3/snOycs5333vfeAAAAAAAAAAAAAAAAAADLiA2NDY3LiLfOOee3zrOdAAD/f+yc7JyznTnn994AAAAAAAAAAAAAAAAAAMuIy4gNjcuIOec55znns53/f6iUqJTsnLOd99733gAAAAAAAAAAAAAAAAAAy4gNjcuIy4i3zrfOvfeznaiUqJSolKiUs5055znnAAAAAAAAAAAAAAAAAADLiMuIy4gNjTnnt85SyrOdqJSolKiUs5333vfet84AAAAAAAAAAAAAAAAAAMuIy4gNjcuIOec55znns52olKiUs5333rfO99733gAAAAAAAAAAAAAAAAAAy4jLiA2NDY055znnOeeznaiUs5055/feOefW2vfeAAAAAAAAAAAAAAAAAADLiA2NDY3LiDnnOec557Ods5333vfeUsr33lLK994AAAAAAAAAAAAAAAAAAMuIDY0NjcuIOef33jnns5055znnOef33jnn99733gAAAAAAAAAAAAAAAAAAy4gNjcuIDY055/fe99733jnnOec55/feOef33vfeAAAAAAAAAAAAAAAAAADLiMuIDY3LiDnn99733jnnt863ztba99455znn994AAAAAAAAAAAAAAAAAAA2NDY3LiA2NOef33jnnOec55znn1tr33vfeUsr33gAAAAAAAAAAAAAAAAAAy4jLiMuIDY333vfet85a67fOt85Syvfe99455znnAAAAAAAAAAAAAAAAAADLiA2Ny4jLiDnnUso557fOt8455znn99455/fe994AAAAAAAAAAAAAAAAAAMuIy4jLiA2NOec55/fevfc557fO99733jnnOef33gAAAAAAAAAAAAAAAAAAy4jLiA2Ny4j33vfeOefW2jnn997W2jnn99733vfeAAAAAAAAAAAAAAAAAADLiA2Ny4jLiDnnOec551LK994551LK99455/fe994AAAAAAAAAAAAAAAAAAMuIy4gNjcuI99733vfe99733vfe99455/feUso55wAAAAAAAAAAAAAAAAAADY3LiA2Ny4g55/feOec55znnOef33jnnOef33jnnAAAAAAAAAAAAAAAAAAANjcuIDY0NjTnn99455znnOef33jnnOec55znnOecAAAAAAAAAAAAAAAAAAA2Ny4gNjcuI99611vfe1tq11jnnOec559bWOec55wAAAAAAAAAAAAAAAAAAy4jLiMuIy4g55/feOedSyjnn1tY55733OefW1vfeAAAAAAAAAAAAAAAAAAANjcuIy4gNjffeOef33rXWOec559bWUso55znnOecAAAAAAAAAAAAAAAAAAMuIDY0NjcuIOec55znntdY55znnOec55znnOefW1gAAAAAAAAAAAAAAAAAAy4jLiMuIy4i11rXWtda11jnn1tY559bW1tYnhSeFAAAAAAAAAAAAAAAAAADLiMuIDY3LiLXW99455znnLo455znnOefW1tbWiokAAAAAAAAAAAAAAAAAAMuIy4gNjQ2NOee11vfe1tY55znniok55znniokAAAAAAAAAAAAAAAAAAAAAy4gNjQ2NDY333tbWOefW1jnnioknhdbW994AAAAAAAAAAAAAAAAAAAAAAADLiA2NDY3LiPfeOefW1tbW1taKidbWOecAAAAAAAAAAAAAAAAAAAAAAAAAAMuIy4jLiMuItdbW1tbW1taKiSeFOecAAAAAAAAAAAAAAAAAAAAAAAAAAAAADY3LiMuIDY333tbWJ4XW1jnniokAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADLiMuIDY0NjdbWOefW1tbWLo45ZwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADY0NjcuIOefW1tbWJ4UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA2Ny4jW1jnnJ4UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANjS6OJ4UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJ4UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
});

const lamp1 = Rngon.texture({
	"width":22,
	"height":50,
	"channels":"rgba:5+5+5+1",
	"encoding":"base64",
	"pixels":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAGOMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGOMY4xjjAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGOMY4xjjGOMY4wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGOMY4xjjGOMY4xjjGOMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGOMY4xjjGOMY4xjjGOMY4xjjAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABjjGOMY4xjjGOMY4xjjAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGOM39tjjGOMY4yfs2OMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY4yfs5/LY4yfs5/LY4wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABjjJ+zn7NjjN/bn7NjjAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGOMn8ufs2OMn8ufs2OMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY4xjjN/bY4yfy2OMY4wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGOMY4xjjGOMY4wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABCiGOMQogAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEKIhJBCiAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY4yllGOMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABjjKWUY4wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGOMpZRjjAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY4yllGOMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABjjKWUY4wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGOMpZRjjAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY4yllGOMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABjjKWUY4wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGOMpZRjjAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY4yllGOMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABjjKWUY4wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGOMpZRjjAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY4yllGOMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABjjKWUY4wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGOMpZRjjAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY4yllGOMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABjjKWUY4wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGOMpZRjjAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY4yllGOMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABjjKWUY4wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACllGOMpZRjjKWUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGOMpZQIoaWUY4wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY4xjjKWUY4xjjAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABjjGOMY4xjjGOMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGOMY4xjjGOMY4wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY4xjjGOMY4xjjAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGOMY4xjjAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=="
});

const gateway1 = Rngon.texture({
	"width":22,
	"height":63,
	"channels":"rgba:5+5+5+1",
	"encoding":"base64",
	"pixels":"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hBCEEIQQhBANDcsIDQ0NDTln9145ZzlnOWf3XjlnOWc5ZzlnOWeEEIQQhBCEEIQQhBCEEA0NywgNDcsI9161Vvde1lq1VjlnOWc5Z9ZWOWc5Z4QQhBCEEIQQhBCEEIQQywjLCMsIywg5Z/deOWdSSjln1lY5Z713OWfWVvdehBCEEIQQhBCEEIQQhBANDcsIywgNDfdeOWf3XrVWOWc5Z9ZWUko5ZzlnOWeEEIQQhBCEEIQQhBCEEMsIDQ0NDcsIOWc5ZzlntVY5ZzlnOWc5ZzlnOWfWVoQQhBCEEIQQhBCEEIQQywjLCMsIywi1VrVWtVa1Vjln1lY5Z9ZW1lYnBScFhBCEEIQQhBCEEIQQhBDLCMsIDQ3LCLVW9145ZzlnLg45ZzlnOWfWVtZWigmEEIQQhBCEEIQQhBCEEMsIywgNDQ0NOWe1Vvde1lY5Zzlnigk5ZzlnigmEEIQQhBCEEIQQhBCEEIQQywgNDQ0NDQ33XtZWOWfWVjlnigknBdZW916EEIQQhBCEEIQQhBCEEIQQhBDLCA0NDQ3LCPdeOWfWVtZW1laKCdZWOWeEEIQQhBCEEIQQhBCEEIQQhBCEEMsIywjLCMsItVbWVtZW1laKCScFOWeEEIQQhBCEEIQQhBCEEIQQhBCEEIQQDQ3LCMsIDQ33XtZWJwXWVjlnigmEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBDLCMsIDQ0NDdZWOWfWVtZWLg6EEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQDQ0NDcsIOWfWVtZWJwWEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEA0NywjWVjlnJwWEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBANDS4OJwWEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQJwWEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQhBCEEIQQ"
});

const textures = [wall1, gateway1, lamp1, grass1, grass2];

const decors = [
    {object:wall1, x:16, y:4},
    {object:gateway1, x:15, y:5},
    {object:wall1, x:14, y:6},
    {object:lamp1, x:10, y:9},
    {object:wall1, x:13, y:7},
    {object:wall1, x:12, y:8},
    {object:wall1, x:11, y:9},
    {object:lamp1, x:14, y:8, lightEmitting:true},
    {object:gateway1, x:10, y:10},
    {object:wall1, x:9, y:11},
    {object:wall1, x:7, y:13},
    {object:lamp1, x:4, y:15},
    {object:wall1, x:5, y:15, transparent:true},
    {object:wall1, x:4, y:16, transparent:true},
    {object:lamp1, x:20, y:8, lightEmitting:true},
];

export const sample = {
    initialize: function()
    {
        this.camera = {
            pos: {x: 0, y: 0},
            dir: {left:false, right:false, up:false, down:false},
            speed: 1.5,
        };

        precompute_texture_parameters();

        window.addEventListener("keydown", (event)=>
        {
            switch (event.key.toLowerCase())
            {
                case "e": this.camera.dir.up = true; break;
                case "d": this.camera.dir.down = true; break;
                case "s": this.camera.dir.left = true; break;
                case "f": this.camera.dir.right = true; break;
            }
        });

        window.addEventListener("keyup", (event)=>
        {
            switch (event.key.toLowerCase())
            {
                case "e": this.camera.dir.up = false; break;
                case "d": this.camera.dir.down = false; break;
                case "s": this.camera.dir.left = false; break;
                case "f": this.camera.dir.right = false; break;
            }
        });

        window.addEventListener("mousemove", (event=>
        {
            this.mousePos.x = event.clientX;
            this.mousePos.y = event.clientY;
        }));
    },
    tick: function(defaultRenderOptions)
    {
        this.numTicks++;

        const mousePos = this.mousePos;
        const camera = this.camera;

        // Move the camera.
        camera.pos.x += (camera.speed * (camera.dir.left? 1 : camera.dir.right? -1 : 0));
        camera.pos.y += (camera.speed * (camera.dir.up? 1 : camera.dir.down? -1 : 0));

        const ngons = [];

        // Construct the ground tile mesh.
        {
            const numTilesX = 1 + Math.ceil(Rngon.context.default.pixelBuffer?.width / groundTileWidth);
            const numTilesY = 1 + Math.ceil(Rngon.context.default.pixelBuffer?.height / (groundTileHeight / 2));
            
            let startX = Math.floor(this.camera.pos.x + -(groundTileWidth / 2));
            let startY = Math.floor(this.camera.pos.y + -(groundTileHeight / 2));
            let isOddLine = false;

            for (let y = 0; y < numTilesY; (y++, isOddLine = !isOddLine))
            {
                for (let x = 0; x < numTilesX; x++)
                {
                    let posX = (startX + (x * groundTileWidth));

                    ngons.push(Rngon.ngon([Rngon.vertex( posX,                     startY),
                                           Rngon.vertex( posX,                    (startY + groundTileHeight)),
                                           Rngon.vertex((posX + groundTileWidth), (startY + groundTileHeight)),
                                           Rngon.vertex((posX + groundTileWidth),  startY)] , {
                        texture: (((Math.floor(this.camera.pos.x - posX) % 2) == 0)? grass1 : grass2),
                        isInScreenSpace: true,
                        vertexShading: ((parent.TIME_TYPE == "Night")? "gouraud" : "none"),
                    }));
                }

                startX += ((groundTileWidth / 2) * (isOddLine? -1 : 1));
                startY += (groundTileHeight / 2);
            }
        }

        // Construct the meshes of decor tiles; e.g. walls.
        for (const decor of decors)
        {
            const offsX = Math.floor(this.camera.pos.x + (decor.x * (groundTileWidth / 2)));
            const offsY = Math.floor(this.camera.pos.y + (decor.y * (groundTileHeight / 2)));

            ngons.push(Rngon.ngon([Rngon.vertex( offsX,                    (offsY - decor.object.height)),
                                   Rngon.vertex( offsX,                     offsY),
                                   Rngon.vertex((offsX + groundTileWidth),  offsY),
                                   Rngon.vertex((offsX + groundTileWidth), (offsY - decor.object.height))], {
                texture: decor.object,
                isInScreenSpace: true,
                vertexShading: (((parent.TIME_TYPE == "Night") && !decor.lightEmitting)? "gouraud" : "none"),
                color: Rngon.color(255, 255, 255, (decor.transparent? 125 : 255)),
            }));
        }
    
        return {
            renderOptions: {
                useDepthBuffer: false,
                get lights()
                {
                    return [
                        Rngon.light(...tile_pos_to_world_pos(21, 7), {intensity: 20}),
                        Rngon.light(...tile_pos_to_world_pos(15, 7), {intensity: 20}),

                        // A light that follows the mouse cursor.
                        Rngon.light((mousePos.x * defaultRenderOptions.resolution), (mousePos.y * defaultRenderOptions.resolution), 0, {intensity: 20}),
                    ];

                    function tile_pos_to_world_pos(tileX, tileY)
                    {
                        return [
                            Math.floor(camera.pos.x + (tileX * (groundTileWidth / 2))),
                            Math.floor(camera.pos.y + (tileY * (groundTileHeight / 2))),
                            0,
                        ];
                    }
                },
            },
            renderPipeline: {
                rasterizer: tile_filler,
                transformClipLighter: ({renderContext, mesh})=>
                {
                    mesh.ngons.forEach(n=>apply_lighting_to_tile(renderContext, n));
                    renderContext.screenSpaceNgons = mesh.ngons;
                },
            },
            mesh: Rngon.mesh(ngons),
        };
    },
    camera: undefined,
    numTicks: 0,
    mousePos: {x:0, y:0},
};

function precompute_texture_parameters()
{
    // Pre-compute the texel index of the first and last solid pixel on each
    // horizontal row of each texture. This way, we can skip a bunch of transparent
    // pixels during rasterization.
    for (const texture of textures)
    {
        texture.firstSolidPixelIdx = [];
        texture.lastSolidPixelIdx = [];

        for (let y = 0; y < texture.height; y++)
        {
            texture.firstSolidPixelIdx[y] = texture.width;
            texture.lastSolidPixelIdx[y] = -1;

            for (let x = 0; x < texture.width; x++)
            {
                if (texture.pixels[((x + y * texture.width) * 4) + 3] == 255)
                {
                    texture.firstSolidPixelIdx[y] = x;
                    break;
                }
            }

            for (let x = (texture.width - 1); x >= 0; x--)
            {
                if (texture.pixels[((x + y * texture.width) * 4) + 3] == 255)
                {
                    texture.lastSolidPixelIdx[y] = x;
                    break;
                }
            }
        }
    }

    return;
}

// For debugging.
function make_textures_solid()
{
    for (const texture of textures)
    {
        let idx = 0;
        while (texture.pixels[idx].alpha < 255) idx++;
        texture.pixels.fill(texture.pixels[idx]);
    }

    return;
}

// For debugging.
function draw_debug_borders_on_textures()
{
    const palette = [
        {red:255, green:0, blue:0},
        {red:0, green:255, blue:0},
        {red:0, green:0, blue:255},
        {red:255, green:255, blue:0},
        {red:0, green:255, blue:255},
        {red:255, green:0, blue:255},
    ];
    
    for (const texture of textures)
    {
        const lineColor = palette[Math.floor(Math.random() * palette.length)];

        for (let x = 0; x < texture.width; x++)
        {
            put_border(texture, (x + 0 * texture.width));
            put_border(texture, (x + (texture.height - 1) * texture.width));
        }

        for (let y = 0; y < texture.height; y++)
        {
            put_border(texture, (0 + y * texture.width));
            put_border(texture, ((texture.width - 1) + y * texture.width));
        }

        function put_border(texture, idx)
        {
            texture.pixels[idx] = lineColor;
            texture.pixels[idx].alpha = 255;
        }
    }

    return;
}
