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

        for (const mat of teapot.materials)
        {
            mat.vertexShading = (parent.LIGHT_ON? "flat" : "none");
            mat.color = (parent.LIGHT_ON? Rngon.color(255, 255, 255) : Rngon.color(40, 40, 40));
        }
    
        return {
            renderOptions: {
                useDepthBuffer: false,
                cameraDirection: Rngon.vector(7, 90, 0),
                cameraPosition: Rngon.vector(-70, 33, -7),
                lights: [
                    Rngon.light(-60, 0, 0, {intensity: 30}),
                ],
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
