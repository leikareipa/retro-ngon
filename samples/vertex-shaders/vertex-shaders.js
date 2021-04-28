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
                vertexShader: parent.ACTIVE_SHADER.function
                              ? parent.ACTIVE_SHADER.function.bind(this)
                              : null,
                cameraDirection: this.camera.direction,
                cameraPosition: this.camera.position,
            },
            mesh: Rngon.mesh(scene.ngons, {
                scaling: Rngon.scaling_vector(25, 25, 25)
            }),
        };
    },
    shaders: [
        {title:"None",          function:null},
        {title:"Distance fog",  function:vs_depth_fog},
        {title:"Grow",          function:vs_grow},
        {title:"Wave",          function:vs_wavy},
        {title:"UV shift",      function:vs_uv_shift},
        {title:"Fade in/out",   function:vs_fade_in_out},
        {title:"Vertex points", function:vs_vertex_points},
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

// Vertex shader. Reduces each n-gon to one vertex, located in the middle of the n-gon's
// original vertices.
function vs_vertex_points(ngon)
{
    if (ngon.material.isPointCloud)
    {
        let [midX, midY, midZ] = ngon.vertices.reduce((values, vertex)=>
        {
            values[0] += vertex.x;
            values[1] += vertex.y;
            values[2] += vertex.z;
            return values;
        }, [0, 0, 0]);

        midX /= ngon.vertices.length;
        midY /= ngon.vertices.length;
        midZ /= ngon.vertices.length;

        ngon.vertices.length = 1;
        ngon.vertices[0].x = midX;
        ngon.vertices[0].y = midY;
        ngon.vertices[0].z = midZ;
    }
}

// Vertex shader.
function vs_fade_in_out(ngon)
{
    for (let v = 0; v < ngon.vertices.length; v++)
    {
        ngon.vertices[v].shade = (Math.sin(this.numTicks / 64) + 1);
    }
}

// Vertex shader.
function vs_uv_shift(ngon)
{
    for (let v = 0; v < ngon.vertices.length; v++)
    {
        ngon.vertices[v].v += (this.numTicks / 1500);
    }
}
