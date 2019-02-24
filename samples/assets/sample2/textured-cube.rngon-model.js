"use strict";

// A 3d model exported from Blender via the retro n-gon renderer's exporter.
//
// Usage:
//	- call .initialize(), which populates the .ngons array
//	- now you can access the n-gons via .ngons
//	- if you need .initialize() to finish before you start rendering, call it with await inside an async()=>{} wrapper
const texturedCubeModel =
{
	ngons:[],
	initialize: async function()
	{
		// Shorthands, for a smaller file size.
		const n = Rngon.ngon;
		const v = Rngon.vertex4;
		const c = Rngon.color_rgba;
		const ct = Rngon.texture_rgba.create_with_data_from_file;

		// Load the textures.
		const t = {
			"wood.png":await ct("./assets/sample2/wood.png.rngon-texture.json"),
			"painting.png":await ct("./assets/sample2/painting.png.rngon-texture.json"),
		};

		// Set up the materials.
		const m = {
			"crate":{color:c(163,163,163),texture:t["wood.png"],},
			"painting":{color:c(163,163,163),texture:t["painting.png"],},
		};

		// N-gons.
		this.ngons = Object.freeze(
		[
			// Parent mesh: Cube.
			n([v(1.0000,1.0000,-1.0000),v(1.0000,-1.0000,-1.0000),v(-1.0000,-1.0000,-1.0000),v(-1.0000,1.0000,-1.0000),],m["painting"]),
			n([v(1.0000,1.0000,1.0000),v(-1.0000,1.0000,1.0000),v(-1.0000,-1.0000,1.0000),v(1.0000,-1.0000,1.0000),],m["crate"]),
			n([v(1.0000,1.0000,-1.0000),v(1.0000,1.0000,1.0000),v(1.0000,-1.0000,1.0000),v(1.0000,-1.0000,-1.0000),],m["crate"]),
			n([v(1.0000,-1.0000,-1.0000),v(1.0000,-1.0000,1.0000),v(-1.0000,-1.0000,1.0000),v(-1.0000,-1.0000,-1.0000),],m["crate"]),
			n([v(-1.0000,-1.0000,-1.0000),v(-1.0000,-1.0000,1.0000),v(-1.0000,1.0000,1.0000),v(-1.0000,1.0000,-1.0000),],m["crate"]),
			n([v(1.0000,1.0000,1.0000),v(1.0000,1.0000,-1.0000),v(-1.0000,1.0000,-1.0000),v(-1.0000,1.0000,1.0000),],m["crate"]),
		]);
	}
};
