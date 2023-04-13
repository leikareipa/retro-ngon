/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

import {scene} from "./assets/mipmapping.rngon-model.js";

export const sample = {
    initialize: function()
    {
        scene.initialize();
    },
    tick: function()
    {
        this.numTicks++;
    
        return {
            renderPipeline: {
                vertexShader: vs_set_mipmap_level,
            },
            mesh: Rngon.mesh(scene.ngons, {
                translation: Rngon.vector(-80, -40, (200 + Math.cos(this.numTicks / 100) * 340)),
                rotation: Rngon.vector(0, -90, 0),
                scaling: Rngon.vector(25, 25, 45)
            }),
        };
    },
    mipmapLevels: [
        "Auto", "0.0", "0.1", "0.2", "0.3", "0.4",
        "0.5", "0.6", "0.7", "0.8", "0.9", "1.0"
    ],
    numTicks: 0,
};

// Vertex shader. Adjusts the n-gon's mipmap level based on its distance from the viewer.
function vs_set_mipmap_level(ngon, cameraPosition)
{
    if (ngon.material.hasMipmapping)
    {
        const minLevel = ((parent.MIPMAP_LEVEL === "Auto")? 0.0 : parent.MIPMAP_LEVEL);
        const maxLevel = ((parent.MIPMAP_LEVEL === "Auto")? 0.3 : parent.MIPMAP_LEVEL);

        const maxDistance = (700 * 700)

        const distance = (((ngon.vertices[0].x - cameraPosition.x) * (ngon.vertices[0].x  - cameraPosition.x)) +
                          ((ngon.vertices[0].y - cameraPosition.y) * (ngon.vertices[0].y  - cameraPosition.y)) +
                          ((ngon.vertices[0].z - cameraPosition.z) * (ngon.vertices[0].z  - cameraPosition.z)));    

        ngon.mipLevel = Math.max(minLevel, Math.min(maxLevel, (distance / maxDistance)));
    }

    return;
}
