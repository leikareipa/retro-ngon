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

        const rotationSpeed = 0.4;

        const meshSettings = {
            scaling: Rngon.vector(30, 30, 30),
            translation: Rngon.vector(-3, 3, 0),
            rotation: Rngon.vector(
                (-60 + rotationSpeed * this.numTicks),
                (-60 + rotationSpeed * this.numTicks),
                0
            ),
        };

        const lightSource = Rngon.light(Rngon.vector(0, 70, -120), {
            clip: 1.5,
            attenuation: 1,
            intensity: 150,
        });

        for (const ngon of torusModel.ngons)
        {
            ngon.material.vertexShading = parent.MODEL_SHADING.toLowerCase();
            ngon.material.ambientLightLevel = parent.MODEL_AMBIENT;
        }

        return {
            renderOptions: {lights: [lightSource]},
            mesh: Rngon.mesh(torusModel.ngons, meshSettings)
        };
    },
    shadingTypes: ["None", "Flat", "Gouraud"],
    numTicks: 0,
};
