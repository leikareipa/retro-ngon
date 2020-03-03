"use strict";

// A 3d model exported from Blender via the retro n-gon renderer's exporter.
//
// Usage:
//	- call .initialize(), which populates the .ngons array
//	- now you can access the n-gons via .ngons
//	- if you need .initialize() to finish before you start rendering, call it with await inside an async()=>{} wrapper
export const texturedCubeModel =
{
	ngons:[],
	initialize: async function()
	{
		// Shorthands, for a smaller file size.
		const n = Rngon.ngon;
		const v = Rngon.vertex;
		const c = Rngon.color_rgba;
		const ct = Rngon.texture_rgba.create_with_data_from_file;

		// Load the textures.
		const t = {
			"wood":await ct("./textured-cube-model/assets/textures/wood.rngon-texture.json"),
			"painting":await ct("./textured-cube-model/assets/textures/painting.rngon-texture.json"),
		};

		// Set up the materials.
		const m = {
			"crate":{color:c(255,255,255),texture:t["wood"],textureMapping:"affine"},
			"painting":{color:c(255,255,255),texture:t["painting"],textureMapping:"affine"},
		};

		// N-gons.
		this.ngons = Object.freeze(
		[
			// Parent mesh: Cube.
			n([v(1.0000,1.0000,-1.0000,1,1),v(1.0000,-1.0000,-1.0000,1,0),v(-1.0000,-1.0000,-1.0000,0,0),v(-1.0000,1.0000,-1.0000,0,1),],m["painting"]),
			n([v(1.0000,1.0000,1.0000,0,1),v(-1.0000,1.0000,1.0000,1,1),v(-1.0000,-1.0000,1.0000,1,0),v(1.0000,-1.0000,1.0000,0,0),],m["crate"]),
			n([v(1.0000,1.0000,-1.0000,0,1),v(1.0000,1.0000,1.0000,1,1),v(1.0000,-1.0000,1.0000,1,0),v(1.0000,-1.0000,-1.0000,0,0),],m["crate"]),
			n([v(1.0000,-1.0000,-1.0000,1,1),v(1.0000,-1.0000,1.0000,1,0),v(-1.0000,-1.0000,1.0000,0,0),v(-1.0000,-1.0000,-1.0000,0,1),],m["crate"]),
			n([v(-1.0000,-1.0000,-1.0000,0,1),v(-1.0000,-1.0000,1.0000,1,1),v(-1.0000,1.0000,1.0000,1,0),v(-1.0000,1.0000,-1.0000,0,0),],m["crate"]),
			n([v(1.0000,1.0000,1.0000,1,1),v(1.0000,1.0000,-1.0000,1,0),v(-1.0000,1.0000,-1.0000,0,0),v(-1.0000,1.0000,1.0000,0,1),],m["crate"]),
		]);
	}
};
