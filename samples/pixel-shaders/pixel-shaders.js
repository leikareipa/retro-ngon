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
            Rngon.light(Rngon.translation_vector(11, 45, -35), {
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
                pixelShader: parent.ACTIVE_SHADER.function
                             ? parent.ACTIVE_SHADER.function.bind(this)
                             : null,
                // For the mip level map shader to work, we need to enable mipmapping.
                // So when that shader is in use, let's set n-gon's mipmap level based
                // on its distance to the camera.
                vertexShader: parent.ACTIVE_SHADER.title !== "Mip level map"
                              ? null
                              : (ngon, cameraPosition)=>
                              {
                                  const maxDistance = (300 * 300);
      
                                  const distance = (((ngon.vertices[0].x - cameraPosition.x) * (ngon.vertices[0].x - cameraPosition.x)) +
                                                  ((ngon.vertices[0].y - cameraPosition.y) * (ngon.vertices[0].y - cameraPosition.y)) +
                                                  ((ngon.vertices[0].z - cameraPosition.z) * (ngon.vertices[0].z - cameraPosition.z)));
      
                                  ngon.mipLevel = Math.max(0, Math.min(0.25, (distance / maxDistance)));
                              },
                cameraDirection: this.camera.direction,
                cameraPosition: this.camera.position,
            },
            mesh: this.Rngon.mesh(scene.ngons, {
                scaling: this.Rngon.scaling_vector(25, 25, 25)
            }),
        };
    },
    shaders: [
        {title:"None",                   function:null},
        {title:"Backlight",              function:ps_backlight},
        {title:"Depth desaturation",     function:ps_depth_desaturate},
        {title:"Distance fog",           function:ps_distance_fog},
        {title:"Reduced color fidelity", function:ps_reduce_color_fidelity},
        {title:"Aberration",             function:ps_aberration},
        {title:"Grid pattern",           function:ps_grid_pattern},
        {title:"Waviness",               function:ps_waviness},
        {title:"Selective outline",      function:ps_selective_outline},
        {title:"Selective blur",         function:ps_selective_blur},
        {title:"Selective grayscale",    function:ps_selective_grayscale},
        {title:"Selective scanlines",    function:ps_selective_scanlines},
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

// Pixel shader.  Draws black all pixels on scanlines divisible by 2; except for pixels
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
function ps_wireframe({renderWidth, renderHeight, fragmentBuffer, pixelBuffer, ngonCache})
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

// Pixel shader.  Lightens grazing angles wrt. the viewing direction on any n-gons whose
// material has the 'isBacklit' property set to true.
function ps_backlight({renderWidth, renderHeight, fragmentBuffer, pixelBuffer, cameraPosition, ngonCache})
{
    const viewVector = this.Rngon.vector3();

    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        const thisFragment = fragmentBuffer[i];
        const thisNgon = (thisFragment? ngonCache[thisFragment.ngonIdx] : null);

        if (!thisNgon || !thisNgon.material.isBacklit)
        {
            continue;
        }

        viewVector.x = (thisFragment.worldX - cameraPosition.x);
        viewVector.y = (thisFragment.worldY - cameraPosition.y);
        viewVector.z = (thisFragment.worldZ - cameraPosition.z);
        this.Rngon.vector3.normalize(viewVector);

        const dot = this.Rngon.vector3.dot(thisNgon.normal, viewVector);

        pixelBuffer[(i * 4) + 0] *= (2 + dot);
        pixelBuffer[(i * 4) + 1] *= (2 + dot);
        pixelBuffer[(i * 4) + 2] *= (2 + dot);
    }
}

// Pixel shader.
function ps_per_pixel_light({renderWidth, renderHeight, fragmentBuffer, pixelBuffer, ngonCache})
{
    const light = this.Rngon.internalState.lights[0];
    const lightReach = (100 * 100);
    const lightIntensity = 2.5;
    const lightDirection = this.Rngon.vector3();

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
                    this.Rngon.vector3.normalize(lightDirection);

                    shadeMul = Math.max(0, Math.min(1, this.Rngon.vector3.dot(thisNgon.normal, lightDirection)));
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
    for (let y = 0; y < renderHeight; y++)
    {
        for (let x = 0; x < renderWidth; x++)
        {
            const thisIdx = ((x + y * renderWidth) * 4);
            const shiftIdx = ((Math.min((renderWidth - 1), (x + 1)) + y * renderWidth) * 4);

            pixelBuffer[thisIdx + 0] = pixelBuffer[shiftIdx + 0];
        }
    }
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
