/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

import {texturedCubeModel} from "./assets/textured-cube.rngon-model.js";

export const sample = {
    initialize: function()
    {
        texturedCubeModel.initialize();
    },
    tick: function()
    {
        this.numTicks++;
        
        const rotationSpeed = 0.3;
    
        return {
            mesh: Rngon.mesh(texturedCubeModel.ngons, {
                scaling: Rngon.scaling_vector(30, 25, 25),
                rotation: Rngon.rotation_vector((-60 + rotationSpeed * this.numTicks),
                                                (-60 + rotationSpeed * this.numTicks),
                                                0),
            }),
        };
    },
    numTicks: 0,
};
