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

        Rngon.color.$bright = Rngon.color.white;
        Rngon.color.$dark =  Rngon.color(40, 40, 40);

        scene.initialize();
    },
    tick: function()
    {
        this.numTicks++;
        this.camera.update();

        if (this.isLightOn != parent.LIGHT_ON)
        {
            this.isLightOn = parent.LIGHT_ON;
            
            for (const mat of scene.materials)
            {
                mat.vertexShading = (parent.LIGHT_ON? "gouraud" : "none");
                mat.wireframeColor = (parent.LIGHT_ON? Rngon.color.$bright : Rngon.color.$dark);
            }
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
                lights: this.lights,
            },
        };
    },
    isLightOn: false,
    lights: [
        Rngon.light(36089, 2600, -33240, {intensity: 7000}),
        Rngon.light(39548, 2846, -31564, {intensity: 4000}),
        Rngon.light(44519, 2840, -31380, {intensity: 4000}),
        Rngon.light(53262, 1681, -28547, {intensity: 5000}),
        Rngon.light(58280, 1681, -28547, {intensity: 5000}),
    ],
    camera: undefined,
    numTicks: 0,
};
