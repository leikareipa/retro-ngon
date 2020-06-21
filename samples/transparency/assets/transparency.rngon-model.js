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

import {textures as textureAtlas} from "./transparency.rngon-texture-atlas.js";

export const transparencyModel =
{
	ngons:[],
	initialize: async function()
	{
		// Shorthands.
		const n = Rngon.ngon;
		const no = Rngon.vector3; // Normal.
		const v = Rngon.vertex;
		const c = Rngon.color_rgba;

		// Load the textures.
		const t = {
			"wood.png":Rngon.texture_rgba(textureAtlas["wood"]),
			"painting.png":Rngon.texture_rgba(textureAtlas["painting"]),
		}; 

		// Set up the materials.
		const m = {
			"Plank":{color:c(255,255,255),texture:t["wood.png"],textureMapping:"affine",},
			"Surface1":{color:c(255,255,255,255),texture:t["painting.png"],hasWireframe:true,textureMapping:"affine",},
			"Surface2":{color:c(255,255,255,210),texture:t["painting.png"],hasWireframe:true,textureMapping:"affine",},
			"Surface3":{color:c(255,255,255,160),texture:t["painting.png"],hasWireframe:true,textureMapping:"affine",},
			"Surface4":{color:c(255,255,255,130),texture:t["painting.png"],hasWireframe:true,textureMapping:"affine",},
			"Surface5":{color:c(255,255,255,100),texture:t["painting.png"],hasWireframe:true,textureMapping:"affine",},
			"Surface6":{color:c(255,255,255,20),texture:t["painting.png"],hasWireframe:true,textureMapping:"affine",},
		};

		// Create the n-gons.
		this.ngons = Object.freeze(
		[
			// Mesh: Plane.
			n([v(-1.7544,2.1162,-3.4862,0.0001,0.0001),v(-1.7544,1.0379,-3.4862,0.9999,0.0001),v(-1.7544,1.0379,4.5138,0.9999,0.9999),v(-1.7544,2.1162,4.5138,0.0001,0.9999),],m["Plank"],no(1.0000,0.0000,0.0000)),
			// Mesh: Plane.001.
			n([v(-1.4954,0.5775,2.0000,0.0001,0.0001),v(-1.4954,0.5775,4.0000,0.9999,0.0001),v(-1.4954,2.5775,4.0000,0.9999,0.9999),v(-1.4954,2.5775,2.0000,0.0001,0.9999),],m["Surface3"],no(1.0000,0.0000,-0.0000)),
			// Mesh: Plane.002.
			n([v(-1.4954,0.5775,-0.5000,0.0001,0.0001),v(-1.4954,0.5775,1.5000,0.9999,0.0001),v(-1.4954,2.5775,1.5000,0.9999,0.9999),v(-1.4954,2.5775,-0.5000,0.0001,0.9999),],m["Surface2"],no(1.0000,0.0000,-0.0000)),
			// Mesh: Plane.003.
			n([v(-1.4954,0.5775,-3.0000,0.0001,0.0001),v(-1.4954,0.5775,-1.0000,0.9999,0.0001),v(-1.4954,2.5775,-1.0000,0.9999,0.9999),v(-1.4954,2.5775,-3.0000,0.0001,0.9999),],m["Surface1"],no(1.0000,0.0000,-0.0000)),
			// Mesh: Plane.007.
			n([v(-1.7544,-0.2281,-3.4862,0.0001,0.0001),v(-1.7544,-1.3064,-3.4862,0.9999,0.0001),v(-1.7544,-1.3064,4.5138,0.9999,0.9999),v(-1.7544,-0.2281,4.5138,0.0001,0.9999),],m["Plank"],no(1.0000,0.0000,0.0000)),
			// Mesh: Plane.006.
			n([v(-1.4954,-1.7668,2.0000,0.0001,0.0001),v(-1.4954,-1.7668,4.0000,0.9999,0.0001),v(-1.4954,0.2332,4.0000,0.9999,0.9999),v(-1.4954,0.2332,2.0000,0.0001,0.9999),],m["Surface6"],no(1.0000,0.0000,-0.0000)),
			// Mesh: Plane.005.
			n([v(-1.4954,-1.7668,-0.5000,0.0001,0.0001),v(-1.4954,-1.7668,1.5000,0.9999,0.0001),v(-1.4954,0.2332,1.5000,0.9999,0.9999),v(-1.4954,0.2332,-0.5000,0.0001,0.9999),],m["Surface5"],no(1.0000,0.0000,-0.0000)),
			// Mesh: Plane.004.
			n([v(-1.4954,-1.7668,-3.0000,0.0001,0.0001),v(-1.4954,-1.7668,-1.0000,0.9999,0.0001),v(-1.4954,0.2332,-1.0000,0.9999,0.9999),v(-1.4954,0.2332,-3.0000,0.0001,0.9999),],m["Surface4"],no(1.0000,0.0000,-0.0000)),
		]);
	}
};
