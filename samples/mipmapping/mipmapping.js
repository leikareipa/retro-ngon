/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

import {scene} from "./assets/mipmapping.rngon-model.js";

scene.initialize();

export const sample_scene = (frameCount = 0)=>
{
    return Rngon.mesh(scene.ngons,
    {
        translation: Rngon.translation_vector(-80, -40, (200 + Math.sin(frameCount/100) * 340)),
        rotation: Rngon.rotation_vector(0, -90, 0),
        scaling: Rngon.scaling_vector(25, 25, 45)
    });
};

export const sampleRenderOptions = {
    vertexShaderFunction: (ngon, cameraPosition)=>
    {
        if (ngon.material.hasMipmapping)
        {
            const maxDistance = (700 * 700)

            const distance = (((ngon.vertices[0].x - cameraPosition.x) * (ngon.vertices[0].x  - cameraPosition.x)) +
                              ((ngon.vertices[0].y - cameraPosition.y) * (ngon.vertices[0].y  - cameraPosition.y)) +
                              ((ngon.vertices[0].z - cameraPosition.z) * (ngon.vertices[0].z  - cameraPosition.z)));    

            ngon.mipLevel = Math.max(0, Math.min(0.5, (distance / maxDistance)));
        }
    }
}
