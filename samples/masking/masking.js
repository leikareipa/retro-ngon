/*
 * 2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

import {scene} from "./assets/scene.rngon-model.js";
import {first_person_camera} from "../first-person-camera/camera.js";

const pattern = [
    [0,0,0,0,1,0,0,0,0],
    [0,0,0,1,1,1,0,0,0],
    [0,0,1,1,0,1,1,0,0],
    [0,1,1,0,1,0,1,1,0],
    [1,1,0,1,0,1,0,1,1],
    [0,1,1,0,1,0,1,1,0],
    [0,0,1,1,0,1,1,0,0],
    [0,0,0,1,1,1,0,0,0],
    [0,0,0,0,1,0,0,0,0],
];

export const sample = {
    initialize: function()
    {
        this.camera = first_person_camera("canvas", {
            position: {x:-70, y:33, z:-7},
            direction: {x:7, y:90, z:0},
            movementSpeed: 0.05,
        });

        scene.initialize();
    },
    tick: function()
    {
        this.numTicks++;
        this.camera.update();
    
        return {
            mesh: Rngon.mesh(scene.ngons, {
                scaling: Rngon.vector(25, 25, 25)
            }),
            renderOptions: {
                cameraDirection: this.camera.direction,
                cameraPosition: this.camera.position,
            },
            renderPipeline: {
                // We'll modify the depth buffer prior to rendering to achieve masking - pixels we want
                // masked have their depth values set to a small number, so they don't pass the depth
                // test during rasterization.
                surfaceWiper: ()=>{
                    Rngon.defaultPipeline.surface_wiper();

                    const depthBuf = Rngon.state.active.depthBuffer;
                    const maxDistance = Math.abs((depthBuf.width ** 2) / (Math.cos(this.numTicks / 100) * 50));
                    const midx = depthBuf.width / 2;
                    const midy = depthBuf.height / 2;
                    const which = (performance.now() & 2048);
                    
                    for (let y = 0; y < depthBuf.height; y++) {
                        for (let x = 0; x < depthBuf.width; x++) {
                            const idx = (x + y * depthBuf.width);

                            if (which)
                            {
                                const patternPixel = pattern[y % pattern.length][x % pattern[0].length];
                                depthBuf.data[idx] = (Infinity * (patternPixel? -1 : 1));
                            }
                            else
                            {
                                const distance = (((x - midx) ** 2) + ((y - midy) ** 2));
                                depthBuf.data[idx] = (Infinity * (distance > maxDistance)? -1 : 1);
                            }
                        }
                    }
                }
            }
        };
    },
    camera: undefined,
    numTicks: 0,
};
