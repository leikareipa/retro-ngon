/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

import {transparencyModel} from "./assets/models/transparency.rngon-model.js";

// Initialize the model's n-gons. This will also load into memory any textures
// etc. associated with the model. We can then call the .ngons property to access
// the n-gon array for rendering the model and so on.
//
// Note: The n-gon array is populated asynchronously (pending network access
// for texture data etc.) and so will remain uninitialized for some time after
// the call.
//
transparencyModel.initialize();

export const sample_scene = ()=>
{
    return Rngon.mesh(transparencyModel.ngons,
    {
        translation: Rngon.translation_vector(-22, -10, 0),
        rotation: Rngon.rotation_vector(0, -90, 0),
        scaling: Rngon.scaling_vector(25, 25, 30)
    });
};

export const sampleRenderOptions = {}
