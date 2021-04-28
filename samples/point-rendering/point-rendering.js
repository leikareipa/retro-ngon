/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer / render sample
 * 
 */

"use strict";

import {teapot} from "./assets/teapot.rngon-model.js";

export const sample = {
    initialize: function()
    {
        teapot.initialize();
    },
    tick: function()
    {
        this.numTicks++;
    
        return {
            renderOptions: {
                cameraDirection: Rngon.rotation_vector(7, 90, 0),
                cameraPosition: Rngon.translation_vector(-70, 33, -7),
            },
            mesh: Rngon.mesh(teapot.ngons, {
                rotation: Rngon.rotation_vector(90, 20, (0 + (this.numTicks / 2))),
                translation: Rngon.translation_vector(0, 15, -7),
                scaling: Rngon.scaling_vector(7, 7, 7)
            }),
        };
    },
    numTicks: 0,
};
