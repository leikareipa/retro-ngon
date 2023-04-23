/*
 * 2020 Tarpeeksi Hyvae Soft
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

        this.lights = [
            Rngon.light(Rngon.vector(11, 45, -35), {
                intensity: 70,
                clip: 1,
                attenuation: 1,
            }),
        ];

        // To allow the pixel shader functions access to the Rngon namespace.
        this.Rngon = Rngon;

        scene.initialize();
    },
    tick: function()
    {
        this.numTicks++;
        this.camera.update();

        // Move the light around in a circle.
        this.lights[0].position.x += (Math.cos(this.numTicks / 70) * 0.5);
        this.lights[0].position.z += (Math.sin(this.numTicks / 70) * 0.5);

        return {
            renderOptions: {
                lights: this.lights,
                // We use .bind() on the shader functions passed to the renderer, which
                // makes the renderer unable to determine whether the shaders use the
                // fragment buffer, so we need to manually inform it. We could just set
                // this to 'true' always, but there's a performance gain in not using
                // the fragment buffer when it's not needed.
                useFragmentBuffer: (
                    parent.ACTIVE_SHADER.function
                        ? parent.ACTIVE_SHADER.function.toString().match(/{(.+)?}/)[1].includes("fragmentBuffer")
                        : false
                ),
                cameraDirection: this.camera.direction,
                cameraPosition: this.camera.position,
            },
            renderPipeline: {
                pixelShader: (
                    (parent.SHADER_PIPELINE_ENABLED && parent.ACTIVE_SHADER.function)
                        ? Object.assign(parent.ACTIVE_SHADER.function.bind(this), parent.ACTIVE_SHADER.function)
                        : null
                ),
                // For the mip level map shader to work, we need to enable mipmapping.
                // So when that shader is in use, let's set n-gon's mipmap level based
                // on its distance to the camera.
                vertexShader: (
                    (parent.ACTIVE_SHADER.title !== "Mip level map")
                        ? null
                        : (ngon, cameraPosition)=>{
                            const maxDistance = (300 * 300);

                            const distance = (
                                ((ngon.vertices[0].x - cameraPosition.x) * (ngon.vertices[0].x - cameraPosition.x)) +
                                ((ngon.vertices[0].y - cameraPosition.y) * (ngon.vertices[0].y - cameraPosition.y)) +
                                ((ngon.vertices[0].z - cameraPosition.z) * (ngon.vertices[0].z - cameraPosition.z))
                            );

                            ngon.mipLevel = Math.max(0, Math.min(0.25, (distance / maxDistance)));
                        }
                ),
            },
            mesh: this.Rngon.mesh(scene.ngons, {
                scaling: this.Rngon.vector(25, 25, 25)
            }),
        };
    },
    shaders: [
        {title:"Dithering",              function:ps_dithering},
        {title:"Edge anti-aliasing",     function:ps_fxaa},
        {title:"Bloom",                  function:ps_bloom},
        {title:"Vignette",               function:ps_vignette},
        {title:"Depth desaturation",     function:ps_depth_desaturate},
        {title:"Distance fog",           function:ps_distance_fog},
        {title:"Waviness",               function:ps_waviness},
        {title:"Fisheye",                function:ps_fisheye_projection},
        {title:"Aberration",             function:ps_aberration},
        {title:"CRT",                    function:ps_crt_effect},
        {title:"Selective outline",      function:ps_selective_outline},
        {title:"Selective grayscale",    function:ps_selective_grayscale},
        {title:"Per-pixel lighting",     function:ps_per_pixel_light},
        {title:"Wireframe",              function:ps_wireframe},
        {title:"Texture blend",          function:ps_texture_blend},
        {title:"Vertex positions",       function:ps_vertex_positions_map},
        {title:"Normal map",             function:ps_normal_map},
        {title:"UV map",                 function:ps_uv_map},
        {title:"Coordinate map",         function:ps_world_position_map},
        {title:"Depth map",              function:ps_depth_map},
        {title:"Shade map",              function:ps_shade_map},
        {title:"Mip level map",          function:ps_mip_level_map},
    ],
    lights: undefined,
    camera: undefined,
    Rngon: undefined,
    numTicks: 0,
};

function ps_bloom({renderWidth, renderHeight, pixelBuffer})
{
    const brightnessThreshold = 0.3;

    // Create a bloom layer by high-passing and blurring a copy of the rendered image.
    const bloomLayer = new Uint8ClampedArray(pixelBuffer);
    for (let i = 0; i < bloomLayer.length; i += 4) {
        const r = bloomLayer[i];
        const g = bloomLayer[i + 1];
        const b = bloomLayer[i + 2];
        const brightness = (r + g + b) / (3 * 255);

        if (brightness < brightnessThreshold) {
            bloomLayer[i] = bloomLayer[i + 1] = bloomLayer[i + 2] = 0;
        }
    }
    stackBlur(bloomLayer, renderWidth, renderHeight);

    // Blend the blurred bloom image with the rendering.
    for (let i = 0; i < pixelBuffer.length; i += 4) {
        pixelBuffer[i] += bloomLayer[i];
        pixelBuffer[i + 1] += bloomLayer[i+1];
        pixelBuffer[i + 2] += bloomLayer[i+2];
    }

    function stackBlur(pixels, width, height, radius = 8) {
        // Horizontal.
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let sumR = 0;
                let count = 0;

                for (let i = -radius; i <= radius; i++) {
                    const newX = x + i;
                    if (newX >= 0 && newX < width) {
                        const index = (y * width + newX) * 4;
                        sumR += pixels[index];
                        count++;
                    }
                }

                const index = (y * width + x) * 4;
                pixels[index] = sumR / count;
                pixels[index + 1] = sumR / count;
                pixels[index + 2] = sumR / count;
            }
        }

        // Vertical.
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                let sumR = 0;
                let count = 0;

                for (let i = -radius; i <= radius; i++) {
                    const newY = y + i;
                    if (newY >= 0 && newY < height) {
                        const index = (newY * width + x) * 4;
                        sumR += pixels[index];
                        count++;
                    }
                }

                const index = (y * width + x) * 4;
                pixels[index] = sumR / count;
                pixels[index + 1] = sumR / count;
                pixels[index + 2] = sumR / count;
            }
        }
    }
}

function ps_crt_effect({renderWidth, renderHeight, pixelBuffer})
{
    const sourceBuffer = new Uint8Array(pixelBuffer.length);
    sourceBuffer.set(pixelBuffer);
    
    const curvature = 0.05;
    const scaleX = 1;
    const scaleY = 1;
    const colorSoftening = 2;
    const scanlineIntensity = 0.1;
    
    const centerX = (renderWidth / 2);
    const centerY = (renderHeight / 2);
    
    for (let y = 0; y < renderHeight; y++)
    {
        for (let x = 0; x < renderWidth; x++)
        {
            const bufferIdx = ((x + y * renderWidth) * 4);
    
            // Barrel distortion.
            {
                // Normalize the coordinates to -1, 1 range
                const normX = ((x - centerX) / centerX);
                const normY = ((y - centerY) / centerY);

                const radius = Math.sqrt(normX * normX + normY * normY);
                const barrelFactor = (1 + curvature * radius * radius);
                const barrelX = normX * barrelFactor;
                const barrelY = normY * barrelFactor;
        
                // Denormalize the coordinates
                const sourceX = Math.round((barrelX * centerX / scaleX) + centerX);
                const sourceY = Math.round((barrelY * centerY / scaleY) + centerY);
        
                // Check if the source pixel is within bounds
                if (sourceX >= 0 && sourceX < renderWidth && sourceY >= 0 && sourceY < renderHeight)
                {
                    // Copy the source pixel color
                    const sourceIdx = (sourceX + sourceY * renderWidth) * 4;
                    pixelBuffer[bufferIdx + 0] = sourceBuffer[sourceIdx + 0];
                    pixelBuffer[bufferIdx + 1] = sourceBuffer[sourceIdx + 1];
                    pixelBuffer[bufferIdx + 2] = sourceBuffer[sourceIdx + 2];
                }
                else
                {
                    // Set the pixel to black if it's out of bounds
                    pixelBuffer[bufferIdx + 0] = 0;
                    pixelBuffer[bufferIdx + 1] = 0;
                    pixelBuffer[bufferIdx + 2] = 0;
                }
            }

            // Scanlines.
            const scanlineFactor = ((y % 2 === 0)? (1 - scanlineIntensity) : 1);

            // Color softening.
            const r = Math.min(pixelBuffer[bufferIdx] * colorSoftening, 255);
            const g = Math.min(pixelBuffer[bufferIdx + 1] * colorSoftening, 255);
            const b = Math.min(pixelBuffer[bufferIdx + 2] * colorSoftening, 255);

            pixelBuffer[bufferIdx] = (r * scanlineFactor);
            pixelBuffer[bufferIdx + 1] = (g * scanlineFactor);
            pixelBuffer[bufferIdx + 2] = (b * scanlineFactor);
        }
    }
}

// Pixel shader. Applies a dithering effect to the rendered image.
function ps_dithering({renderWidth, renderHeight, pixelBuffer})
{
    const ditherMatrix = [
        [ 1, 9, 3, 11 ],
        [ 13, 5, 15, 7 ],
        [ 4, 12, 2, 10 ],
        [ 16, 8, 14, 6 ]
    ];

    const ditherLevels = 16; // Number of color levels after dithering
    const ditherScaleFactor = (255 / (ditherLevels - 1));

    for (let y = 0; y < renderHeight; y++)
    {
        for (let x = 0; x < renderWidth; x++)
        {
            const bufferIdx = (x + y * renderWidth) * 4;

            for (let channel = 0; channel < 3; channel++)
            {
                // Calculate the threshold for the current pixel position
                const ditherThreshold = (ditherMatrix[y % 4][x % 4] / 17);

                // Get the original pixel color value and normalize it to the range [0, 1]
                const originalValue = (pixelBuffer[bufferIdx + channel] / 255);

                // Quantize the pixel color value using ditherLevels
                const quantizedValue = Math.round((originalValue * (ditherLevels - 1)) + ditherThreshold);

                // Scale the quantized value back to the range [0, 255] and set it as the new pixel color
                pixelBuffer[bufferIdx + channel] = Math.round(quantizedValue * ditherScaleFactor);
            }
        }
    }
}

// Pixel shader. Blurs every pixel whose n-gon doesn't have the material property 'isInFocus'
// set to true.
function ps_selective_blur({renderWidth, renderHeight, fragmentBuffer, pixelBuffer, ngonCache})
{
    // We'll loop a couple of times to increase the level of blurring.
    for (let loop = 0; loop < 3; loop++)
    {
        for (let y = 0; y < renderHeight; y++)
        {
            for (let x = 0; x < renderWidth; x++)
            {
                const thisIdx = (x + y * renderWidth);
                const thisFragment = fragmentBuffer[thisIdx];
                const thisNgon = (thisFragment? ngonCache[thisFragment.ngonIdx] : null);

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

                const leftNgon   = (leftFragment?   ngonCache[leftFragment.ngonIdx]   : null);
                const topNgon    = (topFragment?    ngonCache[topFragment.ngonIdx]    : null);
                const rightNgon  = (rightFragment?  ngonCache[rightFragment.ngonIdx]  : null);
                const bottomNgon = (bottomFragment? ngonCache[bottomFragment.ngonIdx] : null);

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
}

// Pixel shader. Draws a 1-pixel-thin outline over any pixel that lies on the edge of
// an n-gon whose material has the 'hasHalo' property set to true and which does not
// border another n-gon that has that property set.
function ps_selective_outline({renderWidth, renderHeight, fragmentBuffer, pixelBuffer, ngonCache})
{
    for (let y = 0; y < renderHeight; y++)
    {
        for (let x = 0; x < renderWidth; x++)
        {
            const bufferIdx = (x + y * renderWidth);
            const thisFragment = fragmentBuffer[bufferIdx];
            const ngon = (thisFragment? ngonCache[thisFragment.ngonIdx] : null);

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

            const leftNgon   = (leftFragment?   ngonCache[leftFragment.ngonIdx]   : null);
            const topNgon    = (topFragment?    ngonCache[topFragment.ngonIdx]    : null);
            const rightNgon  = (rightFragment?  ngonCache[rightFragment.ngonIdx]  : null);
            const bottomNgon = (bottomFragment? ngonCache[bottomFragment.ngonIdx] : null);

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

// Pixel shader. Converts into grayscale every pixel in the pixel buffer.
function ps_selective_grayscale({renderWidth, renderHeight, fragmentBuffer, pixelBuffer, ngonCache})
{
    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const thisFragment = fragmentBuffer[i];
        const thisNgon = (thisFragment? ngonCache[thisFragment.ngonIdx] : null);

        if (!thisNgon || thisNgon.material.isNeverGrayscale)
        {
            continue;
        }

        const luminance = ((pixelBuffer[(i * 4) + 0] * 0.3) +
                           (pixelBuffer[(i * 4) + 1] * 0.59) +
                           (pixelBuffer[(i * 4) + 2] * 0.11));

        pixelBuffer[(i * 4) + 0] = luminance;
        pixelBuffer[(i * 4) + 1] = luminance;
        pixelBuffer[(i * 4) + 2] = luminance;
    }
}

// Pixel shader.
function ps_shade_map({renderWidth, renderHeight, fragmentBuffer, pixelBuffer})
{
    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const shade = (fragmentBuffer[i].shade * 255);

        pixelBuffer[(i * 4) + 0] = shade;
        pixelBuffer[(i * 4) + 1] = shade;
        pixelBuffer[(i * 4) + 2] = shade;
    }
}

// Pixel shader.
function ps_normal_map({renderWidth, renderHeight, fragmentBuffer, pixelBuffer, ngonCache})
{
    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const thisFragment = fragmentBuffer[i];
        const thisNgon = (thisFragment? ngonCache[thisFragment.ngonIdx] : null);

        if (!thisNgon)
        {
            continue;
        }

        pixelBuffer[(i * 4) + 0] = Math.abs(thisNgon.normal.x * 255);
        pixelBuffer[(i * 4) + 1] = Math.abs(thisNgon.normal.y * 255);
        pixelBuffer[(i * 4) + 2] = Math.abs(thisNgon.normal.z * 255);
    }
}

// Pixel shader.
function ps_world_position_map({renderWidth, renderHeight, fragmentBuffer, pixelBuffer})
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

// Pixel shader.
function ps_uv_map({renderWidth, renderHeight, fragmentBuffer, pixelBuffer, ngonCache})
{
    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const thisFragment = fragmentBuffer[i];
        const thisNgon = (thisFragment? ngonCache[thisFragment.ngonIdx] : null);

        if (!thisNgon)
        {
            continue;
        }

        let u = fragmentBuffer[i].textureUScaled;
        let v = fragmentBuffer[i].textureVScaled;
        const texture = (thisNgon.material.texture || null);

        // Take the scaled UV coordinates back into the [0,1] range.
        if (texture)
        {
            u /= texture.width;
            v /= texture.height;
        }

        pixelBuffer[(i * 4) + 0] = (v * 255);
        pixelBuffer[(i * 4) + 1] = (u * 255);
        pixelBuffer[(i * 4) + 2] = 127;
    }
}

// Pixel shader.
function ps_depth_map({renderWidth, renderHeight, fragmentBuffer, pixelBuffer})
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

// Pixel shader.
function ps_reduce_color_fidelity({renderWidth, renderHeight, pixelBuffer})
{
    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const reductionFactor = 30;

        pixelBuffer[(i * 4) + 0] = (~~(pixelBuffer[(i * 4) + 0] / reductionFactor) * reductionFactor);
        pixelBuffer[(i * 4) + 1] = (~~(pixelBuffer[(i * 4) + 1] / reductionFactor) * reductionFactor);
        pixelBuffer[(i * 4) + 2] = (~~(pixelBuffer[(i * 4) + 2] / reductionFactor) * reductionFactor);
    }
}

// Pixel shader Draws black all pixels on scanlines divisible by 2; except for pixels
// whose ngon has the material property 'hasNoScanlines' set to true.
function ps_selective_scanlines({renderWidth, renderHeight, fragmentBuffer, pixelBuffer, ngonCache})
{
    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const thisFragment = fragmentBuffer[i];
        const thisNgon = (thisFragment? ngonCache[thisFragment.ngonIdx] : null);

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

// Pixel shader. Draws a wireframe (outline) around each visible n-gon.
function ps_wireframe({renderWidth, renderHeight, fragmentBuffer, pixelBuffer})
{
    for (let y = 0; y < renderHeight; y++)
    {
        for (let x = 0; x < renderWidth; x++)
        {
            const bufferIdx = (x + y * renderWidth);
            const thisFragment = fragmentBuffer[bufferIdx];

            let leftFragment   = (fragmentBuffer[((x - 1) + (y    ) * renderWidth)] || null);
            let topFragment    = (fragmentBuffer[((x    ) + (y - 1) * renderWidth)] || null);
            let rightFragment  = (fragmentBuffer[((x + 1) + (y    ) * renderWidth)] || null);
            let bottomFragment = (fragmentBuffer[((x    ) + (y + 1) * renderWidth)] || null);

            if (x == 0) leftFragment = null;
            if (y == 0) topFragment = null;
            if (x == (renderWidth - 1)) rightFragment = null;
            if (y == (renderHeight - 1)) bottomFragment = null;

            if ((leftFragment   && (leftFragment.ngonIdx   != thisFragment.ngonIdx)) ||
                (topFragment    && (topFragment.ngonIdx    != thisFragment.ngonIdx)) ||
                (rightFragment  && (rightFragment.ngonIdx  != thisFragment.ngonIdx)) ||
                (bottomFragment && (bottomFragment.ngonIdx != thisFragment.ngonIdx)))
            {
                pixelBuffer[(bufferIdx * 4) + 0] = 212;
                pixelBuffer[(bufferIdx * 4) + 1] = 212;
                pixelBuffer[(bufferIdx * 4) + 2] = 148;
            }
        }
    }
}

// Pixel shader.
function ps_per_pixel_light({renderState, renderWidth, renderHeight, fragmentBuffer, pixelBuffer, ngonCache})
{
    const light = renderState.lights[0];
    const lightReach = (100 * 100);
    const lightIntensity = 2.5;
    const lightDirection = this.Rngon.vector();

    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const thisFragment = fragmentBuffer[i];
        const thisNgon = (ngonCache[thisFragment.ngonIdx] || null);

        const distance = (((thisFragment.worldX - light.position.x) * (thisFragment.worldX - light.position.x)) +
                          ((thisFragment.worldY - light.position.y) * (thisFragment.worldY - light.position.y)) +
                          ((thisFragment.worldZ - light.position.z) * (thisFragment.worldZ - light.position.z)));

        const distanceMul = Math.max(0, Math.min(1, (1 - (distance / lightReach))));

        if ((thisFragment.shade > 0) && (distanceMul > 0))
        {
            let shadeMul;
            {
                // Use pre-computed shading, if available.
                if (thisNgon.material.vertexShading !== "none")
                {
                    shadeMul = thisFragment.shade;
                }
                else
                {
                    lightDirection.x = (light.position.x - thisFragment.worldX);
                    lightDirection.y = (light.position.y - thisFragment.worldY);
                    lightDirection.z = (light.position.z - thisFragment.worldZ);
                    this.Rngon.vector.normalize(lightDirection);

                    shadeMul = Math.max(0, Math.min(1, this.Rngon.vector.dot(thisNgon.normal, lightDirection)));
                }
            }

            const colorMul = (distanceMul * shadeMul * lightIntensity);

            pixelBuffer[(i * 4) + 0] *= colorMul;
            pixelBuffer[(i * 4) + 1] *= colorMul;
            pixelBuffer[(i * 4) + 2] *= colorMul;
        }
        else
        {
            pixelBuffer[(i * 4) + 0] = 0;
            pixelBuffer[(i * 4) + 1] = 0;
            pixelBuffer[(i * 4) + 2] = 0;
        }
    }
}

// Pixel shader. Desatures pixel colors based on their distance to the camera - pixels
// that are further away are desatured to a greater extent. The desaturation algo is
// adapted from http://alienryderflex.com/saturation.html.
function ps_depth_desaturate({renderWidth, renderHeight, fragmentBuffer, pixelBuffer})
{
    const Pr = .299;
    const Pg = .587;
    const Pb = .114;
    const maxDepth = 200;

    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const thisFragment = fragmentBuffer[i];

        const depth = Math.max(0, Math.min(1, (thisFragment.w / maxDepth)));

        let red   = pixelBuffer[(i * 4) + 0];
        let green = pixelBuffer[(i * 4) + 1];
        let blue  = pixelBuffer[(i * 4) + 2];

        const P = Math.sqrt((red * red * Pr) + (green * green * Pg) + (blue * blue * Pb));
        const saturationLevel = (1 - depth);

        red   = P + (red   - P) * saturationLevel;
        green = P + (green - P) * saturationLevel;
        blue  = P + (blue  - P) * saturationLevel;

        pixelBuffer[(i * 4) + 0] = red;
        pixelBuffer[(i * 4) + 1] = green;
        pixelBuffer[(i * 4) + 2] = blue;
    }
}

// Pixel shader.
function ps_aberration({renderWidth, renderHeight, pixelBuffer})
{
    const redOffset = 2;
    const greenOffset = 0;
    const blueOffset = -2;
    
    const redScale = 1;
    const greenScale = 1;
    const blueScale = 1;

    const outputPixels = new Uint8Array(pixelBuffer.length);

    for (let y = 0; y < renderHeight; y++) {
        for (let x = 0; x < renderWidth; x++) {
            const pixelIndex = (y * renderWidth + x) * 4;

            const redX = Math.floor(x + redOffset * Math.cos(y / renderHeight * Math.PI * 2));
            const redY = Math.floor(y + redOffset * Math.sin(x / renderWidth * Math.PI * 2));
            const redPixelIndex = (redY * renderWidth + redX) * 4;

            const greenX = Math.floor(x + greenOffset * Math.cos(y / renderHeight * Math.PI * 2));
            const greenY = Math.floor(y + greenOffset * Math.sin(x / renderWidth * Math.PI * 2));
            const greenPixelIndex = (greenY * renderWidth + greenX) * 4;

            const blueX = Math.floor(x + blueOffset * Math.cos(y / renderHeight * Math.PI * 2));
            const blueY = Math.floor(y + blueOffset * Math.sin(x / renderWidth * Math.PI * 2));
            const bluePixelIndex = (blueY * renderWidth + blueX) * 4;

            outputPixels[pixelIndex] = pixelBuffer[redPixelIndex] * redScale;
            outputPixels[pixelIndex + 1] = pixelBuffer[greenPixelIndex + 1] * greenScale;
            outputPixels[pixelIndex + 2] = pixelBuffer[bluePixelIndex + 2] * blueScale;
            outputPixels[pixelIndex + 3] = pixelBuffer[pixelIndex + 3];
        }
    }

    pixelBuffer.set(outputPixels);
}

// Pixel shader. Lightens every xth pixel to create a perspective-correct grid pattern.
function ps_grid_pattern({renderWidth, renderHeight, pixelBuffer, fragmentBuffer})
{
    const maxDepth = 200;

    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const thisFragment = fragmentBuffer[i];

        const depth = (1 - Math.max(0, Math.min(0.8, (thisFragment.w / maxDepth))));
        let pixelColor = 0;

        // Note: we slightly offset some of the coordinate values to prevent flat
        // axis-aligned polygons in this particular scene from being entirely lit.
        if (((~~thisFragment.worldX)     % 8 == 0) ||
            ((~~thisFragment.worldY + 2) % 8 == 0) ||
            ((~~thisFragment.worldZ - 3) % 8 == 0))
        {
            pixelColor = (190 * depth);
        }
        else
        {
            pixelColor = (220 * depth);
        }

        pixelBuffer[(i * 4) + 0] = pixelColor;
        pixelBuffer[(i * 4) + 1] = pixelColor;
        pixelBuffer[(i * 4) + 2] = pixelColor;
    }
}

// Pixel shader. Draws a marker over each visible vertex.
function ps_vertex_positions_map({renderWidth, renderHeight, pixelBuffer, fragmentBuffer, ngonCache})
{
    for (let y = 0; y < renderHeight; y++)
    {
        for (let x = 0; x < renderWidth; x++)
        {
            const thisFragment = fragmentBuffer[x + y * renderWidth];
            const thisNgon = (thisFragment? ngonCache[thisFragment.ngonIdx] : null);

            if (!thisNgon)
            {
                continue;
            }

            for (let v = 0; v < thisNgon.vertices.length; v++)
            {
                const vx = Math.round(thisNgon.vertices[v].x);
                const vy = Math.round(thisNgon.vertices[v].y);

                if ((Math.abs(x - vx) < 2) &&
                    (Math.abs(y - vy) < 2))
                {
                    for (let p = -1; p <= 1; p++)
                    {
                        pixelBuffer[(((vx + p) + (vy + p) * renderWidth) * 4) + 0] = 255;
                        pixelBuffer[(((vx + p) + (vy + p) * renderWidth) * 4) + 1] = 255;
                        pixelBuffer[(((vx + p) + (vy + p) * renderWidth) * 4) + 2] = 0;

                        pixelBuffer[(((vx + p) + (vy - p) * renderWidth) * 4) + 0] = 255;
                        pixelBuffer[(((vx + p) + (vy - p) * renderWidth) * 4) + 1] = 255;
                        pixelBuffer[(((vx + p) + (vy - p) * renderWidth) * 4) + 2] = 0;
                    }
                }
            }
        }
    }
}

// Pixel shader. Applies a wavy distortion to the pixel buffer.
function ps_waviness({renderWidth, renderHeight, fragmentBuffer, pixelBuffer})
{
    const timer = (new Date().getTime() / 150);
    const startDepth = 20;
    const maxDepth = 200;

    for (let y = 0; y < renderHeight; y++)
    {
        for (let x = 0; x < renderWidth; x++)
        {
            const thisIdx = ((x + y * renderWidth) * 4);
            const thisFragment = fragmentBuffer[thisIdx / 4];

            const depth = Math.max(0, Math.min(1, ((thisFragment.w - startDepth) / (maxDepth - startDepth))));
            const horizontalMagnitude = (1 + depth);
            const verticalMagnitude = ((y / renderWidth) * 190);
            const cos = Math.cos(timer + verticalMagnitude);

            const shiftIdx = ((Math.min((renderWidth - 1), (x + 1 + ~~(cos * horizontalMagnitude))) + y * renderWidth) * 4);
            pixelBuffer[thisIdx + 0] = pixelBuffer[shiftIdx + 0];
            pixelBuffer[thisIdx + 1] = pixelBuffer[shiftIdx + 1];
            pixelBuffer[thisIdx + 2] = pixelBuffer[shiftIdx + 2];
        }
    }
}

// Pixel shader.
function ps_mip_level_map({renderWidth, renderHeight, fragmentBuffer, ngonCache, pixelBuffer})
{
    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const thisFragment = fragmentBuffer[i];
        const thisNgon = (thisFragment? ngonCache[thisFragment.ngonIdx] : null);

        if (!thisNgon)
        {
            continue;
        }

        pixelBuffer[(i * 4) + 0] = this.Rngon.lerp(0, 255, (1 - thisNgon.mipLevel));
        pixelBuffer[(i * 4) + 1] = this.Rngon.lerp(0, 255, (1 - thisNgon.mipLevel));
        pixelBuffer[(i * 4) + 2] = this.Rngon.lerp(0, 255, (1 - thisNgon.mipLevel));
    }
}

// Pixel shader.
function ps_distance_fog({renderWidth, renderHeight, fragmentBuffer, pixelBuffer})
{
    const maxDepth = 200;

    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const thisFragment = fragmentBuffer[i];

        const depth = Math.max(0, Math.min(1, (thisFragment.w / maxDepth)));

        pixelBuffer[(i * 4) + 0] = this.Rngon.lerp(pixelBuffer[(i * 4) + 0], 127, depth);
        pixelBuffer[(i * 4) + 1] = this.Rngon.lerp(pixelBuffer[(i * 4) + 1], 127, depth);
        pixelBuffer[(i * 4) + 2] = this.Rngon.lerp(pixelBuffer[(i * 4) + 2], 127, depth);
    }
}

// Pixel shader. Blends with a second texture the base texture of any n-gon whose material
// specifies such a second texture via the 'blendTexture' material property.
function ps_texture_blend({renderWidth, renderHeight, fragmentBuffer, pixelBuffer, ngonCache})
{
    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const thisFragment = fragmentBuffer[i];
        const thisNgon = (thisFragment? ngonCache[thisFragment.ngonIdx] : null);

        if (!thisNgon || !thisNgon.material.blendTexture)
        {
            continue;
        }

        const texture = thisNgon.material.blendTexture;
        const texelIdx = (thisFragment.textureUScaled + thisFragment.textureVScaled * texture.width);
        const texel = texture.pixels[texelIdx];

        // Linearly interpolate a time-animated blending between the two textures.
        const lerpAmt = ((Math.sin(this.numTicks / 50) / 2) + 0.5);
        pixelBuffer[(i * 4) + 0] = this.Rngon.lerp(pixelBuffer[(i * 4) + 0], (texel.red   * thisNgon.material.color.unitRange.red),   lerpAmt);
        pixelBuffer[(i * 4) + 1] = this.Rngon.lerp(pixelBuffer[(i * 4) + 1], (texel.green * thisNgon.material.color.unitRange.green), lerpAmt);
        pixelBuffer[(i * 4) + 2] = this.Rngon.lerp(pixelBuffer[(i * 4) + 2], (texel.blue  * thisNgon.material.color.unitRange.blue),  lerpAmt);
    }
}

// Pixel shader. Applies a radial blur effect centered on the screen.
function ps_radial_blur({renderWidth, renderHeight, pixelBuffer}) {
    const centerX = (renderWidth / 2);
    const centerY = (renderHeight / 2);
    const blurRadius = 10;
    const blurSamples = 3;
    
    const tempPixelBuffer = [];
    
    // Iterate through each pixel in the buffer.
    for (let y = 0; y < renderHeight; y++)
    {
        for (let x = 0; x < renderWidth; x++)
        {
            let sumR = 0;
            let sumG = 0;
            let sumB = 0;
    
            // Calculate the distance from the current pixel to the center.
            const dx = (x - centerX);
            const dy = (y - centerY);
            const distance = Math.sqrt(dx * dx + dy * dy);
    
            // Determine the number of samples for the radial blur based on the distance from the center.
            const samples = Math.max(1, Math.round(blurSamples * (distance / blurRadius)));
    
            // Collect the color samples for the radial blur.
            for (let i = 0; i < samples; i++)
            {
                const sampleX = Math.round(x - (dx * i / samples));
                const sampleY = Math.round(y - (dy * i / samples));
    
                // Clamp the sample coordinates within the pixel buffer bounds.
                const clampedX = Math.min(renderWidth - 1, Math.max(0, sampleX));
                const clampedY = Math.min(renderHeight - 1, Math.max(0, sampleY));
    
                const sampleIdx = (clampedX + clampedY * renderWidth) * 4;
    
                sumR += pixelBuffer[sampleIdx + 0];
                sumG += pixelBuffer[sampleIdx + 1];
                sumB += pixelBuffer[sampleIdx + 2];
            }
    
            // Calculate the average color of the samples.
            const averageR = sumR / samples;
            const averageG = sumG / samples;
            const averageB = sumB / samples;
    
            const thisIdx = (x + y * renderWidth) * 4;
            tempPixelBuffer[thisIdx + 0] = averageR;
            tempPixelBuffer[thisIdx + 1] = averageG;
            tempPixelBuffer[thisIdx + 2] = averageB;
            tempPixelBuffer[thisIdx + 3] = pixelBuffer[thisIdx + 3];
        }
    }
    
    for (let i = 0; i < pixelBuffer.length; i++)
    {
        pixelBuffer[i] = tempPixelBuffer[i];
    }
}
// Pixel shader. Applies a sepia tone to the pixel buffer.
function ps_sepia({renderWidth, renderHeight, pixelBuffer})
{
    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const red = pixelBuffer[(i * 4) + 0];
        const green = pixelBuffer[(i * 4) + 1];
        const blue = pixelBuffer[(i * 4) + 2];

        const tr = ((0.393 * red) + (0.769 * green) + (0.189 * blue));
        const tg = ((0.349 * red) + (0.686 * green) + (0.168 * blue));
        const tb = ((0.272 * red) + (0.534 * green) + (0.131 * blue));

        pixelBuffer[(i * 4) + 0] = Math.min(tr, 255);
        pixelBuffer[(i * 4) + 1] = Math.min(tg, 255);
        pixelBuffer[(i * 4) + 2] = Math.min(tb, 255);
    }
}

// Pixel shader. Applies ambient occlusion to the pixel buffer.
function ps_ambient_occlusion({renderWidth, renderHeight, fragmentBuffer, pixelBuffer})
{
    const radius = 1;
    const depthThreshold = 0.03;
    const occlusionStrength = 1;

    for (let y = 0; y < renderHeight; y++)
    {
        for (let x = 0; x < renderWidth; x++)
        {
            const bufferIdx = (x + y * renderWidth);
            const thisFragment = fragmentBuffer[bufferIdx];

            if (!thisFragment)
            {
                continue;
            }

            // Check neighboring pixels within the radius.
            let occlusionValue = 0;
            let numSamples = 0;
            for (let dy = -radius; dy <= radius; dy++)
            {
                for (let dx = -radius; dx <= radius; dx++)
                {
                    if (dx === 0 && dy === 0) {
                        continue;
                    }

                    const nx = (x + dx);
                    const ny = (y + dy);

                    if ((nx < 0) || (nx >= renderWidth) || (ny < 0) || (ny >= renderHeight))
                    {
                        continue;
                    }

                    const neighborIdx = (nx + ny * renderWidth);
                    const neighborFragment = fragmentBuffer[neighborIdx];

                    if (!neighborFragment)
                    {
                        continue;
                    }

                    const depthDifference = Math.abs(thisFragment.depth - neighborFragment.depth);

                    if (depthDifference < depthThreshold) {
                        occlusionValue += (1.0 - depthDifference / depthThreshold);
                        numSamples++;
                    }
                }
            }

            if (numSamples)
            {
                occlusionValue = (1.0 - occlusionStrength * (occlusionValue / numSamples));

                const pixelValue = (200 * (1 - occlusionValue));
                pixelBuffer[(bufferIdx * 4) + 0] = pixelValue;
                pixelBuffer[(bufferIdx * 4) + 1] = pixelValue;
                pixelBuffer[(bufferIdx * 4) + 2] = pixelValue;
            }
        }
    }
}

// Pixel shader. Applies edge anti-aliasing to the pixel buffer
function ps_fxaa({renderWidth, renderHeight, fragmentBuffer, pixelBuffer, ngonCache})
{
    for (let y = 0; y < renderHeight; y++)
    {
        for (let x = 0; x < renderWidth; x++)
        {
            const thisFragment = fragmentBuffer[x + y * renderWidth];
            const thisMaterial = ngonCache[thisFragment.ngonIdx].material;

            let leftFragment   = fragmentBuffer[((x - 1) + (y    ) * renderWidth)];
            let topFragment    = fragmentBuffer[((x    ) + (y - 1) * renderWidth)];
            let rightFragment  = fragmentBuffer[((x + 1) + (y    ) * renderWidth)];
            let bottomFragment = fragmentBuffer[((x    ) + (y + 1) * renderWidth)] ;

            if (x == 0) leftFragment = null;
            if (y == 0) topFragment = null;
            if (x == (renderWidth - 1)) rightFragment = null;
            if (y == (renderHeight - 1)) bottomFragment = null;

            if (
                (leftFragment && (ngonCache[leftFragment.ngonIdx].material !== thisMaterial)) ||
                (topFragment && (ngonCache[topFragment.ngonIdx].material !== thisMaterial)) ||
                (rightFragment && (ngonCache[rightFragment.ngonIdx].material !== thisMaterial)) ||
                (bottomFragment && (ngonCache[bottomFragment.ngonIdx].material !== thisMaterial))
            ){
                let idx = ((x + y * renderWidth) * 4);
                
                for (let i = 0; i < 3; i++)
                {
                    const neighborAvg = (
                        (pixelBuffer[(x - 1 + y * renderWidth) * 4 + i] +
                         pixelBuffer[(x + 1 + y * renderWidth) * 4 + i] +
                         pixelBuffer[(x + (y - 1) * renderWidth) * 4 + i] +
                         pixelBuffer[(x + (y + 1) * renderWidth) * 4 + i])
                        * 0.25
                    );

                    pixelBuffer[idx + i] = ((pixelBuffer[idx + i] * 0.4) + (neighborAvg * 0.6));
                }
            }
        }
    }
}

// Pixel shader. Applies a vignette effect to the pixel buffer.
function ps_vignette({renderWidth, renderHeight, pixelBuffer})
{
    const centerX = (renderWidth / 2);
    const centerY = (renderHeight / 2);
    const radius = Math.min(centerX, centerY);
    const intensity = 0.6;

    for (let y = 0; y < renderHeight; y++)
    {
        for (let x = 0; x < renderWidth; x++)
        {
            const dx = x - centerX;
            const dy = y - centerY;
            const distanceSquared = (dx * dx) + (dy * dy);
            const vignette = Math.max(0, 1 - (distanceSquared / (radius * radius)));

            const i = (x + y * renderWidth) * 4;
            pixelBuffer[i + 0] *= (1 - intensity + (vignette * intensity));
            pixelBuffer[i + 1] *= (1 - intensity + (vignette * intensity));
            pixelBuffer[i + 2] *= (1 - intensity + (vignette * intensity));
        }
    }
}

// Pixel shader. Applies fisheye projection to the image.
function ps_fisheye_projection({renderWidth, renderHeight, pixelBuffer})
{
    const widthHalf = (renderWidth / 2);
    const heightHalf = (renderHeight / 2);
    const maxRadius = Math.sqrt(widthHalf * widthHalf + heightHalf * heightHalf);
    const outputBuffer = new Uint8ClampedArray(pixelBuffer.length);
    
    for (let y = 0; y < renderHeight; y++)
    {
        for (let x = 0; x < renderWidth; x++)
        {
            const dx = x - widthHalf;
            const dy = y - heightHalf;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const theta = Math.atan2(dy, dx);
            const radius = (distance / maxRadius);
            const fisheyeRadius = ((radius * radius) / Math.max(radius, 1));
            const fisheyeX = widthHalf + fisheyeRadius * maxRadius * Math.cos(theta);
            const fisheyeY = heightHalf + fisheyeRadius * maxRadius * Math.sin(theta);

            const srcIdx = ((Math.floor(fisheyeY) * renderWidth + Math.floor(fisheyeX)) * 4);
            const destIdx = ((y * renderWidth + x) * 4);

            outputBuffer[destIdx + 0] = pixelBuffer[srcIdx + 0];
            outputBuffer[destIdx + 1] = pixelBuffer[srcIdx + 1];
            outputBuffer[destIdx + 2] = pixelBuffer[srcIdx + 2];
            outputBuffer[destIdx + 3] = pixelBuffer[srcIdx + 3];
        }
    }

    for (let i = 0; i < pixelBuffer.length; i++)
    {
        pixelBuffer[i] = outputBuffer[i];
    }
}
