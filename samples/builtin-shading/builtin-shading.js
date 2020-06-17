/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

import {torusModel} from "./assets/models/torus.rngon-model.js";

// Initialize the model's n-gons. This will also load into memory any textures
// etc. associated with the model. We can then call the .ngons property to access
// the n-gon array for rendering the model and so on.
//
// Note: The n-gon array is populated asynchronously (pending network access
// for texture data etc.) and so will remain uninitialized for some time after
// the call.
//
torusModel.initialize();

export const sample_scene = (frameCount = 0)=>
{
    for (let i = 0; i < torusModel.ngons.length; i++)
    {
        torusModel.ngons[i].material.vertexShading = parent.MODEL_SHADING.toLowerCase();
        torusModel.ngons[i].material.ambientLightLevel = parent.MODEL_AMBIENT;
    }

    const rotationSpeed = 0.4;

    return Rngon.mesh(torusModel.ngons,
    {
        translation: Rngon.translation_vector(-3, 3, 0),
        rotation: Rngon.rotation_vector((-60 + rotationSpeed * frameCount),
                                        (-60 + rotationSpeed * frameCount),
                                        0),
        scaling: Rngon.scaling_vector(30, 30, 30)
    });
};

export const sampleRenderOptions = {
    lights: [Rngon.light(Rngon.translation_vector(0, 70, -120))],
}
