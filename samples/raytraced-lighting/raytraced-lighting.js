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
 *    viewport. Vertex shaders, on the other hand, receive polygons in world space and
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
import {scene} from "./assets/scene.rngon-model.js";
import {bvh} from "./bvh.js";
import {ray} from "./ray.js";

export const sample = {
    initialize: async function()
    {
        this.camera = first_person_camera("canvas", {
            position: {x:-70, y:33, z:-7},
            direction: {x:7, y:90, z:0},
            movementSpeed: 0.05,
        });

        this.lights = [
            Rngon.light(Rngon.vector(11, 45, -35), {
                intensity: 20,
                clip: 1,
                attenuation: 1,
            }),
        ];

        // To allow shader functions access to the Rngon namespace.
        this.Rngon = Rngon;

        scene.initialize();
    },
    tick: function()
    {
        this.numTicks++;
        this.camera.update();

        // Once the vertex shader has finished building a list of the scene's world-space
        // polygons, we can build a BVH tree for the ray tracer.
        if (!this.sceneBVH && this.worldSpacePolys.length)
        {
            this.sceneBVH = bvh(this.worldSpacePolys);
        }

        // While ray tracing is disabled, we'll let the retro n-gon renderer use its
        // built-in vertex shading.
        for (const ngon of scene.ngons)
        {
            ngon.material.renderVertexShade = !parent.RAYTRACING_ENABLED;
        }

        // Move the light source around in a circle.
        this.lights[0].position.x += Math.cos(this.numTicks / 35);
        this.lights[0].position.z += Math.sin(this.numTicks / 35);
    
        return {
            renderOptions: {
                lights: this.lights,
                pixelShader: (
                    parent.RAYTRACING_ENABLED
                        ? ps_raytraced_lighting.bind(this)
                        : null
                ),
                useFragmentBuffer: parent.RAYTRACING_ENABLED,
                // We'll only copy the scene's polygons once. Once the BVH has been built,
                // we know the polygons have been copied and don't need to do it any more.
                vertexShader: this.sceneBVH? null : vs_copy_ngons.bind(this),
                cameraDirection: this.camera.direction,
                cameraPosition: this.camera.position,
            },
            mesh: Rngon.mesh(scene.ngons, {
                scaling: Rngon.vector(25, 25, 25)
            }),
        };
    },
    worldSpacePolys: [],
    sceneBVH: undefined,
    lights: undefined,
    camera: undefined,
    Rngon: undefined,
    numTicks: 0,
};

// A vertex shader that copies, one by one, the scene's world-space polygons into
// a list. This function gets called for each of the scene's n-gons.
function vs_copy_ngons(ngon)
{
    Rngon.assert?.(
        (ngon.vertices.length === 3),
        "Only triangles are supported."
    );
    
    const newNgon = Rngon.ngon([]);

    for (let v = 0; v < ngon.vertices.length; v++)
    {
        newNgon.vertices[v] = Rngon.vertex(
            ngon.vertices[v].x,
            ngon.vertices[v].y,
            ngon.vertices[v].z,
            ngon.vertices[v].u,
            ngon.vertices[v].v,
            ngon.vertices[v].w)
        ;
    }

    newNgon.material = ngon.material;
    newNgon.normal.x = ngon.normal.x;
    newNgon.normal.y = ngon.normal.y;
    newNgon.normal.z = ngon.normal.z;
    newNgon.isActive = true;
    newNgon.mipLevel = ngon.mipLevel;

    this.worldSpacePolys.push(newNgon);

    return;
}

// A pixel shader that shades each pixel based on whether and how the light source is
// visible to it.
function ps_raytraced_lighting({renderWidth, renderHeight, fragmentBuffer, pixelBuffer, ngonCache})
{
    // Defer shading until the scene's BVH has been built.
    if (!this.sceneBVH)
    {
        return;
    }

    const light = this.Rngon.state.active.lights[0];

    // Pre-create storage objects, so we don't need to keep re-creating them in the
    // render loop.
    const lightDirection = this.Rngon.vector();
    const pixelWorldPosition = this.Rngon.vector();

    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const thisFragment = fragmentBuffer[i];
        const thisNgon = (thisFragment? ngonCache[thisFragment.ngonIdx] : null);

        if (!thisNgon)
        {
            continue;
        }

        pixelWorldPosition.x = thisFragment.worldX;
        pixelWorldPosition.y = thisFragment.worldY;
        pixelWorldPosition.z = thisFragment.worldZ;

        // The pixel's world position is used as the ray's origin, so offset it to avoid
        // self-intersection.
        pixelWorldPosition.x += (thisNgon.normal.x * 0.00001);
        pixelWorldPosition.y += (thisNgon.normal.y * 0.00001);
        pixelWorldPosition.z += (thisNgon.normal.z * 0.00001);

        lightDirection.x = (light.position.x - thisFragment.worldX);
        lightDirection.y = (light.position.y - thisFragment.worldY);
        lightDirection.z = (light.position.z - thisFragment.worldZ);
        this.Rngon.vector.normalize(lightDirection);

        const lightDistance = Math.sqrt(((pixelWorldPosition.x - light.position.x) * (pixelWorldPosition.x - light.position.x)) +
                                        ((pixelWorldPosition.y - light.position.y) * (pixelWorldPosition.y - light.position.y)) +
                                        ((pixelWorldPosition.z - light.position.z) * (pixelWorldPosition.z - light.position.z)));
        
        const distanceMul = (1 / (1 + (light.attenuation * lightDistance)));

        const shadeMul = Math.max(0, Math.min(1, this.Rngon.vector.dot(thisNgon.normal, lightDirection)));

        // If distanceMul * shadeMul is <= 0, it means there's no light falling on this
        // pixel from the light source, and so we don't need to cast a light ray. Otherwise,
        // we cast a ray from this pixel toward the light's direction.
        const intersection = ((distanceMul * shadeMul > 0) &&
                              ray(pixelWorldPosition, lightDirection).intersect_bvh(this.sceneBVH, 1));

        // If the light ray intersects nothing or intersects something that's closer
        // than the light, it means light is prevented from reaching on this pixel.
        // (Technically, if the ray intersects nothing, it means there can be nothing
        // blocking the light from reaching the pixel, but for code simplicity we count
        // non-intersections as blocking.)
        if (!intersection ||
            (intersection.distance < lightDistance))
        {
            pixelBuffer[(i * 4) + 0] *= 0;
            pixelBuffer[(i * 4) + 1] *= 0;
            pixelBuffer[(i * 4) + 2] *= 0;
        }
        // Otherwise, at least some light is falling on this pixel, dependent on the
        // light's distance and incident angle.
        else
        {
            const shade = Math.min(light.clip, (shadeMul * distanceMul * light.intensity));
            
            pixelBuffer[(i * 4) + 0] *= shade;
            pixelBuffer[(i * 4) + 1] *= shade;
            pixelBuffer[(i * 4) + 2] *= shade;
        }
    }

    return;
}
