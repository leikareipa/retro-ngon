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
		const ct = Rngon.texture_rgba.create_with_data_from_file;

		// Load the textures.
		const t = {
			"painting.png":await ct("./transparency/assets/textures/painting.rngon-texture.json"),
			"wood.png":await ct("./transparency/assets/textures/wood.rngon-texture.json"),
		};

		// Set up the materials.
		const m = {
			"Opaque":{color:c(255,255,255,255),texture:t["painting.png"],hasWireframe:true,textureMapping:"affine",},
			"SemiTransparent":{color:c(255,255,255,127),texture:t["painting.png"],hasWireframe:true,textureMapping:"affine",},
			"Transparent":{color:c(255,255,255,0),texture:t["painting.png"],hasWireframe:true,textureMapping:"affine",},
			"Plank":{color:c(255,255,255),texture:t["wood.png"],textureMapping:"affine",},
		};

		// Create the n-gons.
		this.ngons = Object.freeze(
		[
			n([v(-1.7544,0.7196,-3.4862,0.0001,0.0001),v(-1.7544,-0.3587,-3.4862,0.9999,0.0001),v(-1.7544,-0.3587,4.5138,0.9999,1.9999),v(-1.7544,0.7196,4.5138,0.0001,1.9999),],m["Plank"],no(1.0000,0.0000,0.0000)),
			n([v(-1.4954,-0.8191,2.0000,0.0001,0.0001),v(-1.4954,-0.8191,4.0000,0.9999,0.0001),v(-1.4954,1.1809,4.0000,0.9999,0.9999),v(-1.4954,1.1809,2.0000,0.0001,0.9999),],m["Transparent"],no(1.0000,0.0000,-0.0000)),
			n([v(-1.4954,-0.8191,-0.5000,0.0001,0.0001),v(-1.4954,-0.8191,1.5000,0.9999,0.0001),v(-1.4954,1.1809,1.5000,0.9999,0.9999),v(-1.4954,1.1809,-0.5000,0.0001,0.9999),],m["SemiTransparent"],no(1.0000,0.0000,-0.0000)),
			n([v(-1.4954,-0.8191,-3.0000,0.0001,0.0001),v(-1.4954,-0.8191,-1.0000,0.9999,0.0001),v(-1.4954,1.1809,-1.0000,0.9999,0.9999),v(-1.4954,1.1809,-3.0000,0.0001,0.9999),],m["Opaque"],no(1.0000,0.0000,-0.0000)),
		]);
	}
};
