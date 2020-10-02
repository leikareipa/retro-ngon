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

import {laraHome} from "./assets/home.rngon-model.js";
import * as lightmapCache from "./assets/lightmaps-textures.js"; // Pre-load the lightmap data.
import {first_person_camera} from "../first-person-camera/camera.js";
import {load_shade_maps_from_file,
        apply_shade_maps_to_ngons,
        duplicate_ngon_textures} from "../../tools/lightmap-baking/shademap-tools.js";

const camera = first_person_camera("canvas",
{
    position: {x: 49500, y: 1549, z: -32675},
    direction: {x: 0, y: 90, z: 0},
    movementSpeed: 1.8,
});

// The scene's textures prior to the application of any lightmaps.
const ORIGINAL_TEXTURES = [];

let CURRENT_LIGHTMAP_MODE = null;
let CURRENT_TEXTURING_MODE = null;

let SCENE_INITIALIZED = false;
(async()=>
{
    await laraHome.initialize();

    duplicate_ngon_textures(laraHome.ngons);

    for (const ngon of laraHome.ngons)
    {
        ORIGINAL_TEXTURES.push(Rngon.texture_rgba.deep_copy(ngon.material.texture));
    }

    SCENE_INITIALIZED = true;
})();

export const sample_scene = (frameCount = 0)=>
{
    if (!SCENE_INITIALIZED)
    {
        return Rngon.mesh([]);
    }

    // If the lightmapping mode has changed.
    if ((CURRENT_LIGHTMAP_MODE != parent.LIGHTMAP_MODE) ||
        (CURRENT_TEXTURING_MODE != parent.TEXTURING_MODE))
    {
        change_lightmap_mode(parent.LIGHTMAP_MODE, parent.TEXTURING_MODE);
    }

    camera.update();

    // Assumes 'renderSettings' is a pre-defined global object from which the
    // renderer will pick up its settings.
    renderSettings.cameraDirection = camera.direction;
    renderSettings.cameraPosition = camera.position;

    return Rngon.mesh(SCENE_INITIALIZED? laraHome.ngons : []);
};

export const sampleRenderOptions = {
    nearPlane: 100,
    farPlane: 25000,
    fov: 55,
};

async function change_lightmap_mode(newLightmapMode, newTexturingMode)
{
    function reset_ngons()
    {
        for (const [idx, ngon] of laraHome.ngons.entries())
        {
            ngon.material.texture = Rngon.texture_rgba.deep_copy(ORIGINAL_TEXTURES[idx]);

            if (newTexturingMode == "Off")
            {
                // Simulate texturing being off by coloring all texels white.
                ngon.material.texture.pixels.forEach(p=>{
                    p.red = 255;
                    p.green = 255;
                    p.blue = 255;
                });
            }

            ngon.material.renderVertexShade = ((newLightmapMode == "Textures (soft)")? false : true);
    
            for (const vertex of ngon.vertices)
            {
                vertex.shade = 1;
            }
        }
    }

    switch (newLightmapMode)
    {
        case "None":
        {
            reset_ngons();

            break;
        }
        case "Vertices":   
        {
            reset_ngons();

            let shadeIdx = 0;

            for (const ngon of laraHome.ngons)
			{
				for (const vertex of ngon.vertices)
				{
					vertex.shade = laraHome.vertexShade[shadeIdx++];
				}
            }
            
            break;
        }
        case "Textures":
        {
            const shadeMaps = await load_shade_maps_from_file("../../samples/lightmaps/assets/lightmaps-textures.js",
                                                              laraHome.ngons,
                                                              32, 32);

            reset_ngons();

            apply_shade_maps_to_ngons(shadeMaps, laraHome.ngons, "textures");
            
            break;
        }
    }

    CURRENT_LIGHTMAP_MODE = newLightmapMode;
    CURRENT_TEXTURING_MODE = newTexturingMode;

    return;
}
