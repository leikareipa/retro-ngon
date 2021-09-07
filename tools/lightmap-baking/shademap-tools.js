/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

import * as FileSaver from "./filesaver/FileSaver.js";

function verify_argument(condition = false)
{
    Rngon.assert && condition
                 || Rngon.throw("Invalid argument.");
}

export async function load_shade_maps_from_file(filename = "shade-maps.js",
                                                forNgons = [],
                                                maxShadeMapWidth = 2,
                                                maxShadeMapHeight = 2)
{
    verify_argument(typeof filename == "string");
    verify_argument(Array.isArray(forNgons));

    const shadeMapModule = await import(filename);
    const loadedShadeMaps = [];
    
    Rngon.assert && (shadeMapModule.SHADE_MAPS.length == forNgons.length)
                 || Rngon.throw("The shade map data does not appear compatible with these n-gons.");

    for (let i = 0; i < forNgons.length; i++)
    {
        const shadeMap = [];
        const texture = forNgons[i].material.texture;

        shadeMap.width = Math.max(2, Math.min(maxShadeMapWidth, texture.width));
        shadeMap.height = Math.max(2, Math.min(maxShadeMapHeight, texture.height));

        Rngon.assert && ((shadeMap.width * shadeMap.height) == shadeMapModule.SHADE_MAPS[i].length)
                     || Rngon.throw("The shade map data does not appear compatible with these n-gons.");

        for (let texelIdx = 0; texelIdx < (shadeMap.width * shadeMap.height); texelIdx++)
        {
            shadeMap.push(shadeMapModule.shade_value_at(i, texelIdx));
        }

        loadedShadeMaps.push(shadeMap);
    }

    return loadedShadeMaps;
}

// Note: Only supports texture shade maps.
export function save_shade_maps_to_file(shadeMaps = [],
                                        filename = "shade-maps.js")
{
    verify_argument(Array.isArray(shadeMaps));
    verify_argument(typeof filename == "string");

    const shadeMapsAsStrings = [];

    for (let i = 0; i < shadeMaps.length; i++)
    {
        const shadeMap = shadeMaps[i];
        shadeMapsAsStrings[i] = "[";

        for (let pixelIdx = 0; pixelIdx < (shadeMap.width * shadeMap.height); pixelIdx++)
        {
            shadeMapsAsStrings[i] += `{s:${shadeMap[pixelIdx].numSamples},l:${shadeMap[pixelIdx].accumulatedLight}},`;
        }

        shadeMapsAsStrings[i] += "]";
    }

    const exportFnString = "export function shade_value_at(mapIdx = 0, pixelIdx = 0)\n"+
                           "{\n"+
                           "    return {\n"+
                           "        accumulatedLight: SHADE_MAPS[mapIdx][pixelIdx].l,\n"+
                           "        numSamples: SHADE_MAPS[mapIdx][pixelIdx].s\n"+
                           "    };\n"+
                           "}\n";

    saveAs(new File([`export const SHADE_MAPS = [${shadeMapsAsStrings.join(",")}];\n${exportFnString}`],
                    filename,
                    {type: "text/plain;charset=utf-8"}));

    return;
}

// Applies the given shade maps' values to the given n-gons. If 'target' is
// "vertices", the shade maps are expected to be vertex shade maps; otherwise,
// 'target' should be "textures" and the shade maps should be vertex shade maps.
export function apply_shade_maps_to_ngons(shadeMaps = [],
                                          ngons = [],
                                          target = "vertices")
{
    verify_argument(Array.isArray(shadeMaps));
    verify_argument(Array.isArray(ngons));

    if (target == "vertices")
    {
        let shadeIdx = 0;

        for (const ngon of ngons)
        {
            for (const vertex of ngon.vertices)
            {
                vertex.shade = shadeMaps[shadeIdx++];
            }
        }
    }
    else if (target == "textures")
    {
        for (const [ngonIdx, ngon] of ngons.entries())
        {
            Rngon.assert && (ngon.material &&
                             ngon.material.texture)
                         || Rngon.throw("All n-gons must have a texture.");

            const texture = ngon.material.texture;
            const shadeMap = shadeMaps[ngonIdx];

            const deltaX = ((shadeMap.width - 1) / texture.width);
            const deltaY = ((shadeMap.height - 1) / texture.height);

            // Bilinearly interpolate shade values from the shade map onto the texture's
            // pixels.
            for (let y = 0; y < texture.height; y++)
            {
                for (let x = 0; x < texture.width; x++)
                {
                    const shadeMapX = Math.floor(x * deltaX);
                    const shadeMapY = Math.floor(y * deltaY);

                    const remainderX = ((x * deltaX) - shadeMapX);
                    const remainderY = ((y * deltaY) - shadeMapY);

                    const accumulatedLight = Rngon.bilinear_sample((ox, oy)=>
                    {
                        const x = Math.max(0, Math.min((shadeMapX + ox), (shadeMap.width - 1)));
                        const y = Math.max(0, Math.min((shadeMapY + oy), (shadeMap.height - 1)));

                        const light = shadeMap[x + y * shadeMap.width].accumulatedLight;
                        const samples = (shadeMap[x + y * shadeMap.width].numSamples || 1);

                        return (light / samples);
                    }, remainderX, remainderY);

                    const texel = texture.pixels[x + y * texture.width];
                    const shade = Math.max(0, accumulatedLight);
    
                    texel.red   = Math.max(0, Math.min(texel.red,   (texel.red   * shade)));
                    texel.green = Math.max(0, Math.min(texel.green, (texel.green * shade)));
                    texel.blue  = Math.max(0, Math.min(texel.blue,  (texel.blue  * shade)));
                }
            }
        }
    }
    else
    {
        Rngon.throw("Unknown target.");
    }

    return;
}

// Applies bilinear filtering to the given texture shade maps.
// Note: Only supports texture shade maps.
//
// WARNING: The shade maps' "numSamples" parameter will be set to 1.
export function bilinear_filter_shade_maps(shadeMaps = [],
                                           numLoops = 1)
{
    verify_argument(numLoops > 0);
    verify_argument(Array.isArray(shadeMaps));

    function value(element)
    {
        return Math.max(0, Math.min(1, (element.accumulatedLight / (element.numSamples || 1))));
    }

    for (const map of shadeMaps)
    {
        for (let loop = 0; loop < numLoops; loop++)
        {
            for (let y = 0; y < map.height; y++)
            {
                for (let x = 0; x < map.width; x++)
                {
                    const filteredPixel = Rngon.bilinear_sample((offsetX, offsetY)=>{
                        const tx = Math.max(0, Math.min((map.width - 1), (x + offsetX)));
                        const ty = Math.max(0, Math.min((map.height - 1), (y + offsetY)));
                        return value(map[tx + ty * map.width]);
                    });

                    map[x + y * map.width].accumulatedLight = filteredPixel;
                    map[x + y * map.width].numSamples = 1;
                }
            }
        }
    }

    return;
}

export function combined_shade_maps_sets(shadeMaps = [],
                                         ngons = [])
{
    verify_argument(Array.isArray(shadeMaps));
    verify_argument(Array.isArray(ngons));

    const combinedShadeMaps = [];

    for (let ngonIdx = 0; ngonIdx < ngons.length; ngonIdx++)
    {
        const shadeMap = [];

        shadeMap.width = shadeMaps[0][ngonIdx].width;
        shadeMap.height = shadeMaps[0][ngonIdx].height;

        for (let texelIdx = 0; texelIdx < (shadeMap.width * shadeMap.height); texelIdx++)
        {
            const accumulatedLight = shadeMaps.reduce((acc, set)=>(acc + set[ngonIdx][texelIdx].accumulatedLight), 0);
            const numSamples = shadeMaps.reduce((acc, set)=>(acc + set[ngonIdx][texelIdx].numSamples), 0);

            shadeMap.push({accumulatedLight, numSamples});
        }

        combinedShadeMaps.push(shadeMap);
    }

    return combinedShadeMaps;
}

// Creates a deep copy of each n-gon's texture. Untextured n-gons are assigned a deep
// copy of a blank texture whose color matches the polygon's material color.
export function duplicate_ngon_textures(ngons = [Rngon.ngon()])
{
    for (const ngon of ngons)
    {
        const texture = (ngon.material.texture || {width:64, height:64});
        const copiedPixels = new Array(texture.width * texture.height * 4);

        for (let t = 0; t < (texture.width * texture.height); t++)
        {
            const texelColor = (texture.pixels? texture.pixels[t] : ngon.material.color);

            copiedPixels[t*4+0] = texelColor.red;
            copiedPixels[t*4+1] = texelColor.green;
            copiedPixels[t*4+2] = texelColor.blue;
            copiedPixels[t*4+3] = texelColor.alpha;
        }

        const newTexture = Rngon.texture_rgba({
            width: texture.width,
            height: texture.height,
            pixels: copiedPixels,
            needsFlip: false,
        });
        
        ngon.material.texture = newTexture;

        // The renderer maps power-of-two and non-power-of-two affine texture
        // coordinates differently, and assumes that affine mapping is by default
        // applied only to power-of-two textures. So we should mark any non-power-
        // of-two affine textures as such.
        if (ngon.material.textureMapping === "affine")
        {
            let widthIsPOT = ((newTexture.width & (newTexture.width - 1)) === 0);
            let heightIsPOT = ((newTexture.height & (newTexture.height - 1)) === 0);

            if (newTexture.width === 0) widthIsPOT = false;
            if (newTexture.height === 0) heightIsPOT = false;

            if (!widthIsPOT || !heightIsPOT)
            {
                ngon.material.textureMapping = "affine-npot";
            }
        }
    }
    
    return;
}
