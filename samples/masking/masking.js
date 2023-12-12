/*
 * 2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

import {scene} from "./scene.js";
import {first_person_camera} from "../first-person-camera/camera.js";

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
                scale: Rngon.vector(25, 25, 25)
            }),
            renderOptions: {
                cameraDirection: this.camera.direction,
                cameraPosition: this.camera.position,
            },
            renderPipeline: {
                // We'll modify the depth buffer prior to rendering to achieve masking - pixels we want
                // masked have their depth values set to a small number, so they don't pass the depth
                // test during rasterization.
                surfaceWiper: (renderContext)=>{
                    Rngon.default.render.pipeline.surfaceWiper(renderContext);

                    const depthBuf = renderContext.depthBuffer;
                    const maxDistance = Math.abs((depthBuf.width ** 2) / (Math.cos(this.numTicks / 100) * 50));
                    const midx = depthBuf.width / 2;
                    const midy = depthBuf.height / 2;
                    
                    for (let y = 0; y < depthBuf.height; y++) {
                        for (let x = 0; x < depthBuf.width; x++) {
                            const idx = (x + y * depthBuf.width);
                            const distance = (((x - midx) ** 2) + ((y - midy) ** 2));
                            depthBuf.data[idx] = (Infinity * (distance > maxDistance)? -1 : 1);
                        }
                    }
                }
            }
        };
    },
    camera: undefined,
    numTicks: 0,
};
