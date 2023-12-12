/*
 * 2022 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer / render sample
 * 
 * A render sample that applies path tracing to a rasterized image using pixel and
 * vertex shaders. The sample makes use of the Wray path tracing library
 * (https://github.com/leikareipa/wray).
 * 
 * Note: This sample only supports triangular meshes and static scenes.
 * 
 * How it works:
 * 
 *   1. A vertex shader is used to build a complete list of the scene's world-space
 *      polygons.
 * 
 *      Although pixel shaders - which we'll use for the path tracing - also receive a list
 *      of the scene's polygons, the polygons will at that point have been clipped and
 *      culled against the viewport, so they don't represent the world as seen from outside
 *      of the viewport (i.e. by a ray bouncing around the scenery). Vertex shaders, on the
 *      other hand, receive polygons in world space and prior to clipping.
 * 
 *   2. A BVH tree is built out of the world's polygons. This helps speed up the tracing.
 * 
 *   3. A path-tracing pixel shader casts a ray from each rasterized pixel's world coordinates
 *      along a random path around the scenery. Light contributions from these rays accumulated
 *      over many samplings are averaged and written into the pixel buffer.
 * 
 */

"use strict";

import {first_person_camera} from "../first-person-camera/camera.js";
import {cornellBox} from "./assets/cornell-box.rngon-model.js";
import {Wray} from "./wray.js";

export const sample = {
    initialize: async function()
    {
        this.Rngon = Rngon;
        
        Wray.maxRayDepth = 5;
        Wray.epsilon = 0.0001;
        Wray.sky.sampler = Wray.sky.cie_overcast(Wray.vector3(0, 0, 1), 1);

        this.camera = first_person_camera("canvas", {
            position: {x:0, y:-2, z:2.79},
            direction: {x:110, y:0, z:0},
            allowPointerLock: false,
        });

        cornellBox.initialize();

        // Reset the accumulation buffer if the user changes the render scale.
        new MutationObserver(this.reset_accumulation_buffer.bind(this))
            .observe(document.querySelector(".infobox.scale"), {childList:true, subtree:true});
    },
    tick: function()
    {
        this.numTicks++;
        this.camera.update();

        // The accumulation buffer needs to be reset if the size of the rendering changes,
        // since otherwise the pixels in the buffer won't match the raster buffer's pixels.
        if (
            Rngon.context.default.pixelBuffer &&
            ((Rngon.context.default.pixelBuffer.width != this.latestRenderResolution.width) ||
             (Rngon.context.default.pixelBuffer.height != this.latestRenderResolution.height))
        ){
            this.latestRenderResolution.width = Rngon.context.default.pixelBuffer.width;
            this.latestRenderResolution.height = Rngon.context.default.pixelBuffer.height;
            this.reset_accumulation_buffer();
        }

        // Once the scene's n-gons have been loaded and path tracing enabled, build a BVH
        // of the scene for the path tracer to use.
        if (
            parent.PATH_TRACING_ENABLED &&
            this.worldSpaceMesh.length &&
            !this.sceneBVH
        ){
            this.sceneBVH = Wray.bvh(this.worldSpaceMesh);
        }
        // Otherwise, we'll keep generating an up-to-date list of the scene's world-space
        // polygons during each render pass.
        else if (!this.sceneBVH)
        {
            this.worldSpaceMesh = [];
        }

        return {
            mesh: Rngon.mesh(cornellBox.ngons),
            renderOptions: {
                nearPlane: 0.1,
                useFullInterpolation: true,
                cameraDirection: this.camera.direction,
                cameraPosition: this.camera.position,
                useFragmentBuffer: Boolean(parent.PATH_TRACING_ENABLED && this.sceneBVH),
                fragments: {
                    ngon: true,
                    worldX: true,
                    worldY: true,
                    worldZ: true,
                },
            },
            renderPipeline: {
                vertexShader: (
                    !this.sceneBVH
                        ? vs_copy_ngons.bind(this)
                        : undefined
                ),
                pixelShader: (
                    (parent.PATH_TRACING_ENABLED && this.sceneBVH)
                        ? ps_path_trace.bind(this)
                        : undefined
                ),
            },
        };
    },
    reset_accumulation_buffer: function()
    {
        this.accumulationBuffer = [];
    },

    // The scene's polygons in world space, prior to any vertex transformations for
    // rasterization. We'll use this world-space mesh to trace rays against.
    worldSpaceMesh: [],

    // A pixel buffer in which we'll store the raw color data we get from tracing rays.
    accumulationBuffer: [],

    // A bounding volume hierarchy built on the scene's mesh, to accelerate ray tracing.
    sceneBVH: undefined,

    camera: undefined,

    // To allow shader functions access to the Rngon namespace.
    Rngon: undefined,

    latestRenderResolution: {
        width: 0,
        height: 0,
    },

    numTicks: 0,
};

// A vertex shader that copies the scene's world-space polygons into an array. This function
// gets called individually for each of the scene's n-gons by the retro n-gon renderer prior
// to viewport clipping, screen-space transformation etc.
function vs_copy_ngons(ngon)
{
    console.assert?.(
        (ngon.vertices.length === 3),
        "Only triangles are supported."
    );

    const wrayVertices = ngon.vertices.map(v=>Wray.vertex(Wray.vector3(v.x, v.y, v.z)));
    const wrayMaterial = (
        ngon.material.isEmissive?
            Wray.material.emissive(
                10,
                Wray.color_rgb(
                    ngon.material.color.unitRange.red,
                    ngon.material.color.unitRange.green,
                    ngon.material.color.unitRange.blue
                )
            )
        : Wray.material.lambertian(
              Wray.color_rgb(
                ngon.material.color.unitRange.red,
                ngon.material.color.unitRange.green,
                ngon.material.color.unitRange.blue
             )
         )
    );

    this.worldSpaceMesh.push(Wray.triangle(wrayVertices, wrayMaterial));

    return;
}

// A pixel shader to shade each pixel based on path-traced rays' light contributions.
function ps_path_trace(renderContext)
{
    const {width, height, data:pixels} = renderContext.pixelBuffer;
    const fragments = renderContext.fragmentBuffer.data;

    for (let i = 0; i < (width * height); i++)
    {
        const thisFragment = fragments[i];
        const thisNgon = thisFragment.ngon;

        if (!thisNgon)
        {
            continue;
        }

        const initialRayOrigin = Wray.vector3(
            thisFragment.worldX,
            thisFragment.worldY,
            thisFragment.worldZ
        );

        const normalAtRayOrigin = Wray.vector3(
            thisNgon.normal.x,
            thisNgon.normal.y,
            thisNgon.normal.z
        );

        if (!this.accumulationBuffer[i])
        {
            this.accumulationBuffer[i] = {
                red: 0,
                green: 0,
                blue: 0,
                numSamples: 0,
            };
        }
        
        const accumulation = this.accumulationBuffer[i];

        for (let samples = 0; samples < 1; samples++)
        {
            const inLight =
                Wray.ray(initialRayOrigin)
                .step(Wray.epsilon, normalAtRayOrigin)
                .aimAt.random_in_hemisphere_cosine_weighted(normalAtRayOrigin)
                .trace(this.sceneBVH, 1);

            accumulation.red += inLight.red;
            accumulation.green += inLight.green;
            accumulation.blue += inLight.blue;
            accumulation.numSamples++;
        }

        pixels[(i * 4) + 0] *= (accumulation.red / accumulation.numSamples);
        pixels[(i * 4) + 1] *= (accumulation.green / accumulation.numSamples);
        pixels[(i * 4) + 2] *= (accumulation.blue / accumulation.numSamples);
    }

    return;
}
