/*
 * 2020, 2021 Tarpeeksi Hyvae Soft
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
                cameraDirection: this.camera.direction,
                cameraPosition: this.camera.position,
            },
            renderPipeline: {
                vertexShader: (
                    (parent.SHADER_PIPELINE_ENABLED && parent.ACTIVE_SHADER.function)
                        ? parent.ACTIVE_SHADER.function.bind(this)
                        : null
                ),
            },
            mesh: Rngon.mesh(scene.ngons, {
                scaling: Rngon.vector(25, 25, 25)
            }),
        };
    },
    shaders: [
        {title:"Bend",          function:vs_bendy},
        {title:"Glitch",        function:vs_glitchy},
        {title:"Shear",         function:vs_shear},
        {title:"Distance fog",  function:vs_depth_fog},
        {title:"Grow",          function:vs_grow},
        {title:"Wave",          function:vs_wavy},
        {title:"UV shift",      function:vs_uv_shift},
        {title:"Fade in/out",   function:vs_fade_in_out},
    ],
    camera: undefined,
    numTicks: 0,
};

// Vertex shader. Darkens the shade of vertices based on their distance from the camera.
function vs_depth_fog(ngon, cameraPosition)
{
    const maxDistance = (200 * 200);

    for (let v = 0; v < ngon.vertices.length; v++)
    {
        const distance = (((ngon.vertices[v].x - cameraPosition.x) * (ngon.vertices[v].x  - cameraPosition.x)) +
                          ((ngon.vertices[v].y - cameraPosition.y) * (ngon.vertices[v].y  - cameraPosition.y)) +
                          ((ngon.vertices[v].z - cameraPosition.z) * (ngon.vertices[v].z  - cameraPosition.z)));

        ngon.vertices[v].shade = (Math.max(0, Math.min(1 - (distance / maxDistance))) * 1.5);
    }
}

// Vertex shader. Moves each vertex in the direction of its normal, causing the mesh to grow.
function vs_grow(ngon)
{
    if (ngon.material.isGrowing)
    {
        const growAmount = Math.sin(this.numTicks / 16) * 5;

        for (let v = 0; v < ngon.vertices.length; v++)
        {
            ngon.vertices[v].x += (growAmount * ngon.vertexNormals[v].x);
            ngon.vertices[v].y += (growAmount * ngon.vertexNormals[v].y);
            ngon.vertices[v].z += (growAmount * ngon.vertexNormals[v].z);
        }
    }
}

// Vertex shader. Moves vertices back and forth in a wave pattern.
function vs_wavy(ngon)
{
    for (let v = 0; v < ngon.vertices.length; v++)
    {
        ngon.vertices[v].z += Math.sin(((ngon.vertices[v].y * 2) + this.numTicks) / 8);
    }
}

// Vertex shader. Makes the n-gon pulsate between light and dark. When applied to all
// n-gons in the scene, will fade the screen in and out.
function vs_fade_in_out(ngon)
{
    for (let v = 0; v < ngon.vertices.length; v++)
    {
        ngon.vertices[v].shade = (Math.sin(this.numTicks / 64) + 1);
    }
}

// Vertex shader. Shifts UV coordinates to cause a 'swimming' effect.
function vs_uv_shift(ngon)
{
    for (let v = 0; v < ngon.vertices.length; v++)
    {
        ngon.vertices[v].v += (this.numTicks / 1500);
    }
}

// Vertex shader. Scales vertices based on their height (Y value), creating a tapered, bendy effect.
function vs_bendy(ngon)
{
    const taperFactor = ((Math.sin(this.numTicks / 75)) * 0.004);

    for (let v = 0; v < ngon.vertices.length; v++)
    {
        const scaleFactor = (1 + (ngon.vertices[v].y - 0.5) * taperFactor);
        ngon.vertices[v].x *= scaleFactor;
        ngon.vertices[v].z *= scaleFactor;
    }
}

// Vertex shader. Randomly jitter vertices, simulating noise.
function vs_glitchy(ngon)
{
    if (this.numTicks % 15 !== 0)
    {
        return;
    }

    const noiseFactor = 0.3;

    for (let v = 0; v < ngon.vertices.length; v++)
    {
        ngon.vertices[v].x += ((Math.random() * 2 - 1) * noiseFactor);
        ngon.vertices[v].y += ((Math.random() * 2 - 1) * noiseFactor);
        ngon.vertices[v].z += ((Math.random() * 2 - 1) * noiseFactor);
    }
}

// Vertex shader. Shear the mesh along the X axis based on Y position.
function vs_shear(ngon)
{
    const shearFactor = 0.5;

    for (let v = 0; v < ngon.vertices.length; v++)
    {
        const yOffset = (ngon.vertices[v].y - 0.5) * 2;
        ngon.vertices[v].x += yOffset * shearFactor;
    }
}
