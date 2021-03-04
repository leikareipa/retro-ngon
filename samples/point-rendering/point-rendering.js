/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer / render sample
 * 
 * A render sample which showcases ray-traced lighting using pixel and vertex shaders.
 * 
 * NOTE: This sample only supports scenes made of triangles.
 * 
 * NOTE: This sample only supports static scenes.
 * 
 * 
 * Here's how it works:
 * 
 * 1. A vertex shader is used to build a complete list of the scene's world-space
 *    polygons.
 * 
 *    Although pixel shaders - which we'll use for the ray-tracing - also receive a list
 *    of the scene's polygons, the polygons will at that point have been clipped and
 *    culled against the viewport and so they don't represent the world outside of the
 *    viewport. Vertex shaders, on the other hand, receive polygons in object space and
 *    prior to clipping, so the entire scene is represented and compatible with
 *    world-space ray-tracing.
 * 
 * 2. A BVH tree is built out of the world's polygons. This helps speed up the ray-tracing.
 * 
 * 3. A ray-tracing pixel shader casts a ray from each pixel's world coordinates toward
 *    the light source. If the ray hits a polygon that's closer than the light source, we
 *    consider the pixel to be in full shadow. Otherwise, we'll shade the pixel based on
 *    its distance to the light source and the incident angle of the light.
 * 
 */

"use strict";

import {first_person_camera} from "../first-person-camera/camera.js";
import {teapot} from "./assets/teapot.rngon-model.js";

const camera = first_person_camera("canvas",
{
    position: {x:-70, y:33, z:-7},
    direction: {x:7, y:90, z:0},
    movementSpeed: 0.05,
});

teapot.initialize();

// Returns the n-gons of the scene to be rendered by the retro n-gon renderer.
// This function gets called by the renderer once per frame.
export const sample_scene = (frameCount = 0)=>
{
    camera.update();

    // Assumes 'renderSettings' is a pre-defined global object from which the
    // renderer will pick up its settings.
    renderSettings.cameraDirection = camera.direction;
    renderSettings.cameraPosition = camera.position;

    return Rngon.mesh(teapot.ngons,
    {
        rotation: Rngon.rotation_vector(90, 20, (0 + (frameCount / 2))),
        translation: Rngon.translation_vector(0, 15, -7),
        scaling: Rngon.scaling_vector(7, 7, 7)
    });
};

export const sampleRenderOptions = {
}
