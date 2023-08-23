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

        for (const mat of scene.materials)
        {
            mat.vertexShading = (parent.LIGHT_ON? "gouraud" : "none");
            mat.wireframeColor = (parent.LIGHT_ON? Rngon.color(255, 255, 255) : Rngon.color(40, 40, 40));
        }
    
        return {
            mesh: Rngon.mesh(scene.ngons),
            renderOptions: {
                useDepthBuffer: false,
                cameraDirection: this.camera.direction,
                cameraPosition: this.camera.position,
                nearPlane: 100,
                farPlane: 40000,
                fov: 55,
                lights: [
                    Rngon.light(7000, Rngon.vector(36089, 2600, -33240)),
                    Rngon.light(4000, Rngon.vector(39548, 2846, -31564)),
                    Rngon.light(4000, Rngon.vector(44519, 2840, -31380)),
                    Rngon.light(5000, Rngon.vector(53262, 1681, -28547)),
                    Rngon.light(5000, Rngon.vector(58280, 1681, -28547)),
                ],
            },
        };
    },
    camera: undefined,
    numTicks: 0,
};
