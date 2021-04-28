/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer / render sample
 * 
 */

"use strict";

import {laraHome} from "./assets/home.rngon-model.js";
import {first_person_camera} from "../first-person-camera/camera.js";
import * as lightmapTools from "../../tools/lightmap-baking/shademap-tools.js";

// Pre-load the lightmap data.
import * as lightmapCache from "./assets/texture-lightmaps.js";

export const sample = {
    initialize: async function()
    {
        this.camera = first_person_camera("canvas", {
            position: {x: 49500, y: 1549, z: -32675},
            direction: {x: 0, y: 90, z: 0},
            movementSpeed: 1.8,
        });

        await laraHome.initialize();

        lightmapTools.duplicate_ngon_textures(laraHome.ngons);

        for (const ngon of laraHome.ngons)
        {
            this.originalTextures.push(Rngon.texture_rgba.deep_copy(ngon.material.texture));
        }

        this.isSceneInitialized = true;
    },
    tick: function()
    {
        if (!this.isSceneInitialized)
        {
            return {
                renderOptions: {},
                mesh: Rngon.mesh([])
            };
        }

        this.numTicks++;
        this.camera.update();

        apply_current_lightmapping_mode.call(
            this,
            parent.LIGHTMAP_MODE,
            parent.TEXTURING_MODE
        );
    
        return {
            renderOptions: {
                nearPlane: 100,
                farPlane: 25000,
                fov: 55,
                cameraDirection: this.camera.direction,
                cameraPosition: this.camera.position,
            },
            mesh: Rngon.mesh(this.isSceneInitialized? laraHome.ngons : [])
        };
    },
    camera: undefined,
    numTicks: 0,
    lightmappingModes: ["None", "Vertex", "Texture"],
    texturingModes: ["Off", "On"],
    curLightmappingMode: undefined,
    curTexturingMode: undefined,
    originalTextures: [], // The scene's textures prior to the application of any lightmaps.
    isSceneInitialized: false,
};

// Assumes that 'this' points to the exported sample object.
async function apply_current_lightmapping_mode(newLightmapMode, newTexturingMode)
{
    // If no changes are needed.
    if ((this.curLightmappingMode === parent.LIGHTMAP_MODE) &&
        (this.curTexturingMode === parent.TEXTURING_MODE))
    {
        return;
    }

    const originalTextures = this.originalTextures;

    function reset_ngons()
    {
        for (const [idx, ngon] of laraHome.ngons.entries())
        {
            ngon.material.texture = Rngon.texture_rgba.deep_copy(originalTextures[idx]);

            if (newTexturingMode == "Off")
            {
                // Simulate texturing being off by coloring all texels white.
                ngon.material.texture.pixels.forEach(p=>{
                    p.red = 255;
                    p.green = 255;
                    p.blue = 255;
                });
            }

            ngon.material.renderVertexShade = ((newLightmapMode == "Texture")? false : true);
    
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
        case "Vertex":   
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
        case "Texture":
        {
            const shadeMaps = await lightmapTools.load_shade_maps_from_file(
                "../../samples/lightmaps/assets/texture-lightmaps.js",
                laraHome.ngons,
                32,
                32
            );

            reset_ngons();

            lightmapTools.apply_shade_maps_to_ngons(shadeMaps, laraHome.ngons, "textures");
            
            break;
        }
    }

    this.curLightmappingMode = newLightmapMode;
    this.curTexturingMode = newTexturingMode;

    return;
}
