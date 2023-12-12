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
            Rngon.light(11, 45, -35, {intensity: 70}),
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
        this.lights[0].x += (Math.cos(this.numTicks / 70) * 0.5);
        this.lights[0].z += (Math.sin(this.numTicks / 70) * 0.5);

        return {
            renderOptions: {
                lights: this.lights,
                useFragmentBuffer: Boolean(parent.SHADER_PIPELINE_ENABLED && parent.ACTIVE_SHADER.function.fragments),
                fragments: parent.ACTIVE_SHADER.function.fragments,
                cameraDirection: this.camera.direction,
                cameraPosition: this.camera.position,
            },
            renderPipeline: {
                pixelShader: (
                    (parent.SHADER_PIPELINE_ENABLED && parent.ACTIVE_SHADER.function)
                        ? Object.assign(parent.ACTIVE_SHADER.function.bind(this), parent.ACTIVE_SHADER.function)
                        : undefined
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

function ps_crt(renderContext)
{
    const {width, height, data:pixels} = renderContext.pixelBuffer;
    const sourceBuffer = new Uint8Array(pixels.length);
    sourceBuffer.set(pixels);
    
    const curvature = 0.1;
    const scaleX = 1;
    const scaleY = 1;
    const colorSoftening = 1.5;
    const scanlineIntensity = 0.01;
    
    const centerX = (width / 2);
    const centerY = (height / 2);
    
    for (let y = 0; y < height; y++)
    {
        for (let x = 0; x < width; x++)
        {
            const bufferIdx = ((x + y * width) * 4);
    
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
                if (sourceX >= 0 && sourceX < width && sourceY >= 0 && sourceY < height)
                {
                    // Copy the source pixel color
                    const sourceIdx = (sourceX + sourceY * width) * 4;
                    pixels[bufferIdx + 0] = sourceBuffer[sourceIdx + 0];
                    pixels[bufferIdx + 1] = sourceBuffer[sourceIdx + 1];
                    pixels[bufferIdx + 2] = sourceBuffer[sourceIdx + 2];
                }
                else
                {
                    // Set the pixel to black if it's out of bounds
                    pixels[bufferIdx + 0] = 0;
                    pixels[bufferIdx + 1] = 0;
                    pixels[bufferIdx + 2] = 0;
                }
            }

            // Scanlines.
            const scanlineFactor = ((y % 2 === 0)? (1 - scanlineIntensity) : 1);

            // Color softening.
            const r = Math.min(pixels[bufferIdx] * colorSoftening, 255);
            const g = Math.min(pixels[bufferIdx + 1] * colorSoftening, 255);
            const b = Math.min(pixels[bufferIdx + 2] * colorSoftening, 255);

            pixels[bufferIdx] = (r * scanlineFactor);
            pixels[bufferIdx + 1] = (g * scanlineFactor);
            pixels[bufferIdx + 2] = (b * scanlineFactor);
        }
    }
}

// Pixel shader: Applies a dithering effect to the rendered image.
function ps_dithering(renderContext)
{
    const ditherMatrix = [
        [ 1, 9, 3, 11 ],
        [ 13, 5, 15, 7 ],
        [ 4, 12, 2, 10 ],
        [ 16, 8, 14, 6 ]
    ];

    const {width, height, data:pixels} = renderContext.pixelBuffer;
    const ditherLevels = 16; // Number of color levels after dithering
    const ditherScaleFactor = (255 / (ditherLevels - 1));

    for (let y = 0; y < height; y++)
    {
        for (let x = 0; x < width; x++)
        {
            const bufferIdx = (x + y * width) * 4;

            for (let channel = 0; channel < 3; channel++)
            {
                // Calculate the threshold for the current pixel position
                const ditherThreshold = (ditherMatrix[y % 4][x % 4] / 17);

                // Get the original pixel color value and normalize it to the range [0, 1]
                const originalValue = (pixels[bufferIdx + channel] / 255);

                // Quantize the pixel color value using ditherLevels
                const quantizedValue = Math.round((originalValue * (ditherLevels - 1)) + ditherThreshold);

                // Scale the quantized value back to the range [0, 255] and set it as the new pixel color
                pixels[bufferIdx + channel] = Math.round(quantizedValue * ditherScaleFactor);
            }
        }
    }
}

// Pixel shader: Draws a 1-pixel-thin outline over any pixel that lies on the edge of
// an n-gon whose material has the 'hasHalo' property set to true and which does not
// border another n-gon that has that property set.
function ps_selective_outline(renderContext)
{
    const {width, height, data:pixels} = renderContext.pixelBuffer;
    const fragments = renderContext.fragmentBuffer.data;
    const depth = renderContext.depthBuffer.data;

    for (let y = 0; y < height; y++)
    {
        for (let x = 0; x < width; x++)
        {
            const bufferIdx = (x + y * width);
            const thisFragment = fragments[bufferIdx];
            const thisDepth = depth[bufferIdx];
            const ngon = thisFragment.ngon;

            if (!ngon || !ngon.material.hasHalo)
            {
                continue;
            }

            let leftFragment   = (fragments[((x - 1) + (y    ) * width)] || null);
            let topFragment    = (fragments[((x    ) + (y - 1) * width)] || null);
            let rightFragment  = (fragments[((x + 1) + (y    ) * width)] || null);
            let bottomFragment = (fragments[((x    ) + (y + 1) * width)] || null);

            const leftDepth   = depth[((x - 1) + (y    ) * width)];
            const topDepth    = depth[((x    ) + (y - 1) * width)];
            const rightDepth  = depth[((x + 1) + (y    ) * width)];
            const bottomDepth = depth[((x    ) + (y + 1) * width)];

            if (x == 0) leftFragment = null;
            if (y == 0) topFragment = null;
            if (x == (width - 1)) rightFragment = null;
            if (y == (height - 1)) bottomFragment = null;

            const leftNgon   = leftFragment.ngon;
            const topNgon    = topFragment.ngon;
            const rightNgon  = rightFragment.ngon;
            const bottomNgon = bottomFragment.ngon;

            if ((leftNgon   && !leftNgon.material.hasHalo   && (leftDepth >= thisDepth))   ||
                (topNgon    && !topNgon.material.hasHalo    && (topDepth >= thisDepth))    ||
                (rightNgon  && !rightNgon.material.hasHalo  && (rightDepth >= thisDepth))  ||
                (bottomNgon && !bottomNgon.material.hasHalo && (bottomDepth >= thisDepth)))
            {
                pixels[(bufferIdx * 4) + 0] = 255;
                pixels[(bufferIdx * 4) + 1] = 255;
                pixels[(bufferIdx * 4) + 2] = 0;
            }
        }
    }
} ps_selective_outline.fragments = {
    ngon: true,
};

// Pixel shader: Draws a wireframe (outline) around each visible n-gon.
function ps_wireframe(renderContext)
{
    const {width, height, data:pixels} = renderContext.pixelBuffer;
    const fragments = renderContext.fragmentBuffer.data;

    for (let y = 0; y < height; y++)
    {
        for (let x = 0; x < width; x++)
        {
            const bufferIdx = (x + y * width);
            const thisFragment = fragments[bufferIdx];

            let leftFragment   = (fragments[((x - 1) + (y    ) * width)] || null);
            let topFragment    = (fragments[((x    ) + (y - 1) * width)] || null);
            let rightFragment  = (fragments[((x + 1) + (y    ) * width)] || null);
            let bottomFragment = (fragments[((x    ) + (y + 1) * width)] || null);

            if (x == 0) leftFragment = null;
            if (y == 0) topFragment = null;
            if (x == (width - 1)) rightFragment = null;
            if (y == (height - 1)) bottomFragment = null;

            if ((leftFragment   && (leftFragment.ngon != thisFragment.ngon)) ||
                (topFragment    && (topFragment.ngon != thisFragment.ngon)) ||
                (rightFragment  && (rightFragment.ngon != thisFragment.ngon)) ||
                (bottomFragment && (bottomFragment.ngon != thisFragment.ngon)))
            {
                pixels[(bufferIdx * 4) + 0] = 0;
                pixels[(bufferIdx * 4) + 1] = 0;
                pixels[(bufferIdx * 4) + 2] = 0;
            }
        }
    }
} ps_wireframe.fragments = {
    ngon: true,
};

// Pixel shader.
function ps_per_pixel_light(renderContext)
{
    const {width, height, data:pixels} = renderContext.pixelBuffer;
    const fragments = renderContext.fragmentBuffer.data;
    const light = renderContext.lights[0];
    const lightReach = Math.sqrt(100**2);
    const lightIntensity = 1.75;
    const lightDirection = this.Rngon.vector();
    const surfaceNormal = this.Rngon.vector();

    for (let i = 0; i < (width * height); i++)
    {
        const thisFragment = fragments[i];

        if (!thisFragment)
        { 
            continue;
        }

        const distanceToLight = Math.sqrt(
            ((thisFragment.worldX - light.x) ** 2) +
            ((thisFragment.worldY - light.y) ** 2) +
            ((thisFragment.worldZ - light.z) ** 2)
        );

        if (distanceToLight <= lightReach)
        {
            lightDirection.x = (light.x - thisFragment.worldX);
            lightDirection.y = (light.y - thisFragment.worldY);
            lightDirection.z = (light.z - thisFragment.worldZ);
            this.Rngon.vector.normalize(lightDirection);

            surfaceNormal.x = thisFragment.normalX;
            surfaceNormal.y = thisFragment.normalY;
            surfaceNormal.z = thisFragment.normalZ;

            const shade = (
                (1 - (distanceToLight / lightReach)) *
                this.Rngon.vector.dot(surfaceNormal, lightDirection) *
                lightIntensity
            );

            pixels[(i * 4) + 0] *= shade;
            pixels[(i * 4) + 1] *= shade;
            pixels[(i * 4) + 2] *= shade;
        }
        else
        {
            pixels[(i * 4) + 0] = 0;
            pixels[(i * 4) + 1] = 0;
            pixels[(i * 4) + 2] = 0;
        }
    }
} ps_per_pixel_light.fragments = {
    worldX: true,
    worldY: true,
    worldZ: true,
    normalX: true,
    normalY: true,
    normalZ: true,
};

// Pixel shader: Desatures pixel colors based on their distance to the camera - pixels
// that are further away are desatured to a greater extent. The desaturation algo is
// adapted from http://alienryderflex.com/saturation.html.
function ps_depth_desaturate(renderContext)
{
    const {width, height, data:pixels} = renderContext.pixelBuffer;
    const depth = renderContext.depthBuffer.data;
    const Pr = .299;
    const Pg = .587;
    const Pb = .114;
    const maxDepth = 0.2;

    for (let i = 0; i < (width * height); i++)
    {
        const thisDepth = Math.max(0, Math.min(1, (depth[i] / maxDepth)));

        let red   = pixels[(i * 4) + 0];
        let green = pixels[(i * 4) + 1];
        let blue  = pixels[(i * 4) + 2];

        const P = Math.sqrt((red * red * Pr) + (green * green * Pg) + (blue * blue * Pb));
        const saturationLevel = (1 - thisDepth);

        red   = P + (red   - P) * saturationLevel;
        green = P + (green - P) * saturationLevel;
        blue  = P + (blue  - P) * saturationLevel;

        pixels[(i * 4) + 0] = red;
        pixels[(i * 4) + 1] = green;
        pixels[(i * 4) + 2] = blue;
    }
}

// Pixel shader: Obscures pixels progressively the further they are from the camera.
function ps_distance_fog(renderContext)
{
    const {width, height, data:pixels} = renderContext.pixelBuffer;
    const depth = renderContext.depthBuffer.data;
    const maxDepth = 0.2;

    for (let i = 0; i < (width * height); i++)
    {
        const thisDepth = Math.max(0, Math.min(1, (depth[i] / maxDepth)));
        pixels[(i * 4) + 3] = (255 * (1 - thisDepth));
    }
}

// Pixel shader: Applies edge anti-aliasing to the pixel buffer
function ps_fxaa(renderContext)
{
    const {width, height, data:pixels} = renderContext.pixelBuffer;
    const fragments = renderContext.fragmentBuffer.data;

    for (let y = 0; y < height; y++)
    {
        for (let x = 0; x < width; x++)
        {
            const thisFragment = fragments[x + y * width];
            const thisMaterial = thisFragment.ngon.material;

            let leftFragment   = fragments[((x - 1) + (y    ) * width)];
            let topFragment    = fragments[((x    ) + (y - 1) * width)];
            let rightFragment  = fragments[((x + 1) + (y    ) * width)];
            let bottomFragment = fragments[((x    ) + (y + 1) * width)] ;

            if (x == 0) leftFragment = null;
            if (y == 0) topFragment = null;
            if (x == (width - 1)) rightFragment = null;
            if (y == (height - 1)) bottomFragment = null;

            if (
                (leftFragment && (leftFragment.ngon.material !== thisMaterial)) ||
                (topFragment && (topFragment.ngon.material !== thisMaterial)) ||
                (rightFragment && (rightFragment.ngon.material !== thisMaterial)) ||
                (bottomFragment && (bottomFragment.ngon.material !== thisMaterial))
            ){
                let idx = ((x + y * width) * 4);
                
                for (let i = 0; i < 3; i++)
                {
                    const neighborAvg = (
                        (pixels[(x - 1 + y * width) * 4 + i] +
                         pixels[(x + 1 + y * width) * 4 + i] +
                         pixels[(x + (y - 1) * width) * 4 + i] +
                         pixels[(x + (y + 1) * width) * 4 + i])
                        * 0.25
                    );

                    pixels[idx + i] = ((pixels[idx + i] * 0.4) + (neighborAvg * 0.6));
                }
            }
        }
    }
} ps_fxaa.fragments = {
    ngon: true,
};

// Pixel shader: Applies a vignette effect to the pixel buffer.
function ps_vignette(renderContext)
{
    const {width, height, data:pixels} = renderContext.pixelBuffer;
    const centerX = (width / 2);
    const centerY = (height / 2);
    const radius = Math.max(centerX, centerY);
    const intensity = 1.0;

    for (let y = 0; y < height; y++)
    {
        for (let x = 0; x < width; x++)
        {
            const dx = x - centerX;
            const dy = y - centerY;
            const distanceSquared = (dx * dx) + (dy * dy);
            const vignette = Math.max(0, 1 - (distanceSquared / (radius * radius)));

            const i = (x + y * width) * 4;
            pixels[i + 0] *= (1 - intensity + (vignette * intensity));
            pixels[i + 1] *= (1 - intensity + (vignette * intensity));
            pixels[i + 2] *= (1 - intensity + (vignette * intensity));
        }
    }
}
