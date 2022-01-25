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

// This is a modified version of the industry-standard Cornell box test.
export const cornellBox =
{
	ngons:[],
	textures:{},
	materials:{},
	initialize: async function()
	{
		// Shorthands.
		const n = Rngon.ngon;
		const no = Rngon.vector3; // Normal vector.
		const v = Rngon.vertex;
		const c = Rngon.color_rgba;
		const ct = Rngon.texture_rgba.create_with_data_from_file;
		let t; // Will point to this.textures.
		let m; // Will point to this.materials.

		// Load texture data.
		t = this.textures = Object.freeze({
		});

		m = this.materials = Object.freeze({
			"green":{color:c(255,255,5),isTwoSided:true,},
			"light":{color:c(255,255,255),isTwoSided:true},
			"red":{color:c(5,255,255),isTwoSided:true,},
			"white":{color:c(255,255,255),isTwoSided:true,},
			"floor":{color:c(240,240,240),isTwoSided:true,},
		});

		// Create the n-gons.
		this.ngons = Object.freeze([
			// Mesh: Mesh.
			n([v(-2.6537,-8.7973,-2.6273,0.3571,0.7286),v(2.6669,-8.7973,-2.6273,-276.0428,0.7286),v(2.6669,-14.1794,-2.6273,-276.0428,-278.8714),],m["floor"],no(-0.0000,-0.0000,1.0000)),
			n([v(-2.6537,-8.7973,-2.6273,0.3571,0.7286),v(2.6669,-14.1794,-2.6273,-276.0428,-278.8714),v(-2.6229,-14.1794,-2.6273,-1.2429,-278.8714),],m["floor"],no(-0.0000,-0.0000,1.0000)),
			n([v(2.6669,-14.1794,-2.6273,0.1286,0.7429),v(2.6669,-8.7973,-2.6273,279.7286,0.7429),v(2.6669,-8.7973,2.6547,279.7286,275.1429),],m["green"],no(-1.0000,0.0000,-0.0000)),
			n([v(2.6669,-14.1794,-2.6273,0.1286,0.7429),v(2.6669,-8.7973,2.6547,279.7286,275.1429),v(2.6669,-14.1794,2.6547,0.1286,275.1429),],m["green"],no(-1.0000,0.0000,-0.0000)),
			n([v(-2.6537,-8.7973,-2.6273,0.7286,0.7429),v(-2.6229,-14.1794,-2.6273,-278.8714,0.7429),v(-2.6845,-14.1794,2.6547,-278.8714,275.1429),],m["red"],no(0.9999,0.0057,0.0117)),
			n([v(-2.6537,-8.7973,-2.6273,0.7286,0.7429),v(-2.6845,-14.1794,2.6547,-278.8714,275.1429),v(-2.6845,-8.7973,2.6547,0.7286,275.1429),],m["red"],no(1.0000,-0.0000,0.0058)),
			n([v(1.4157,-9.4229,-1.0393,0.9571,0.2286),v(1.8776,-10.9629,-1.0393,-23.0429,-79.7714),v(0.3569,-11.4152,-1.0393,55.9571,-103.2714),],m["white"],no(-0.0000,-0.0000,1.0000)),
			n([v(1.4157,-9.4229,-1.0393,0.9571,0.2286),v(0.3569,-11.4152,-1.0393,55.9571,-103.2714),v(-0.1243,-9.8945,-1.0393,80.9571,-24.2714),],m["white"],no(-0.0000,-0.0000,1.0000)),
			n([v(-0.1243,-9.8945,-2.6273,0.7286,0.7429),v(-0.1243,-9.8945,-1.0393,0.7286,83.2429),v(0.3569,-11.4152,-1.0393,-78.2714,83.2429),],m["white"],no(-0.9534,-0.3017,-0.0000)),
			n([v(-0.1243,-9.8945,-2.6273,0.7286,0.7429),v(0.3569,-11.4152,-1.0393,-78.2714,83.2429),v(0.3569,-11.4152,-2.6273,-78.2714,0.7429),],m["white"],no(-0.9534,-0.3017,-0.0000)),
			n([v(1.4157,-9.4229,-2.6273,0.9571,0.7429),v(1.4157,-9.4229,-1.0393,0.9571,83.2429),v(-0.1243,-9.8945,-1.0393,80.9571,83.2429),],m["white"],no(-0.2928,0.9562,-0.0000)),
			n([v(1.4157,-9.4229,-2.6273,0.9571,0.7429),v(-0.1243,-9.8945,-1.0393,80.9571,83.2429),v(-0.1243,-9.8945,-2.6273,80.9571,0.7429),],m["white"],no(-0.2928,0.9562,-0.0000)),
			n([v(1.8776,-10.9629,-2.6273,0.2286,0.7429),v(1.8776,-10.9629,-1.0393,0.2286,83.2429),v(1.4157,-9.4229,-1.0393,80.2286,83.2429),],m["white"],no(0.9578,0.2873,0.0000)),
			n([v(1.8776,-10.9629,-2.6273,0.2286,0.7429),v(1.4157,-9.4229,-1.0393,80.2286,83.2429),v(1.4157,-9.4229,-2.6273,80.2286,0.7429),],m["white"],no(0.9578,0.2873,0.0000)),
			n([v(0.3569,-11.4152,-2.6273,0.9571,0.7429),v(0.3569,-11.4152,-1.0393,0.9571,83.2429),v(1.8776,-10.9629,-1.0393,-78.0429,83.2429),],m["white"],no(0.2851,-0.9585,0.0000)),
			n([v(0.3569,-11.4152,-2.6273,0.9571,0.7429),v(1.8776,-10.9629,-1.0393,-78.0429,83.2429),v(1.8776,-10.9629,-2.6273,-78.0429,0.7429),],m["white"],no(0.2851,-0.9585,0.0000)),
			n([v(-1.4044,-11.1746,0.5488,0.4571,0.2286),v(0.1163,-11.6462,0.5488,-78.5429,-24.2714),v(-0.3553,-13.1862,0.5488,-54.0429,-104.2714),],m["white"],no(-0.0000,-0.0000,1.0000)),
			n([v(-1.4044,-11.1746,0.5488,0.4571,0.2286),v(-0.3553,-13.1862,0.5488,-54.0429,-104.2714),v(-1.8760,-12.7049,0.5488,24.9571,-79.2714),],m["white"],no(-0.0000,-0.0000,1.0000)),
			n([v(-1.4044,-11.1746,-2.6273,0.2286,0.7429),v(-1.4044,-11.1746,0.5488,0.2286,165.7429),v(-1.8760,-12.7049,0.5488,-79.2714,165.7429),],m["white"],no(-0.9556,0.2945,-0.0000)),
			n([v(-1.4044,-11.1746,-2.6273,0.2286,0.7429),v(-1.8760,-12.7049,0.5488,-79.2714,165.7429),v(-1.8760,-12.7049,-2.6273,-79.2714,0.7429),],m["white"],no(-0.9556,0.2945,-0.0000)),
			n([v(-1.8760,-12.7049,-2.6273,0.9571,0.7429),v(-1.8760,-12.7049,0.5488,0.9571,165.7429),v(-0.3553,-13.1862,0.5488,-78.0429,165.7429),],m["white"],no(-0.3017,-0.9534,-0.0000)),
			n([v(-1.8760,-12.7049,-2.6273,0.9571,0.7429),v(-0.3553,-13.1862,0.5488,-78.0429,165.7429),v(-0.3553,-13.1862,-2.6273,-78.0429,0.7429),],m["white"],no(-0.3017,-0.9534,-0.0000)),
			n([v(-0.3553,-13.1862,-2.6273,0.7286,0.7429),v(-0.3553,-13.1862,0.5488,0.7286,165.7429),v(0.1163,-11.6462,0.5488,80.7286,165.7429),],m["white"],no(0.9562,-0.2928,0.0000)),
			n([v(-0.3553,-13.1862,-2.6273,0.7286,0.7429),v(0.1163,-11.6462,0.5488,80.7286,165.7429),v(0.1163,-11.6462,-2.6273,80.7286,0.7429),],m["white"],no(0.9562,-0.2928,0.0000)),
			n([v(0.1163,-11.6462,-2.6273,0.4571,0.7429),v(0.1163,-11.6462,0.5488,0.4571,165.7429),v(-1.4044,-11.1746,0.5488,79.4571,165.7429),],m["white"],no(0.2962,0.9551,0.0000)),
			n([v(0.1163,-11.6462,-2.6273,0.4571,0.7429),v(-1.4044,-11.1746,0.5488,79.4571,165.7429),v(-1.4044,-11.1746,-2.6273,79.4571,0.7429),],m["white"],no(0.2962,0.9551,0.0000)),
		]);
	}
};
