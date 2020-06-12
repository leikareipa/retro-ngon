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

import {scene} from "./assets/models/scene.rngon-model.js";
import {first_person_camera} from "./camera.js";

const lights = [
    Rngon.light(Rngon.translation_vector(11, 45, -35)),
];

const camera = first_person_camera("canvas",
                                   {
                                       position: {x:-70, y:33, z:-7},
                                       direction: {x:7, y:90, z:0},
                                       movementSpeed: 0.05,
                                   });

scene.initialize();

export const sample_scene = (frameCount = 0)=>
{
    camera.update();

    // Assumes 'renderSettings' is a pre-defined global object from which the
    // renderer will pick up its settings.
    renderSettings.cameraDirection = camera.direction;
    renderSettings.cameraPosition = camera.position;

    // Move the light around in a circle.
    lights[0].position.x += (Math.cos(frameCount / 70) * 0.5);
    lights[0].position.z += (Math.sin(frameCount / 70) * 0.5);

    return Rngon.mesh(scene.ngons,
    {
        scaling: Rngon.scaling_vector(25, 25, 25)
    });
};

export const sampleRenderOptions = {
    lights: lights,
    shaderFunction: ({renderWidth, renderHeight, fragmentBuffer, pixelBuffer, ngonCache})=>
    {
        if (parent.ACTIVE_SHADER.function)
        {
            eval(`"use strict"; ${parent.ACTIVE_SHADER.function}({renderWidth, renderHeight, fragmentBuffer, pixelBuffer, ngonCache});`);
        }
    }
}

// Blurs every pixel whose n-gon doesn't have the material property 'isInFocus'
// set to true.
function shader_selective_blur({renderWidth, renderHeight, fragmentBuffer, pixelBuffer})
{
    const ngonCache = Rngon.internalState.transformedNgonsCache.ngons;

    for (let y = 0; y < renderHeight; y++)
    {
        for (let x = 0; x < renderWidth; x++)
        {
            const thisIdx = (x + y * renderWidth);
            const thisFragment = fragmentBuffer[thisIdx];
            const thisNgon = (thisFragment? ngonCache[thisFragment.polygonIdx] : null);

            if (!thisNgon || thisNgon.material.isInFocus)
            {
                continue;
            }

            const leftIdx   = ((x - 1) + (y - 1) * renderWidth);
            const topIdx    = ((x + 1) + (y - 1) * renderWidth);
            const rightIdx  = ((x + 1) + (y + 1) * renderWidth);
            const bottomIdx = ((x - 1) + (y + 1) * renderWidth);

            const leftFragment   = (fragmentBuffer[leftIdx]   || null);
            const topFragment    = (fragmentBuffer[topIdx]    || null);
            const rightFragment  = (fragmentBuffer[rightIdx]  || null);
            const bottomFragment = (fragmentBuffer[bottomIdx] || null);

            const leftNgon   = (leftFragment?   ngonCache[leftFragment.polygonIdx]   : null);
            const topNgon    = (topFragment?    ngonCache[topFragment.polygonIdx]    : null);
            const rightNgon  = (rightFragment?  ngonCache[rightFragment.polygonIdx]  : null);
            const bottomNgon = (bottomFragment? ngonCache[bottomFragment.polygonIdx] : null);

            let sumR = pixelBuffer[(thisIdx * 4) + 0];
            let sumG = pixelBuffer[(thisIdx * 4) + 1];
            let sumB = pixelBuffer[(thisIdx * 4) + 2];
            let numSamples = 1;

            if (leftNgon && !leftNgon.material.isInFocus)
            {
                sumR += pixelBuffer[(leftIdx * 4) + 0];
                sumG += pixelBuffer[(leftIdx * 4) + 1];
                sumB += pixelBuffer[(leftIdx * 4) + 2];
                numSamples++;
            }
            if (topNgon && !topNgon.material.isInFocus)
            {
                sumR += pixelBuffer[(topIdx * 4) + 0];
                sumG += pixelBuffer[(topIdx * 4) + 1];
                sumB += pixelBuffer[(topIdx * 4) + 2];
                numSamples++;
            }
            if (rightNgon && !rightNgon.material.isInFocus)
            {
                sumR += pixelBuffer[(rightIdx * 4) + 0];
                sumG += pixelBuffer[(rightIdx * 4) + 1];
                sumB += pixelBuffer[(rightIdx * 4) + 2];
                numSamples++;
            }
            if (bottomNgon && !bottomNgon.material.isInFocus)
            {
                sumR += pixelBuffer[(bottomIdx * 4) + 0];
                sumG += pixelBuffer[(bottomIdx * 4) + 1];
                sumB += pixelBuffer[(bottomIdx * 4) + 2];
                numSamples++;
            }

            const brightnessFactor = 1.1;
            pixelBuffer[(thisIdx * 4) + 0] = ((sumR / numSamples) * brightnessFactor);
            pixelBuffer[(thisIdx * 4) + 1] = ((sumG / numSamples) * brightnessFactor);
            pixelBuffer[(thisIdx * 4) + 2] = ((sumB / numSamples) * brightnessFactor);
        }
    }
}

// Draws a 1-pixel-thin outline over any pixel that lies on the edge of
// an n-gon whose material has the 'hasHalo' property set to true and
// which does not border another n-gon that has that property set.
function shader_selective_outline({renderWidth, renderHeight, fragmentBuffer, pixelBuffer, ngonCache})
{
    for (let y = 0; y < renderHeight; y++)
    {
        for (let x = 0; x < renderWidth; x++)
        {
            const bufferIdx = (x + y * renderWidth);
            const thisFragment = fragmentBuffer[bufferIdx];
            const ngon = (thisFragment? ngonCache[thisFragment.polygonIdx] : null);

            if (!ngon || !ngon.material.hasHalo)
            {
                continue;
            }

            let leftFragment   = (fragmentBuffer[((x - 1) + (y    ) * renderWidth)] || null);
            let topFragment    = (fragmentBuffer[((x    ) + (y - 1) * renderWidth)] || null);
            let rightFragment  = (fragmentBuffer[((x + 1) + (y    ) * renderWidth)] || null);
            let bottomFragment = (fragmentBuffer[((x    ) + (y + 1) * renderWidth)] || null);

            if (x == 0) leftFragment = null;
            if (y == 0) topFragment = null;
            if (x == (renderWidth - 1)) rightFragment = null;
            if (y == (renderHeight - 1)) bottomFragment = null;

            const leftNgon   = (leftFragment?   ngonCache[leftFragment.polygonIdx]   : null);
            const topNgon    = (topFragment?    ngonCache[topFragment.polygonIdx]    : null);
            const rightNgon  = (rightFragment?  ngonCache[rightFragment.polygonIdx]  : null);
            const bottomNgon = (bottomFragment? ngonCache[bottomFragment.polygonIdx] : null);

            if ((leftNgon   && !leftNgon.material.hasHalo   && (leftFragment.depth >= thisFragment.depth))   ||
                (topNgon    && !topNgon.material.hasHalo    && (topFragment.depth >= thisFragment.depth))    ||
                (rightNgon  && !rightNgon.material.hasHalo  && (rightFragment.depth >= thisFragment.depth))  ||
                (bottomNgon && !bottomNgon.material.hasHalo && (bottomFragment.depth >= thisFragment.depth)))
            {
                pixelBuffer[(bufferIdx * 4) + 0] = 255;
                pixelBuffer[(bufferIdx * 4) + 1] = 255;
                pixelBuffer[(bufferIdx * 4) + 2] = 0;
            }
        }
    }
}

// Converts into grayscale every pixel in the pixel buffer.
function shader_grayscale({renderWidth, renderHeight, fragmentBuffer, pixelBuffer})
{
    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const luminance = ((pixelBuffer[(i * 4) + 0] * 0.3) +
                           (pixelBuffer[(i * 4) + 1] * 0.59) +
                           (pixelBuffer[(i * 4) + 2] * 0.11));

        pixelBuffer[(i * 4) + 0] = luminance;
        pixelBuffer[(i * 4) + 1] = luminance;
        pixelBuffer[(i * 4) + 2] = luminance;
    }
}

function shader_normal({renderWidth, renderHeight, fragmentBuffer, pixelBuffer})
{
    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const x = fragmentBuffer[i].normalX;
        const y = fragmentBuffer[i].normalY;
        const z = fragmentBuffer[i].normalZ;

        pixelBuffer[(i * 4) + 0] = Math.abs(y * 255);
        pixelBuffer[(i * 4) + 1] = Math.abs(x * 255);
        pixelBuffer[(i * 4) + 2] = Math.abs(z * 255);
    }
}

function shader_world_position({renderWidth, renderHeight, fragmentBuffer, pixelBuffer})
{
    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const x = fragmentBuffer[i].worldX;
        const y = fragmentBuffer[i].worldY;
        const z = fragmentBuffer[i].worldZ;

        pixelBuffer[(i * 4) + 0] = Math.abs(y);
        pixelBuffer[(i * 4) + 1] = Math.abs(x);
        pixelBuffer[(i * 4) + 2] = Math.abs(z);
    }
}

function shader_uv({renderWidth, renderHeight, fragmentBuffer, pixelBuffer})
{
    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const u = fragmentBuffer[i].textureU;
        const v = fragmentBuffer[i].textureV;

        pixelBuffer[(i * 4) + 0] = Math.abs(v * 255);
        pixelBuffer[(i * 4) + 1] = Math.abs(u * 255);
        pixelBuffer[(i * 4) + 2] = 127;
    }
}

function shader_depth({renderWidth, renderHeight, fragmentBuffer, pixelBuffer})
{
    const {minDepth, maxDepth} = fragmentBuffer.reduce((minmax, fragment)=>
    {
        if (fragment.depth > minmax.maxDepth) minmax.maxDepth = fragment.depth;
        if (fragment.depth < minmax.minDepth) minmax.minDepth = fragment.depth;

        return minmax;
    }, {minDepth:Infinity, maxDepth:Number.NEGATIVE_INFINITY});

    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const depth = (((fragmentBuffer[i].depth - minDepth) / (maxDepth - minDepth)) * 255);

        pixelBuffer[(i * 4) + 0] = depth;
        pixelBuffer[(i * 4) + 1] = depth;
        pixelBuffer[(i * 4) + 2] = depth;
    }
}

function shader_reduce_color_fidelity({renderWidth, renderHeight, fragmentBuffer, pixelBuffer})
{
    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const reductionFactor = 50;

        pixelBuffer[(i * 4) + 0] = (~~(pixelBuffer[(i * 4) + 0] / reductionFactor) * reductionFactor);
        pixelBuffer[(i * 4) + 1] = (~~(pixelBuffer[(i * 4) + 1] / reductionFactor) * reductionFactor);
        pixelBuffer[(i * 4) + 2] = (~~(pixelBuffer[(i * 4) + 2] / reductionFactor) * reductionFactor);
    }
}

// Draws black all pixels on scanlines divisible by 2; except for pixels whose
// ngon has the material property 'hasNoScanlines' set to true.
function shader_selective_scanlines({renderWidth, renderHeight, fragmentBuffer, pixelBuffer, ngonCache})
{
    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const thisFragment = fragmentBuffer[i];
        const thisNgon = (thisFragment? ngonCache[thisFragment.polygonIdx] : null);

        if (!thisNgon || thisNgon.material.hasNoScanlines)
        {
            continue;
        }

        if (((~~(i / renderWidth)+1) % 2) == 0)
        {
            pixelBuffer[(i * 4) + 0] = 0;
            pixelBuffer[(i * 4) + 1] = 0;
            pixelBuffer[(i * 4) + 2] = 0;
        }
    }
}

// Draws a wireframe (outline) around each visible n-gon.
function shader_wireframe({renderWidth, renderHeight, fragmentBuffer, pixelBuffer, ngonCache})
{
    for (let y = 0; y < renderHeight; y++)
    {
        for (let x = 0; x < renderWidth; x++)
        {
            const bufferIdx = (x + y * renderWidth);
            const thisFragment = fragmentBuffer[bufferIdx];
            const thisNgon = (thisFragment? ngonCache[thisFragment.polygonIdx] : null);

            if (!thisNgon)
            {
                continue;
            }

            let leftFragment   = (fragmentBuffer[((x - 1) + (y    ) * renderWidth)] || null);
            let topFragment    = (fragmentBuffer[((x    ) + (y - 1) * renderWidth)] || null);
            let rightFragment  = (fragmentBuffer[((x + 1) + (y    ) * renderWidth)] || null);
            let bottomFragment = (fragmentBuffer[((x    ) + (y + 1) * renderWidth)] || null);

            if (x == 0) leftFragment = null;
            if (y == 0) topFragment = null;
            if (x == (renderWidth - 1)) rightFragment = null;
            if (y == (renderHeight - 1)) bottomFragment = null;

            if ((leftFragment   && (leftFragment.polygonIdx   != thisFragment.polygonIdx)) ||
                (topFragment    && (topFragment.polygonIdx    != thisFragment.polygonIdx)) ||
                (rightFragment  && (rightFragment.polygonIdx  != thisFragment.polygonIdx)) ||
                (bottomFragment && (bottomFragment.polygonIdx != thisFragment.polygonIdx)))
            {
                pixelBuffer[(bufferIdx * 4) + 0] = 148;
                pixelBuffer[(bufferIdx * 4) + 1] = 212;
                pixelBuffer[(bufferIdx * 4) + 2] = 212;
            }
        }
    }
}

function shader_per_pixel_light({renderWidth, renderHeight, fragmentBuffer, pixelBuffer, ngonCache})
{
    const light = Rngon.internalState.lights[0];
    const lightReach = (100 * 100);
    const lightIntensity = 2.5;
    const lightDirection = Rngon.vector3();
    const surfaceNormal = Rngon.vector3();

    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const thisFragment = fragmentBuffer[i];

        if (!thisFragment)
        {
            continue;
        }

        const distance = (((thisFragment.worldX - light.position.x) * (thisFragment.worldX - light.position.x)) +
                          ((thisFragment.worldY - light.position.y) * (thisFragment.worldY - light.position.y)) +
                          ((thisFragment.worldZ - light.position.z) * (thisFragment.worldZ - light.position.z)));
        const distanceMul = Math.max(0, Math.min(1, (1 - (distance / lightReach))));

        lightDirection.x = (light.position.x - thisFragment.worldX);
        lightDirection.y = (light.position.y - thisFragment.worldY);
        lightDirection.z = (light.position.z - thisFragment.worldZ);
        lightDirection.normalize();

        surfaceNormal.x = thisFragment.normalX;
        surfaceNormal.y = thisFragment.normalY;
        surfaceNormal.z = thisFragment.normalZ;

        const shadeMul = Math.max(0, Math.min(1, surfaceNormal.dot(lightDirection)));

        pixelBuffer[(i * 4) + 0] *= (distanceMul * shadeMul * lightIntensity);
        pixelBuffer[(i * 4) + 1] *= (distanceMul * shadeMul * lightIntensity);
        pixelBuffer[(i * 4) + 2] *= (distanceMul * shadeMul * lightIntensity);
    }
}
