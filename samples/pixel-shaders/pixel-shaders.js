/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer / render sample
 * 
 */

"use strict";

import {scene} from "./scene.js";
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
            Rngon.light(70, Rngon.vector(11, 45, -35)),
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
                    (parent.SHADER_PIPELINE_ENABLED && parent.ACTIVE_SHADER.function)
                        ? parent.ACTIVE_SHADER.function.toString().match(/{(.+)?}/)[1].includes("fragmentBuffer")
                        : false
                ),
                fragments: parent.ACTIVE_SHADER.function.fragments,
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
                scale: this.Rngon.vector(25, 25, 25)
            }),
        };
    },
    shaders: [
        {title:"Dithering",              function:ps_dithering},
        {title:"Edge anti-aliasing",     function:ps_fxaa},
        {title:"Vignette",               function:ps_vignette},
        {title:"Depth desaturation",     function:ps_depth_desaturate},
        {title:"Distance fog",           function:ps_distance_fog},
        {title:"CRT",                    function:ps_crt},
        {title:"Selective outline",      function:ps_selective_outline},
        {title:"Per-pixel lighting",     function:ps_per_pixel_light},
        {title:"Wireframe",              function:ps_wireframe},
    ],
    lights: undefined,
    camera: undefined,
    Rngon: undefined,
    numTicks: 0,
};

function ps_crt({renderWidth, renderHeight, pixelBuffer})
{
    const sourceBuffer = new Uint8Array(pixelBuffer.length);
    sourceBuffer.set(pixelBuffer);
    
    const curvature = 0.1;
    const scaleX = 1;
    const scaleY = 1;
    const colorSoftening = 1.5;
    const scanlineIntensity = 0.01;
    
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

// Pixel shader: Applies a dithering effect to the rendered image.
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

// Pixel shader: Draws a 1-pixel-thin outline over any pixel that lies on the edge of
// an n-gon whose material has the 'hasHalo' property set to true and which does not
// border another n-gon that has that property set.
function ps_selective_outline({renderWidth, renderHeight, fragmentBuffer, depthBuffer, pixelBuffer})
{
    for (let y = 0; y < renderHeight; y++)
    {
        for (let x = 0; x < renderWidth; x++)
        {
            const bufferIdx = (x + y * renderWidth);
            const thisFragment = fragmentBuffer[bufferIdx];
            const thisDepth = depthBuffer[bufferIdx];
            const ngon = thisFragment.ngon;

            if (!ngon || !ngon.material.hasHalo)
            {
                continue;
            }

            let leftFragment   = (fragmentBuffer[((x - 1) + (y    ) * renderWidth)] || null);
            let topFragment    = (fragmentBuffer[((x    ) + (y - 1) * renderWidth)] || null);
            let rightFragment  = (fragmentBuffer[((x + 1) + (y    ) * renderWidth)] || null);
            let bottomFragment = (fragmentBuffer[((x    ) + (y + 1) * renderWidth)] || null);

            const leftDepth   = depthBuffer[((x - 1) + (y    ) * renderWidth)];
            const topDepth    = depthBuffer[((x    ) + (y - 1) * renderWidth)];
            const rightDepth  = depthBuffer[((x + 1) + (y    ) * renderWidth)];
            const bottomDepth = depthBuffer[((x    ) + (y + 1) * renderWidth)];

            if (x == 0) leftFragment = null;
            if (y == 0) topFragment = null;
            if (x == (renderWidth - 1)) rightFragment = null;
            if (y == (renderHeight - 1)) bottomFragment = null;

            const leftNgon   = leftFragment.ngon;
            const topNgon    = topFragment.ngon;
            const rightNgon  = rightFragment.ngon;
            const bottomNgon = bottomFragment.ngon;

            if ((leftNgon   && !leftNgon.material.hasHalo   && (leftDepth >= thisDepth))   ||
                (topNgon    && !topNgon.material.hasHalo    && (topDepth >= thisDepth))    ||
                (rightNgon  && !rightNgon.material.hasHalo  && (rightDepth >= thisDepth))  ||
                (bottomNgon && !bottomNgon.material.hasHalo && (bottomDepth >= thisDepth)))
            {
                pixelBuffer[(bufferIdx * 4) + 0] = 255;
                pixelBuffer[(bufferIdx * 4) + 1] = 255;
                pixelBuffer[(bufferIdx * 4) + 2] = 0;
            }
        }
    }
} ps_selective_outline.fragments = {
    ngon: true,
};

// Pixel shader: Draws a wireframe (outline) around each visible n-gon.
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

            if ((leftFragment   && (leftFragment.ngon != thisFragment.ngon)) ||
                (topFragment    && (topFragment.ngon != thisFragment.ngon)) ||
                (rightFragment  && (rightFragment.ngon != thisFragment.ngon)) ||
                (bottomFragment && (bottomFragment.ngon != thisFragment.ngon)))
            {
                pixelBuffer[(bufferIdx * 4) + 0] = 0;
                pixelBuffer[(bufferIdx * 4) + 1] = 0;
                pixelBuffer[(bufferIdx * 4) + 2] = 0;
            }
        }
    }
} ps_wireframe.fragments = {
    ngon: true,
};

// Pixel shader.
function ps_per_pixel_light({renderState, renderWidth, renderHeight, fragmentBuffer, pixelBuffer, ngonCache})
{
    const light = renderState.lights[0];
    const lightReach = (100 * 100);
    const lightIntensity = 1.5;
    const lightDirection = this.Rngon.vector();

    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const thisFragment = fragmentBuffer[i];
        const thisNgon = (thisFragment.ngon || null);

        if (!thisNgon)
        { 
            continue;
        }

        const distance = (
            ((thisFragment.worldX - light.position.x) * (thisFragment.worldX - light.position.x)) +
            ((thisFragment.worldY - light.position.y) * (thisFragment.worldY - light.position.y)) +
            ((thisFragment.worldZ - light.position.z) * (thisFragment.worldZ - light.position.z))
        );

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
} ps_per_pixel_light.fragments = {
    ngon: true,
    worldX: true,
    worldY: true,
    worldZ: true,
    shade: true,
};

// Pixel shader: Desatures pixel colors based on their distance to the camera - pixels
// that are further away are desatured to a greater extent. The desaturation algo is
// adapted from http://alienryderflex.com/saturation.html.
function ps_depth_desaturate({renderWidth, renderHeight, pixelBuffer, depthBuffer})
{
    const Pr = .299;
    const Pg = .587;
    const Pb = .114;
    const maxDepth = 0.2;

    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const depth = Math.max(0, Math.min(1, (depthBuffer[i] / maxDepth)));

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

// Pixel shader: Obscures pixels progressively the further they are from the camera.
function ps_distance_fog({renderWidth, renderHeight, depthBuffer, pixelBuffer})
{
    const maxDepth = 0.2;

    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const depth = Math.max(0, Math.min(1, (depthBuffer[i] / maxDepth)));
        pixelBuffer[(i * 4) + 3] = (255 * (1 - depth));
    }
}

// Pixel shader: Applies edge anti-aliasing to the pixel buffer
function ps_fxaa({renderWidth, renderHeight, fragmentBuffer, pixelBuffer})
{
    for (let y = 0; y < renderHeight; y++)
    {
        for (let x = 0; x < renderWidth; x++)
        {
            const thisFragment = fragmentBuffer[x + y * renderWidth];
            const thisMaterial = thisFragment.ngon.material;

            let leftFragment   = fragmentBuffer[((x - 1) + (y    ) * renderWidth)];
            let topFragment    = fragmentBuffer[((x    ) + (y - 1) * renderWidth)];
            let rightFragment  = fragmentBuffer[((x + 1) + (y    ) * renderWidth)];
            let bottomFragment = fragmentBuffer[((x    ) + (y + 1) * renderWidth)] ;

            if (x == 0) leftFragment = null;
            if (y == 0) topFragment = null;
            if (x == (renderWidth - 1)) rightFragment = null;
            if (y == (renderHeight - 1)) bottomFragment = null;

            if (
                (leftFragment && (leftFragment.ngon.material !== thisMaterial)) ||
                (topFragment && (topFragment.ngon.material !== thisMaterial)) ||
                (rightFragment && (rightFragment.ngon.material !== thisMaterial)) ||
                (bottomFragment && (bottomFragment.ngon.material !== thisMaterial))
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
} ps_fxaa.fragments = {
    ngon: true,
};

// Pixel shader: Applies a vignette effect to the pixel buffer.
function ps_vignette({renderWidth, renderHeight, pixelBuffer})
{
    const centerX = (renderWidth / 2);
    const centerY = (renderHeight / 2);
    const radius = Math.max(centerX, centerY);
    const intensity = 1.0;

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
