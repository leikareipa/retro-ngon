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
                cameraDirection: Rngon.vector(7, 90, 0),
                cameraPosition: Rngon.vector(-70, 33, -7),
            },
            mesh: Rngon.mesh(teapot.ngons, {
                rotate: Rngon.vector(90, 20, (0 + (this.numTicks / 2))),
                translate: Rngon.vector(0, 15, -7),
                scale: Rngon.vector(7, 7, 7)
            }),
        };
    },
    numTicks: 0,
};
