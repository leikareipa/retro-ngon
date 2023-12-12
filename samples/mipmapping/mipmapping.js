/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

import {scene as sceneDistance} from "./scene.js";
import {scene as sceneAngle} from "../textured-cube-model/scene.js";

export const sample = {
    initialize: function()
    {
        sceneDistance.initialize();
        sceneAngle.initialize();
    },
    tick: function()
    {
        this.numTicks++;
    
        const rotationSpeed = 0.3;
        const scene = ((parent.MIPMAP_TYPE === "Distance")? sceneDistance : sceneAngle);

        return {
            renderOptions: {
                useDepthBuffer: false,
            },
            renderPipeline: {
                vertexShader: ((scene === sceneDistance)? vs_mipmap_distance : vs_mipmap_angle),
            },
            mesh: Rngon.mesh(scene.ngons, (
                (scene === sceneDistance)
                    ? {
                          translate: Rngon.vector(-80, -40, (200 + Math.cos(this.numTicks / 100) * 340)),
                          rotate: Rngon.vector(0, -90, 0),
                          scale: Rngon.vector(25, 25, 45)
                      }
                    : {
                          scale: Rngon.vector(30, 25, 25),
                          rotate: Rngon.vector(
                              (-60 + rotationSpeed * this.numTicks),
                              (-60 + rotationSpeed * this.numTicks),
                              0
                          )
                      }
                )
            ),
        };
    },
    mipmapLevels: [
        "Auto", "0.0", "0.1", "0.2", "0.3", "0.4",
        "0.5", "0.6", "0.7", "0.8", "0.9", "1.0"
    ],
    mipmapTypes: [
        "Distance", "Angle",
    ],
    numTicks: 0,
};

// Vertex shader. Adjusts the n-gon's mipmap level based on its distance from the viewer.
function vs_mipmap_distance(ngon, renderContext)
{
    if (ngon.material.hasMipmapping)
    {
        const minLevel = ((parent.MIPMAP_LEVEL === "Auto")? 0.0 : parent.MIPMAP_LEVEL);
        const maxLevel = ((parent.MIPMAP_LEVEL === "Auto")? 1.0 : parent.MIPMAP_LEVEL);
        const maxDistance = (700**2);
        const distance = (
            ((ngon.vertices[0].x - renderContext.cameraPosition.x)**2) +
            ((ngon.vertices[0].y - renderContext.cameraPosition.y)**2) +
            ((ngon.vertices[0].z - renderContext.cameraPosition.z)**2)
        );    

        ngon.mipLevel = Math.max(minLevel, Math.min(maxLevel, (distance / maxDistance)));
    }

    return;
}

// Vertex shader. Adjusts the n-gon's mipmap level based on its orientation wrt. the direction
// of the camera (which for simplicity is assumed to be static and looking down the Z axis).
function vs_mipmap_angle(ngon)
{
    const viewVector = Rngon.vector(0, 0, -1);
    const minLevel = ((parent.MIPMAP_LEVEL === "Auto")? 0.0 : parent.MIPMAP_LEVEL);
    const maxLevel = ((parent.MIPMAP_LEVEL === "Auto")? 0.7 : parent.MIPMAP_LEVEL);
    const angle = Math.abs(Rngon.vector.dot(ngon.normal, viewVector))
    ngon.mipLevel = Math.max(minLevel, Math.min(maxLevel, (1 - angle)));

    return;
}
