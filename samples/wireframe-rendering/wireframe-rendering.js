/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer / render sample
 * 
 */

"use strict";

import {first_person_camera} from "../first-person-camera/camera.js";
import {scene} from "./assets/scene.rngon-model.js";

const camera = first_person_camera("canvas",
{
    position: {x:-70, y:33, z:-7},
    direction: {x:7, y:90, z:0},
    movementSpeed: 0.05,
});

scene.initialize();

// Returns the n-gons of the scene to be rendered by the retro n-gon renderer.
// This function gets called by the renderer once per frame.
export const sample_scene = (frameCount = 0)=>
{
    camera.update();

    // Assumes 'renderSettings' is a pre-defined global object from which the
    // renderer will pick up its settings.
    renderSettings.cameraDirection = camera.direction;
    renderSettings.cameraPosition = camera.position;

    return Rngon.mesh(scene.ngons,
    {
        scaling: Rngon.scaling_vector(25, 25, 25)
    });
};

export const sampleRenderOptions = {
}
