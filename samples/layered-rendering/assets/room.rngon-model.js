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

import {textures as textureAtlas} from "./scene.rngon-texture-atlas.js";

export const room =
{
	ngons:[],
	initialize: async function()
	{
		// Shorthands.
		const n = Rngon.ngon;
		const no = Rngon.vector; // Normal.
		const v = Rngon.vertex;
		const c = Rngon.color;
		const ct = Rngon.texture.load;

		// Load the textures.
		const t = {
			"shrub":Rngon.texture(textureAtlas["shrub"]),
			"bark":Rngon.texture(textureAtlas["bark"]),
			"ground":Rngon.texture(textureAtlas["ground"]),
		};

		// Set up the materials.
		const m = {
			"Floor":{color:c(60,41,20),texture:t["ground"],textureMapping:"affine",},
			"Pillar":{color:c(163,126,88),texture:t["bark"],textureMapping:"affine",},
			"Wall":{color:c(163,72,27),texture:t["shrub"],textureMapping:"affine",},
		};

		// Create the n-gons.
		this.ngons = Object.freeze(
		[
			// Mesh: Trunk.001.
			n([v(-1.8272,-0.1505,1.7634,0.3817,0.4247),v(-1.8272,3.1495,1.7634,0.3817,2.0747),v(-1.8272,3.1495,2.2634,0.6317,2.0747),v(-1.8272,-0.1505,2.2634,0.6317,0.4247),],m["Pillar"],no(-1.0000,0.0000,-0.0000)),
			n([v(-1.8272,-0.1505,2.2634,0.5864,0.4247),v(-1.8272,3.1495,2.2634,0.5864,2.0747),v(-1.3272,3.1495,2.2634,0.8364,2.0747),v(-1.3272,-0.1505,2.2634,0.8364,0.4247),],m["Pillar"],no(0.0000,0.0000,1.0000)),
			n([v(-1.3272,-0.1505,2.2634,0.6317,0.4247),v(-1.3272,3.1495,2.2634,0.6317,2.0747),v(-1.3272,3.1495,1.7634,0.3817,2.0747),v(-1.3272,-0.1505,1.7634,0.3817,0.4247),],m["Pillar"],no(1.0000,0.0000,-0.0000)),
			n([v(-1.3272,-0.1505,1.7634,0.8364,0.4247),v(-1.3272,3.1495,1.7634,0.8364,2.0747),v(-1.8272,3.1495,1.7634,0.5864,2.0747),v(-1.8272,-0.1505,1.7634,0.5864,0.4247),],m["Pillar"],no(0.0000,0.0000,-1.0000)),
			n([v(-1.8272,-0.1505,2.2634,0.5864,0.6317),v(-1.3272,-0.1505,2.2634,0.8364,0.6317),v(-1.3272,-0.1505,1.7634,0.8364,0.3817),v(-1.8272,-0.1505,1.7634,0.5864,0.3817),],m["Pillar"],no(0.0000,-1.0000,0.0000)),
			n([v(-1.3272,3.1495,2.2634,0.8364,0.6317),v(-1.8272,3.1495,2.2634,0.5864,0.6317),v(-1.8272,3.1495,1.7634,0.5864,0.3817),v(-1.3272,3.1495,1.7634,0.8364,0.3817),],m["Pillar"],no(0.0000,1.0000,-0.0000)),
			// Mesh: House.
			n([v(5.1910,0.0006,3.2819,0.0000,0.0000),v(5.1910,0.0006,-3.7181,1.0000,0.0000),v(-4.3190,0.0006,-3.7181,1.0000,1.0000),v(-4.3190,0.0006,3.2819,0.0000,1.0000),],m["Floor"],no(0.0000,-1.0000,0.0000)),
			n([v(5.1910,3.0006,3.2819,0.0000,0.0000),v(-4.3190,3.0006,3.2819,1.0000,0.0000),v(-4.3191,3.0006,-3.7181,1.0000,1.0000),v(5.1910,3.0006,-3.7181,0.0000,1.0000),],m["Wall"],no(0.0000,1.0000,-0.0000)),
			n([v(5.1910,0.0006,3.2819,0.0000,0.0000),v(5.1910,3.0006,3.2819,1.0000,0.0000),v(5.1910,3.0006,-3.7181,1.0000,1.0000),v(5.1910,0.0006,-3.7181,0.0000,1.0000),],m["Wall"],no(1.0000,0.0000,-0.0000)),
			n([v(5.1910,0.0006,-3.7181,0.0000,0.0000),v(5.1910,3.0006,-3.7181,1.0000,0.0000),v(-4.3191,3.0006,-3.7181,1.0000,1.0000),v(-4.3190,0.0006,-3.7181,0.0000,1.0000),],m["Wall"],no(-0.0000,-0.0000,-1.0000)),
			n([v(-4.3190,0.0006,-3.7181,0.0000,0.0000),v(-4.3191,3.0006,-3.7181,1.0000,0.0000),v(-4.3190,3.0006,3.2819,1.0000,1.0000),v(-4.3190,0.0006,3.2819,0.0000,1.0000),],m["Wall"],no(-1.0000,-0.0000,0.0000)),
			n([v(5.1910,3.0006,3.2819,0.0000,0.0000),v(5.1910,0.0006,3.2819,1.0000,0.0000),v(-4.3190,0.0006,3.2819,1.0000,1.0000),v(-4.3190,3.0006,3.2819,0.0000,1.0000),],m["Wall"],no(0.0000,0.0000,1.0000)),
			// Mesh: Trunk.002.
			n([v(-3.3076,-0.1505,-0.4984,0.2508,0.4247),v(-3.3076,3.1495,-0.4984,0.2508,2.0747),v(-3.3076,3.1495,0.0016,0.5008,2.0747),v(-3.3076,-0.1505,0.0016,0.5008,0.4247),],m["Pillar"],no(-1.0000,0.0000,-0.0000)),
			n([v(-3.3076,-0.1505,0.0016,0.8462,0.4247),v(-3.3076,3.1495,0.0016,0.8462,2.0747),v(-2.8076,3.1495,0.0016,1.0962,2.0747),v(-2.8076,-0.1505,0.0016,1.0962,0.4247),],m["Pillar"],no(0.0000,0.0000,1.0000)),
			n([v(-2.8076,-0.1505,0.0016,0.5008,0.4247),v(-2.8076,3.1495,0.0016,0.5008,2.0747),v(-2.8076,3.1495,-0.4984,0.2508,2.0747),v(-2.8076,-0.1505,-0.4984,0.2508,0.4247),],m["Pillar"],no(1.0000,0.0000,-0.0000)),
			n([v(-2.8076,-0.1505,-0.4984,0.0962,0.4247),v(-2.8076,3.1495,-0.4984,0.0962,2.0747),v(-3.3076,3.1495,-0.4984,-0.1538,2.0747),v(-3.3076,-0.1505,-0.4984,-0.1538,0.4247),],m["Pillar"],no(0.0000,0.0000,-1.0000)),
			n([v(-3.3076,-0.1505,0.0016,0.8462,0.5008),v(-2.8076,-0.1505,0.0016,1.0962,0.5008),v(-2.8076,-0.1505,-0.4984,1.0962,0.2508),v(-3.3076,-0.1505,-0.4984,0.8462,0.2508),],m["Pillar"],no(0.0000,-1.0000,0.0000)),
			n([v(-2.8076,3.1495,0.0016,0.0962,0.5008),v(-3.3076,3.1495,0.0016,-0.1538,0.5008),v(-3.3076,3.1495,-0.4984,-0.1538,0.2508),v(-2.8076,3.1495,-0.4984,0.0962,0.2508),],m["Pillar"],no(0.0000,1.0000,-0.0000)),
			// Mesh: Trunk.003.
			n([v(-1.8272,-0.1505,-2.7275,0.1362,0.4247),v(-1.8272,3.1495,-2.7275,0.1362,2.0747),v(-1.8272,3.1495,-2.2275,0.3862,2.0747),v(-1.8272,-0.1505,-2.2275,0.3862,0.4247),],m["Pillar"],no(-1.0000,0.0000,-0.0000)),
			n([v(-1.8272,-0.1505,-2.2275,0.5864,0.4247),v(-1.8272,3.1495,-2.2275,0.5864,2.0747),v(-1.3272,3.1495,-2.2275,0.8364,2.0747),v(-1.3272,-0.1505,-2.2275,0.8364,0.4247),],m["Pillar"],no(0.0000,0.0000,1.0000)),
			n([v(-1.3272,-0.1505,-2.2275,0.3862,0.4247),v(-1.3272,3.1495,-2.2275,0.3862,2.0747),v(-1.3272,3.1495,-2.7275,0.1362,2.0747),v(-1.3272,-0.1505,-2.7275,0.1362,0.4247),],m["Pillar"],no(1.0000,0.0000,-0.0000)),
			n([v(-1.3272,-0.1505,-2.7275,0.8364,0.4247),v(-1.3272,3.1495,-2.7275,0.8364,2.0747),v(-1.8272,3.1495,-2.7275,0.5864,2.0747),v(-1.8272,-0.1505,-2.7275,0.5864,0.4247),],m["Pillar"],no(0.0000,0.0000,-1.0000)),
			n([v(-1.8272,-0.1505,-2.2275,0.5864,0.3862),v(-1.3272,-0.1505,-2.2275,0.8364,0.3862),v(-1.3272,-0.1505,-2.7275,0.8364,0.1362),v(-1.8272,-0.1505,-2.7275,0.5864,0.1362),],m["Pillar"],no(0.0000,-1.0000,0.0000)),
			n([v(-1.3272,3.1495,-2.2275,0.8364,0.3862),v(-1.8272,3.1495,-2.2275,0.5864,0.3862),v(-1.8272,3.1495,-2.7275,0.5864,0.1362),v(-1.3272,3.1495,-2.7275,0.8364,0.1362),],m["Pillar"],no(0.0000,1.0000,-0.0000)),
			// Mesh: Trunk.004.
			n([v(0.2052,-0.1505,1.7634,0.3817,0.4247),v(0.2052,3.1495,1.7634,0.3817,2.0747),v(0.2052,3.1495,2.2634,0.6317,2.0747),v(0.2052,-0.1505,2.2634,0.6317,0.4247),],m["Pillar"],no(-1.0000,0.0000,-0.0000)),
			n([v(0.2052,-0.1505,2.2634,0.6026,0.4247),v(0.2052,3.1495,2.2634,0.6026,2.0747),v(0.7052,3.1495,2.2634,0.8526,2.0747),v(0.7052,-0.1505,2.2634,0.8526,0.4247),],m["Pillar"],no(0.0000,0.0000,1.0000)),
			n([v(0.7052,-0.1505,2.2634,0.6317,0.4247),v(0.7052,3.1495,2.2634,0.6317,2.0747),v(0.7052,3.1495,1.7634,0.3817,2.0747),v(0.7052,-0.1505,1.7634,0.3817,0.4247),],m["Pillar"],no(1.0000,0.0000,-0.0000)),
			n([v(0.7052,-0.1505,1.7634,0.8526,0.4247),v(0.7052,3.1495,1.7634,0.8526,2.0747),v(0.2052,3.1495,1.7634,0.6026,2.0747),v(0.2052,-0.1505,1.7634,0.6026,0.4247),],m["Pillar"],no(0.0000,0.0000,-1.0000)),
			n([v(0.2052,-0.1505,2.2634,0.6026,0.6317),v(0.7052,-0.1505,2.2634,0.8526,0.6317),v(0.7052,-0.1505,1.7634,0.8526,0.3817),v(0.2052,-0.1505,1.7634,0.6026,0.3817),],m["Pillar"],no(0.0000,-1.0000,0.0000)),
			n([v(0.7052,3.1495,2.2634,0.8526,0.6317),v(0.2052,3.1495,2.2634,0.6026,0.6317),v(0.2052,3.1495,1.7634,0.6026,0.3817),v(0.7052,3.1495,1.7634,0.8526,0.3817),],m["Pillar"],no(0.0000,1.0000,-0.0000)),
			// Mesh: Trunk.005.
			n([v(2.1720,-0.1505,1.7634,0.3817,0.4247),v(2.1720,3.1495,1.7634,0.3817,2.0747),v(2.1720,3.1495,2.2634,0.6317,2.0747),v(2.1720,-0.1505,2.2634,0.6317,0.4247),],m["Pillar"],no(-1.0000,0.0000,-0.0000)),
			n([v(2.1720,-0.1505,2.2634,0.5860,0.4247),v(2.1720,3.1495,2.2634,0.5860,2.0747),v(2.6720,3.1495,2.2634,0.8360,2.0747),v(2.6720,-0.1505,2.2634,0.8360,0.4247),],m["Pillar"],no(0.0000,0.0000,1.0000)),
			n([v(2.6720,-0.1505,2.2634,0.6317,0.4247),v(2.6720,3.1495,2.2634,0.6317,2.0747),v(2.6720,3.1495,1.7634,0.3817,2.0747),v(2.6720,-0.1505,1.7634,0.3817,0.4247),],m["Pillar"],no(1.0000,0.0000,-0.0000)),
			n([v(2.6720,-0.1505,1.7634,0.8360,0.4247),v(2.6720,3.1495,1.7634,0.8360,2.0747),v(2.1720,3.1495,1.7634,0.5860,2.0747),v(2.1720,-0.1505,1.7634,0.5860,0.4247),],m["Pillar"],no(0.0000,0.0000,-1.0000)),
			n([v(2.1720,-0.1505,2.2634,0.5860,0.6317),v(2.6720,-0.1505,2.2634,0.8360,0.6317),v(2.6720,-0.1505,1.7634,0.8360,0.3817),v(2.1720,-0.1505,1.7634,0.5860,0.3817),],m["Pillar"],no(0.0000,-1.0000,0.0000)),
			n([v(2.6720,3.1495,2.2634,0.8360,0.6317),v(2.1720,3.1495,2.2634,0.5860,0.6317),v(2.1720,3.1495,1.7634,0.5860,0.3817),v(2.6720,3.1495,1.7634,0.8360,0.3817),],m["Pillar"],no(0.0000,1.0000,-0.0000)),
			// Mesh: Trunk.006.
			n([v(3.7724,-0.1505,-0.4984,0.2508,0.4247),v(3.7724,3.1495,-0.4984,0.2508,2.0747),v(3.7724,3.1495,0.0016,0.5008,2.0747),v(3.7724,-0.1505,0.0016,0.5008,0.4247),],m["Pillar"],no(-1.0000,0.0000,-0.0000)),
			n([v(3.7724,-0.1505,0.0016,0.3862,0.4247),v(3.7724,3.1495,0.0016,0.3862,2.0747),v(4.2724,3.1495,0.0016,0.6362,2.0747),v(4.2724,-0.1505,0.0016,0.6362,0.4247),],m["Pillar"],no(0.0000,0.0000,1.0000)),
			n([v(4.2724,-0.1505,0.0016,0.5008,0.4247),v(4.2724,3.1495,0.0016,0.5008,2.0747),v(4.2724,3.1495,-0.4984,0.2508,2.0747),v(4.2724,-0.1505,-0.4984,0.2508,0.4247),],m["Pillar"],no(1.0000,0.0000,-0.0000)),
			n([v(4.2724,-0.1505,-0.4984,0.6362,0.4247),v(4.2724,3.1495,-0.4984,0.6362,2.0747),v(3.7724,3.1495,-0.4984,0.3862,2.0747),v(3.7724,-0.1505,-0.4984,0.3862,0.4247),],m["Pillar"],no(0.0000,0.0000,-1.0000)),
			n([v(3.7724,-0.1505,0.0016,0.3862,0.5008),v(4.2724,-0.1505,0.0016,0.6362,0.5008),v(4.2724,-0.1505,-0.4984,0.6362,0.2508),v(3.7724,-0.1505,-0.4984,0.3862,0.2508),],m["Pillar"],no(0.0000,-1.0000,0.0000)),
			n([v(4.2724,3.1495,0.0016,0.6362,0.5008),v(3.7724,3.1495,0.0016,0.3862,0.5008),v(3.7724,3.1495,-0.4984,0.3862,0.2508),v(4.2724,3.1495,-0.4984,0.6362,0.2508),],m["Pillar"],no(0.0000,1.0000,-0.0000)),
			// Mesh: Trunk.007.
			n([v(2.2048,-0.1505,-2.7275,0.1362,0.4247),v(2.2048,3.1495,-2.7275,0.1362,2.0747),v(2.2048,3.1495,-2.2275,0.3862,2.0747),v(2.2048,-0.1505,-2.2275,0.3862,0.4247),],m["Pillar"],no(-1.0000,0.0000,-0.0000)),
			n([v(2.2048,-0.1505,-2.2275,0.6024,0.4247),v(2.2048,3.1495,-2.2275,0.6024,2.0747),v(2.7048,3.1495,-2.2275,0.8524,2.0747),v(2.7048,-0.1505,-2.2275,0.8524,0.4247),],m["Pillar"],no(0.0000,0.0000,1.0000)),
			n([v(2.7048,-0.1505,-2.2275,0.3862,0.4247),v(2.7048,3.1495,-2.2275,0.3862,2.0747),v(2.7048,3.1495,-2.7275,0.1362,2.0747),v(2.7048,-0.1505,-2.7275,0.1362,0.4247),],m["Pillar"],no(1.0000,0.0000,-0.0000)),
			n([v(2.7048,-0.1505,-2.7275,0.8524,0.4247),v(2.7048,3.1495,-2.7275,0.8524,2.0747),v(2.2048,3.1495,-2.7275,0.6024,2.0747),v(2.2048,-0.1505,-2.7275,0.6024,0.4247),],m["Pillar"],no(0.0000,0.0000,-1.0000)),
			n([v(2.2048,-0.1505,-2.2275,0.6024,0.3862),v(2.7048,-0.1505,-2.2275,0.8524,0.3862),v(2.7048,-0.1505,-2.7275,0.8524,0.1362),v(2.2048,-0.1505,-2.7275,0.6024,0.1362),],m["Pillar"],no(0.0000,-1.0000,0.0000)),
			n([v(2.7048,3.1495,-2.2275,0.8524,0.3862),v(2.2048,3.1495,-2.2275,0.6024,0.3862),v(2.2048,3.1495,-2.7275,0.6024,0.1362),v(2.7048,3.1495,-2.7275,0.8524,0.1362),],m["Pillar"],no(0.0000,1.0000,-0.0000)),
			// Mesh: Trunk.008.
			n([v(0.2052,-0.1505,-2.7249,0.1376,0.4247),v(0.2052,3.1495,-2.7249,0.1376,2.0747),v(0.2052,3.1495,-2.2249,0.3876,2.0747),v(0.2052,-0.1505,-2.2249,0.3876,0.4247),],m["Pillar"],no(-1.0000,0.0000,-0.0000)),
			n([v(0.2052,-0.1505,-2.2249,0.6026,0.4247),v(0.2052,3.1495,-2.2249,0.6026,2.0747),v(0.7052,3.1495,-2.2249,0.8526,2.0747),v(0.7052,-0.1505,-2.2249,0.8526,0.4247),],m["Pillar"],no(0.0000,0.0000,1.0000)),
			n([v(0.7052,-0.1505,-2.2249,0.3876,0.4247),v(0.7052,3.1495,-2.2249,0.3876,2.0747),v(0.7052,3.1495,-2.7249,0.1376,2.0747),v(0.7052,-0.1505,-2.7249,0.1376,0.4247),],m["Pillar"],no(1.0000,0.0000,-0.0000)),
			n([v(0.7052,-0.1505,-2.7249,0.8526,0.4247),v(0.7052,3.1495,-2.7249,0.8526,2.0747),v(0.2052,3.1495,-2.7249,0.6026,2.0747),v(0.2052,-0.1505,-2.7249,0.6026,0.4247),],m["Pillar"],no(0.0000,0.0000,-1.0000)),
			n([v(0.2052,-0.1505,-2.2249,0.6026,0.3876),v(0.7052,-0.1505,-2.2249,0.8526,0.3876),v(0.7052,-0.1505,-2.7249,0.8526,0.1376),v(0.2052,-0.1505,-2.7249,0.6026,0.1376),],m["Pillar"],no(0.0000,-1.0000,0.0000)),
			n([v(0.7052,3.1495,-2.2249,0.8526,0.3876),v(0.2052,3.1495,-2.2249,0.6026,0.3876),v(0.2052,3.1495,-2.7249,0.6026,0.1376),v(0.7052,3.1495,-2.7249,0.8526,0.1376),],m["Pillar"],no(0.0000,1.0000,-0.0000)),
		]);
	}
};
