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
                cameraDirection: Rngon.vector3(7, 90, 0),
                cameraPosition: Rngon.vector3(-70, 33, -7),
            },
            mesh: Rngon.mesh(teapot.ngons, {
                rotation: Rngon.vector3(90, 20, (0 + (this.numTicks / 2))),
                translation: Rngon.vector3(0, 15, -7),
                scaling: Rngon.vector3(7, 7, 7)
            }),
        };
    },
    numTicks: 0,
};
