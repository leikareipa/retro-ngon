/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

import {texturedCubeModel} from "./assets/textured-cube.rngon-model.js";

// Initialize the model's n-gons. This will also load into memory any textures
// etc. associated with the model. We can then call the .ngons property to access
// the n-gon array for rendering the model and so on.
//
// Note: The n-gon array is populated asynchronously (pending network access
// for texture data etc.) and so will remain uninitialized for some time after
// the call.
//
texturedCubeModel.initialize();

// Returns a mesh containing the model's ngons, with incremental rotation added
// based on the rendered frame count.
export const sample_scene = (frameCount)=>
{
    const rotationSpeed = 0.3;
    return Rngon.mesh(texturedCubeModel.ngons,
    {
        rotation: Rngon.rotation_vector((-60 + rotationSpeed * frameCount),
                                        (-60 + rotationSpeed * frameCount),
                                        0),
        scaling: Rngon.scaling_vector(30, 25, 25)
    });
};

export const sampleRenderOptions = {}
