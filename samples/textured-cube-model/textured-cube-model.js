/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

import {scene} from "./scene.js";

export const sample = {
    initialize: function()
    {
        scene.initialize();
    },
    tick: function()
    {
        this.numTicks++;
        
        const rotationSpeed = 0.3;

        for (const mat of scene.materials)
        {
            mat.vertexShading = (parent.LIGHT_ON? "gouraud" : "none");
        }
    
        return {
            renderOptions: {
                useDepthBuffer: false,
                lights: [
                    Rngon.light(0, 70, -120, {intensity: 150}),
                ],
            },
            mesh: Rngon.mesh(scene.ngons, {
                scale: Rngon.vector(30, 25, 25),
                rotate: Rngon.vector(
                    (-60 + rotationSpeed * this.numTicks),
                    (-60 + rotationSpeed * this.numTicks),
                    0
                ),
            }),
        };
    },
    numTicks: 0,
};
