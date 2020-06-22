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

let numFramesRendered = 0;

const camera = first_person_camera("canvas",
                                   {
                                       position: {x:-70, y:33, z:-7},
                                       direction: {x:7, y:90, z:0},
                                       movementSpeed: 0.05,
                                   });

scene.initialize();

export const sample_scene = (frameCount = 0)=>
{
    numFramesRendered = frameCount;

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
    get vertexShaderFunction()
    {
        // If the user has selected a shader to be used, return a function that calls
        // the selected shader.
        if (parent.ACTIVE_SHADER.function)
        {
            return (ngon, cameraPosition)=>
            {
                eval(`"use strict"; ${parent.ACTIVE_SHADER.function}(ngon, cameraPosition);`);
            }
        }
        // Otherwise, no shader is to be used, and we return null to signal to the
        // renderer that it should disable its shader functionality.
        else
        {
            return null;
        }
    }
}

// Darkens the shade of vertices based on their distance to the camera.
function shader_depth_fog(ngon, cameraPosition)
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

// Moves each vertex in the direction of its normal, causing the mesh to grow.
function shader_grow(ngon)
{
    if (ngon.material.isGrowing)
    {
        const growAmount = Math.sin(numFramesRendered / 16) * 5;

        for (let v = 0; v < ngon.vertices.length; v++)
        {
            ngon.vertices[v].x += (growAmount * ngon.vertexNormals[v].x);
            ngon.vertices[v].y += (growAmount * ngon.vertexNormals[v].y);
            ngon.vertices[v].z += (growAmount * ngon.vertexNormals[v].z);
        }
    }
}

// Moves vertices back and forth in a sine pattern.
function shader_wavy(ngon)
{
    //if (ngon.material.isWavy)
    {
        for (let v = 0; v < ngon.vertices.length; v++)
        {
            ngon.vertices[v].z += Math.sin(((ngon.vertices[v].y * 2) + numFramesRendered) / 8);
        }
    }
}

function shader_vertex_points(ngon)
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

function shader_fade_in_out(ngon)
{
    for (let v = 0; v < ngon.vertices.length; v++)
    {
        ngon.vertices[v].shade = (Math.sin(numFramesRendered / 64) + 1);
    }
}
