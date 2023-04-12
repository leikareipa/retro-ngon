/*
 * A 3d model exported from Blender using the retro n-gon renderer's exporter.
 *
 * Usage:
 *    - call .initialize(), which populates the .ngons array
 *    - now you can access the n-gons via .ngons
 *    - if you need .initialize() to finish before you start rendering, call it with await inside an async()=>{} wrapper
 *
 */

"use strict";

import {textures as textureAtlas} from "./mipmapping.rngon-texture-atlas.js";

export const scene =
{
	ngons:[],
	initialize: async function()
	{
		// Shorthands.
		const n = Rngon.ngon;
		const no = Rngon.vector; // Normal.
		const v = Rngon.vertex;
		const c = Rngon.color_rgba;

		// Load the textures.
		const t = {
			"painting.png":Rngon.texture(textureAtlas["painting"]),
		};

		// Set up the materials.
		const m = {
			"Mipmapped":{color:c(255,255,255),texture:t["painting.png"],textureMapping:"affine",hasMipmapping:true},
			"NonMipmapped":{color:c(255,255,255),texture:t["painting.png"],textureMapping:"affine",hasMipmapping:false},
		};

		// Create the n-gons.
		this.ngons = Object.freeze(
		[
			// Mesh: Plane.001.
			n([v(-1.4954,0.5775,2.0000,0.0001,0.0001),v(-1.4954,0.5775,4.0000,0.9999,0.0001),v(-1.4954,2.5775,4.0000,0.9999,0.9999),v(-1.4954,2.5775,2.0000,0.0001,0.9999),],m["Mipmapped"],no(1.0000,0.0000,-0.0000)),
			// Mesh: Plane.002.
			n([v(-1.4954,0.5775,-0.5000,0.0001,0.0001),v(-1.4954,0.5775,1.5000,0.9999,0.0001),v(-1.4954,2.5775,1.5000,0.9999,0.9999),v(-1.4954,2.5775,-0.5000,0.0001,0.9999),],m["NonMipmapped"],no(1.0000,0.0000,-0.0000)),
		]);
	}
};
