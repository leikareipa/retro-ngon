/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer / render sample
 * 
 * Provides a sample 3d scene in which the user can move around using the mouse
 * and keyboard.
 * 
 */

"use strict";

import {scene} from "./assets/scene.rngon-model.js";
import {first_person_camera} from "./camera.js";

const camera = first_person_camera("canvas",
                                   {
                                       position: {x:-70, y:33, z:-7},
                                       direction: {x:7, y:90, z:0},
                                       movementSpeed: 0.05,
                                   });

scene.initialize();

export const sample_scene = ()=>
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
    get targetRefreshRate()
    {
        return parent.REFRESH_RATE;
    },
}
