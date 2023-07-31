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

        scene.material.vertexShading = parent.MODEL_SHADING.toLowerCase();
        scene.material.ambientLightLevel = parent.MODEL_AMBIENT;

        return {
            renderOptions: {lights: [lightSource]},
            mesh: Rngon.mesh(scene.ngons, meshSettings)
        };
    },
    shadingTypes: ["None", "Flat", "Gouraud"],
    numTicks: 0,
};
