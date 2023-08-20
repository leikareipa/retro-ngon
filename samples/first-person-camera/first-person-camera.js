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

import {scene} from "./scene.js";
import {first_person_camera} from "./camera.js";

export const sample = {
    initialize: function()
    {
        this.camera = first_person_camera("canvas", {
            position: {x:-70, y:33, z:-7},
            direction: {x:7, y:90, z:0},
            movementSpeed: 0.05,
        });

        scene.initialize();
    },
    tick: function()
    {
        this.numTicks++;
        this.camera.update();
    
        return {
            renderOptions: {
                fov: 65,
                cameraDirection: this.camera.direction,
                cameraPosition: this.camera.position,
            },
            mesh: Rngon.mesh(scene.ngons, {
                scale: Rngon.vector(25, 25, 25)
            })
        };
    },
    camera: undefined,
    numTicks: 0,
};
