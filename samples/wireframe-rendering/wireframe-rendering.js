/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer / render sample
 * 
 */

"use strict";

import {first_person_camera} from "../first-person-camera/camera.js";
import {scene} from "./assets/home.rngon-model.js";

export const sample = {
    initialize: function()
    {
        this.camera = first_person_camera("canvas", {
            position: {x: 40000, y: 2450, z: -32229},
            direction: {x:5, y:180, z:0},
            movementSpeed: 1.8,
        });

        scene.initialize();
    },
    tick: function()
    {
        this.numTicks++;
        this.camera.update();
    
        return {
            mesh: Rngon.mesh(scene.ngons),
            renderOptions: {
                cameraDirection: this.camera.direction,
                cameraPosition: this.camera.position,
                nearPlane: 100,
                farPlane: 40000,
                fov: 55,
            },
        };
    },
    camera: undefined,
    numTicks: 0,
};
