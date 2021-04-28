/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

import {torusModel} from "./assets/models/torus.rngon-model.js";

export const sample = {
    initialize: function()
    {
        torusModel.initialize();
    },
    tick: function()
    {
        this.numTicks++;
        
        for (const ngon of torusModel.ngons)
        {
            ngon.material.color = Rngon.color_rgba(215, 215, 115, parent.MODEL_ALPHA);
        }

        const rotationSpeed = 0.4;
    
        return {
            mesh: Rngon.mesh(torusModel.ngons, {
                scaling: Rngon.scaling_vector(30, 30, 30),
                translation: Rngon.translation_vector(-3, 3, 0),
                rotation: Rngon.rotation_vector((-60 + rotationSpeed * this.numTicks),
                                                (-60 + rotationSpeed * this.numTicks),
                                                0),
            }),
        };
    },
    numTicks: 0,
};
