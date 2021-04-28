/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer / render sample
 * 
 */

"use strict";

import {scene} from "./assets/scene.rngon-model.js";
import {first_person_camera} from "../first-person-camera/camera.js";

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
                get targetRefreshRate() {
                    return parent.REFRESH_RATE;
                },
                cameraDirection: this.camera.direction,
                cameraPosition: this.camera.position,
            },
            mesh: Rngon.mesh(scene.ngons, {
                scaling: Rngon.scaling_vector(25, 25, 25)
            })
        };
    },
    camera: undefined,
    numTicks: 0,
};
