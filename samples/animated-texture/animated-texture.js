/*
 * 2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

import {scene} from "./scene.js";

export const sample = {
    initialize: async function()
    {
        await scene.initialize();
        parent.noise.seed(Math.random());

        scene.materials[0].texture = this.texture = Rngon.texture({
            width: 96,
            height: 96,
        });
    },
    tick: function()
    {
        this.numTicks++;
        
        this.perlin();

        // If mipmapping is enabled, you should regenerate the texture's mipmap levels. 
        //this.texture.regenerate_mipmaps();
 
        return {
            renderOptions: {
                useDepthBuffer: false,
            },
            mesh: Rngon.mesh(scene.ngons, {
                scale: Rngon.vector(30, 25, 25),
                rotate: Rngon.vector(20, -20, 0),
            }),
        };
    },
    perlin: function(z = this.numTicks/75, scale = 0.03)
    {
        for (let y = 0; y < this.texture.height; y++)
        {
            for (let x = 0; x < this.texture.width; x++)
            {
                const value = ((1 + parent.noise.perlin3(x * scale, y * scale, z)) / 2);
                const intensity = Math.floor(value * 255);

                const idx = ((x + y * this.texture.width) * 4);
                this.texture.pixels[idx+0] = intensity;
                this.texture.pixels[idx+1] = intensity;
                this.texture.pixels[idx+2] = intensity;
            }
        }
    },
    numTicks: 0,
    texture: undefined,
};
