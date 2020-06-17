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

export const scene =
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
			"shrub":await ct("./pixel-shaders/assets/textures/shrub.rngon-texture.json"),
			"bark":await ct("./pixel-shaders/assets/textures/bark.rngon-texture.json"),
			"ground":await ct("./pixel-shaders/assets/textures/ground.rngon-texture.json"),
		});

		m = this.materials = Object.freeze({
			"Floor":{color:c(60,41,20),texture:t["ground"],textureMapping:"affine",},
			"Object":{color:c(230,230,230),texture:t["bark"],textureMapping:"affine",isBacklit:true,
																					 isNeverGrayscale:true,
																					 hasHalo:true,
																					 isInFocus:true,
																					 hasNoScanlines:true,
																					 vertexShading:"gouraud",
																					 renderVertexShade:false},
			"Pillar":{color:c(163,126,88),texture:t["bark"],textureMapping:"affine",blendTexture:t["shrub"],},
			"Wall":{color:c(163,72,27),texture:t["shrub"],textureMapping:"affine",},
		});

		// Create the n-gons.
		this.ngons = Object.freeze([
			// Mesh: Sphere.
			n([v(0.4803,0.6770,-0.2664,0.4420,0.6986),v(0.5994,0.7188,-0.3529,0.4361,0.6720),v(0.4349,0.7188,-0.4064,0.4115,0.7054),],m["Object"],[no(0.0000,-1.0000,0.0000),no(0.4253,-0.8506,-0.3090),no(-0.1625,-0.8506,-0.5000)]),
			n([v(0.6829,0.8318,-0.4136,0.4347,0.6738),v(0.5994,0.7188,-0.3529,0.4361,0.6720),v(0.7185,0.8098,-0.2664,0.4589,0.6703),],m["Object"],[no(0.7236,-0.4472,-0.5257),no(0.4253,-0.8506,-0.3090),no(0.8506,-0.5257,0.0000)]),
			n([v(0.4803,0.6770,-0.2664,0.4420,0.6986),v(0.4349,0.7188,-0.4064,0.4115,0.7054),v(0.3331,0.7188,-0.2664,0.4285,0.7502),],m["Object"],[no(0.0000,-1.0000,0.0000),no(-0.1625,-0.8506,-0.5000),no(-0.5257,-0.8506,0.0000)]),
			n([v(0.4803,0.6770,-0.2664,0.4420,0.6986),v(0.3331,0.7188,-0.2664,0.4285,0.7502),v(0.4349,0.7188,-0.1264,0.4714,0.7309),],m["Object"],[no(0.0000,-1.0000,0.0000),no(-0.5257,-0.8506,0.0000),no(-0.1625,-0.8506,0.5000)]),
			n([v(0.4803,0.6770,-0.2664,0.4420,0.6986),v(0.4349,0.7188,-0.1264,0.4714,0.7309),v(0.5994,0.7188,-0.1798,0.4676,0.6822),],m["Object"],[no(0.0000,-1.0000,0.0000),no(-0.1625,-0.8506,0.5000),no(0.4253,-0.8506,0.3090)]),
			n([v(0.6829,0.8318,-0.4136,0.4347,0.6738),v(0.7185,0.8098,-0.2664,0.4589,0.6703),v(0.7466,0.9570,-0.3529,0.4491,0.6871),],m["Object"],[no(0.7236,-0.4472,-0.5257),no(0.8506,-0.5257,0.0000),no(0.9510,0.0000,-0.3090)]),
			n([v(0.4029,0.8318,-0.5045,0.3954,0.7226),v(0.5539,0.8098,-0.4929,0.4124,0.6888),v(0.4803,0.9570,-0.5464,0.4017,0.7231),],m["Object"],[no(-0.2764,-0.4472,-0.8506),no(0.2629,-0.5257,-0.8090),no(0.0000,0.0000,-1.0000)]),
			n([v(0.2299,0.8318,-0.2664,0.4191,0.7991),v(0.2876,0.8098,-0.4064,0.3958,0.7588),v(0.2140,0.9570,-0.3529,0.4018,0.8052),],m["Object"],[no(-0.8944,-0.4472,0.0000),no(-0.6882,-0.5257,-0.5000),no(-0.9510,0.0000,-0.3090)]),
			n([v(0.4029,0.8318,-0.0282,0.4958,0.7639),v(0.2876,0.8098,-0.1264,0.4639,0.7939),v(0.3158,0.9570,-0.0398,0.4916,0.8058),],m["Object"],[no(-0.2764,-0.4472,0.8506),no(-0.6882,-0.5257,0.5000),no(-0.5878,0.0000,0.8090)]),
			n([v(0.6829,0.8318,-0.1192,0.4825,0.6873),v(0.5539,0.8098,-0.0398,0.4951,0.7165),v(0.6449,0.9570,-0.0398,0.4963,0.7188),],m["Object"],[no(0.7236,-0.4472,0.5257),no(0.2629,-0.5257,0.8090),no(0.5878,0.0000,0.8090)]),
			n([v(0.6829,0.8318,-0.4136,0.4347,0.6738),v(0.7466,0.9570,-0.3529,0.4491,0.6871),v(0.6449,0.9570,-0.4929,0.4233,0.6972),],m["Object"],[no(0.7236,-0.4472,-0.5257),no(0.9510,0.0000,-0.3090),no(0.5878,0.0000,-0.8090)]),
			n([v(0.4029,0.8318,-0.5045,0.3954,0.7226),v(0.4803,0.9570,-0.5464,0.4017,0.7231),v(0.3158,0.9570,-0.4929,0.3907,0.7621),],m["Object"],[no(-0.2764,-0.4472,-0.8506),no(0.0000,0.0000,-1.0000),no(-0.5878,0.0000,-0.8090)]),
			n([v(0.2299,0.8318,-0.2664,0.4191,0.7991),v(0.2140,0.9570,-0.3529,0.4018,0.8052),v(0.2140,0.9570,-0.1798,0.4452,0.8277),],m["Object"],[no(-0.8944,-0.4472,0.0000),no(-0.9510,0.0000,-0.3090),no(-0.9510,0.0000,0.3090)]),
			n([v(0.4029,0.8318,-0.0282,0.4958,0.7639),v(0.3158,0.9570,-0.0398,0.4916,0.8058),v(0.4803,0.9570,0.0136,0.5060,0.7597),],m["Object"],[no(-0.2764,-0.4472,0.8506),no(-0.5878,0.0000,0.8090),no(0.0000,0.0000,1.0000)]),
			n([v(0.6829,0.8318,-0.1192,0.4825,0.6873),v(0.6449,0.9570,-0.0398,0.4963,0.7188),v(0.7466,0.9570,-0.1798,0.4749,0.6940),],m["Object"],[no(0.7236,-0.4472,0.5257),no(0.5878,0.0000,0.8090),no(0.9510,0.0000,0.3090)]),
			n([v(0.5577,1.0822,-0.5045,0.4177,0.7307),v(0.6730,1.1042,-0.4064,0.4398,0.7195),v(0.5258,1.1952,-0.4064,0.4319,0.7583),],m["Object"],[no(0.2764,0.4472,-0.8506),no(0.6882,0.5257,-0.5000),no(0.1625,0.8506,-0.5000)]),
			n([v(0.2777,1.0822,-0.4136,0.4038,0.7957),v(0.4067,1.1042,-0.4929,0.4062,0.7629),v(0.3612,1.1952,-0.3529,0.4274,0.7957),],m["Object"],[no(-0.7236,0.4472,-0.5257),no(-0.2629,0.5257,-0.8090),no(-0.4253,0.8506,-0.3090)]),
			n([v(0.2777,1.0822,-0.1192,0.4699,0.8243),v(0.2422,1.1042,-0.2664,0.4305,0.8232),v(0.3612,1.1952,-0.1798,0.4619,0.8088),],m["Object"],[no(-0.7236,0.4472,0.5257),no(-0.8506,0.5257,0.0000),no(-0.4253,0.8506,0.3090)]),
			n([v(0.5577,1.0822,-0.0282,0.4978,0.7561),v(0.4067,1.1042,-0.0398,0.4937,0.7950),v(0.5258,1.1952,-0.1264,0.4793,0.7737),],m["Object"],[no(0.2764,0.4472,0.8506),no(-0.2629,0.5257,0.8090),no(0.1625,0.8506,0.5000)]),
			n([v(0.7308,1.0822,-0.2664,0.4624,0.7128),v(0.6730,1.1042,-0.1264,0.4825,0.7318),v(0.6275,1.1952,-0.2664,0.4594,0.7470),],m["Object"],[no(0.8944,0.4472,0.0000),no(0.6882,0.5257,0.5000),no(0.5257,0.8506,0.0000)]),
			n([v(0.6275,1.1952,-0.2664,0.4594,0.7470),v(0.5258,1.1952,-0.1264,0.4793,0.7737),v(0.4803,1.2370,-0.2664,0.4526,0.7812),],m["Object"],[no(0.5257,0.8506,0.0000),no(0.1625,0.8506,0.5000),no(0.0000,1.0000,0.0000)]),
			n([v(0.6275,1.1952,-0.2664,0.4594,0.7470),v(0.6730,1.1042,-0.1264,0.4825,0.7318),v(0.5258,1.1952,-0.1264,0.4793,0.7737),],m["Object"],[no(0.5257,0.8506,0.0000),no(0.6882,0.5257,0.5000),no(0.1625,0.8506,0.5000)]),
			n([v(0.6730,1.1042,-0.1264,0.4825,0.7318),v(0.5577,1.0822,-0.0282,0.4978,0.7561),v(0.5258,1.1952,-0.1264,0.4793,0.7737),],m["Object"],[no(0.6882,0.5257,0.5000),no(0.2764,0.4472,0.8506),no(0.1625,0.8506,0.5000)]),
			n([v(0.5258,1.1952,-0.1264,0.4793,0.7737),v(0.3612,1.1952,-0.1798,0.4619,0.8088),v(0.4803,1.2370,-0.2664,0.4526,0.7812),],m["Object"],[no(0.1625,0.8506,0.5000),no(-0.4253,0.8506,0.3090),no(0.0000,1.0000,0.0000)]),
			n([v(0.5258,1.1952,-0.1264,0.4793,0.7737),v(0.4067,1.1042,-0.0398,0.4937,0.7950),v(0.3612,1.1952,-0.1798,0.4619,0.8088),],m["Object"],[no(0.1625,0.8506,0.5000),no(-0.2629,0.5257,0.8090),no(-0.4253,0.8506,0.3090)]),
			n([v(0.4067,1.1042,-0.0398,0.4937,0.7950),v(0.2777,1.0822,-0.1192,0.4699,0.8243),v(0.3612,1.1952,-0.1798,0.4619,0.8088),],m["Object"],[no(-0.2629,0.5257,0.8090),no(-0.7236,0.4472,0.5257),no(-0.4253,0.8506,0.3090)]),
			n([v(0.3612,1.1952,-0.1798,0.4619,0.8088),v(0.3612,1.1952,-0.3529,0.4274,0.7957),v(0.4803,1.2370,-0.2664,0.4526,0.7812),],m["Object"],[no(-0.4253,0.8506,0.3090),no(-0.4253,0.8506,-0.3090),no(0.0000,1.0000,0.0000)]),
			n([v(0.3612,1.1952,-0.1798,0.4619,0.8088),v(0.2422,1.1042,-0.2664,0.4305,0.8232),v(0.3612,1.1952,-0.3529,0.4274,0.7957),],m["Object"],[no(-0.4253,0.8506,0.3090),no(-0.8506,0.5257,0.0000),no(-0.4253,0.8506,-0.3090)]),
			n([v(0.2422,1.1042,-0.2664,0.4305,0.8232),v(0.2777,1.0822,-0.4136,0.4038,0.7957),v(0.3612,1.1952,-0.3529,0.4274,0.7957),],m["Object"],[no(-0.8506,0.5257,0.0000),no(-0.7236,0.4472,-0.5257),no(-0.4253,0.8506,-0.3090)]),
			n([v(0.3612,1.1952,-0.3529,0.4274,0.7957),v(0.5258,1.1952,-0.4064,0.4319,0.7583),v(0.4803,1.2370,-0.2664,0.4526,0.7812),],m["Object"],[no(-0.4253,0.8506,-0.3090),no(0.1625,0.8506,-0.5000),no(0.0000,1.0000,0.0000)]),
			n([v(0.3612,1.1952,-0.3529,0.4274,0.7957),v(0.4067,1.1042,-0.4929,0.4062,0.7629),v(0.5258,1.1952,-0.4064,0.4319,0.7583),],m["Object"],[no(-0.4253,0.8506,-0.3090),no(-0.2629,0.5257,-0.8090),no(0.1625,0.8506,-0.5000)]),
			n([v(0.4067,1.1042,-0.4929,0.4062,0.7629),v(0.5577,1.0822,-0.5045,0.4177,0.7307),v(0.5258,1.1952,-0.4064,0.4319,0.7583),],m["Object"],[no(-0.2629,0.5257,-0.8090),no(0.2764,0.4472,-0.8506),no(0.1625,0.8506,-0.5000)]),
			n([v(0.5258,1.1952,-0.4064,0.4319,0.7583),v(0.6275,1.1952,-0.2664,0.4594,0.7470),v(0.4803,1.2370,-0.2664,0.4526,0.7812),],m["Object"],[no(0.1625,0.8506,-0.5000),no(0.5257,0.8506,0.0000),no(0.0000,1.0000,0.0000)]),
			n([v(0.5258,1.1952,-0.4064,0.4319,0.7583),v(0.6730,1.1042,-0.4064,0.4398,0.7195),v(0.6275,1.1952,-0.2664,0.4594,0.7470),],m["Object"],[no(0.1625,0.8506,-0.5000),no(0.6882,0.5257,-0.5000),no(0.5257,0.8506,0.0000)]),
			n([v(0.6730,1.1042,-0.4064,0.4398,0.7195),v(0.7308,1.0822,-0.2664,0.4624,0.7128),v(0.6275,1.1952,-0.2664,0.4594,0.7470),],m["Object"],[no(0.6882,0.5257,-0.5000),no(0.8944,0.4472,0.0000),no(0.5257,0.8506,0.0000)]),
			n([v(0.7466,0.9570,-0.1798,0.4749,0.6940),v(0.6730,1.1042,-0.1264,0.4825,0.7318),v(0.7308,1.0822,-0.2664,0.4624,0.7128),],m["Object"],[no(0.9510,0.0000,0.3090),no(0.6882,0.5257,0.5000),no(0.8944,0.4472,0.0000)]),
			n([v(0.7466,0.9570,-0.1798,0.4749,0.6940),v(0.6449,0.9570,-0.0398,0.4963,0.7188),v(0.6730,1.1042,-0.1264,0.4825,0.7318),],m["Object"],[no(0.9510,0.0000,0.3090),no(0.5878,0.0000,0.8090),no(0.6882,0.5257,0.5000)]),
			n([v(0.6449,0.9570,-0.0398,0.4963,0.7188),v(0.5577,1.0822,-0.0282,0.4978,0.7561),v(0.6730,1.1042,-0.1264,0.4825,0.7318),],m["Object"],[no(0.5878,0.0000,0.8090),no(0.2764,0.4472,0.8506),no(0.6882,0.5257,0.5000)]),
			n([v(0.4803,0.9570,0.0136,0.5060,0.7597),v(0.4067,1.1042,-0.0398,0.4937,0.7950),v(0.5577,1.0822,-0.0282,0.4978,0.7561),],m["Object"],[no(0.0000,0.0000,1.0000),no(-0.2629,0.5257,0.8090),no(0.2764,0.4472,0.8506)]),
			n([v(0.4803,0.9570,0.0136,0.5060,0.7597),v(0.3158,0.9570,-0.0398,0.4916,0.8058),v(0.4067,1.1042,-0.0398,0.4937,0.7950),],m["Object"],[no(0.0000,0.0000,1.0000),no(-0.5878,0.0000,0.8090),no(-0.2629,0.5257,0.8090)]),
			n([v(0.3158,0.9570,-0.0398,0.4916,0.8058),v(0.2777,1.0822,-0.1192,0.4699,0.8243),v(0.4067,1.1042,-0.0398,0.4937,0.7950),],m["Object"],[no(-0.5878,0.0000,0.8090),no(-0.7236,0.4472,0.5257),no(-0.2629,0.5257,0.8090)]),
			n([v(0.2140,0.9570,-0.1798,0.4452,0.8277),v(0.2422,1.1042,-0.2664,0.4305,0.8232),v(0.2777,1.0822,-0.1192,0.4699,0.8243),],m["Object"],[no(-0.9510,0.0000,0.3090),no(-0.8506,0.5257,0.0000),no(-0.7236,0.4472,0.5257)]),
			n([v(0.2140,0.9570,-0.1798,0.4452,0.8277),v(0.2140,0.9570,-0.3529,0.4018,0.8052),v(0.2422,1.1042,-0.2664,0.4305,0.8232),],m["Object"],[no(-0.9510,0.0000,0.3090),no(-0.9510,0.0000,-0.3090),no(-0.8506,0.5257,0.0000)]),
			n([v(0.2140,0.9570,-0.3529,0.4018,0.8052),v(0.2777,1.0822,-0.4136,0.4038,0.7957),v(0.2422,1.1042,-0.2664,0.4305,0.8232),],m["Object"],[no(-0.9510,0.0000,-0.3090),no(-0.7236,0.4472,-0.5257),no(-0.8506,0.5257,0.0000)]),
			n([v(0.3158,0.9570,-0.4929,0.3907,0.7621),v(0.4067,1.1042,-0.4929,0.4062,0.7629),v(0.2777,1.0822,-0.4136,0.4038,0.7957),],m["Object"],[no(-0.5878,0.0000,-0.8090),no(-0.2629,0.5257,-0.8090),no(-0.7236,0.4472,-0.5257)]),
			n([v(0.3158,0.9570,-0.4929,0.3907,0.7621),v(0.4803,0.9570,-0.5464,0.4017,0.7231),v(0.4067,1.1042,-0.4929,0.4062,0.7629),],m["Object"],[no(-0.5878,0.0000,-0.8090),no(0.0000,0.0000,-1.0000),no(-0.2629,0.5257,-0.8090)]),
			n([v(0.4803,0.9570,-0.5464,0.4017,0.7231),v(0.5577,1.0822,-0.5045,0.4177,0.7307),v(0.4067,1.1042,-0.4929,0.4062,0.7629),],m["Object"],[no(0.0000,0.0000,-1.0000),no(0.2764,0.4472,-0.8506),no(-0.2629,0.5257,-0.8090)]),
			n([v(0.6449,0.9570,-0.4929,0.4233,0.6972),v(0.6730,1.1042,-0.4064,0.4398,0.7195),v(0.5577,1.0822,-0.5045,0.4177,0.7307),],m["Object"],[no(0.5878,0.0000,-0.8090),no(0.6882,0.5257,-0.5000),no(0.2764,0.4472,-0.8506)]),
			n([v(0.6449,0.9570,-0.4929,0.4233,0.6972),v(0.7466,0.9570,-0.3529,0.4491,0.6871),v(0.6730,1.1042,-0.4064,0.4398,0.7195),],m["Object"],[no(0.5878,0.0000,-0.8090),no(0.9510,0.0000,-0.3090),no(0.6882,0.5257,-0.5000)]),
			n([v(0.7466,0.9570,-0.3529,0.4491,0.6871),v(0.7308,1.0822,-0.2664,0.4624,0.7128),v(0.6730,1.1042,-0.4064,0.4398,0.7195),],m["Object"],[no(0.9510,0.0000,-0.3090),no(0.8944,0.4472,0.0000),no(0.6882,0.5257,-0.5000)]),
			n([v(0.6449,0.9570,-0.0398,0.4963,0.7188),v(0.4803,0.9570,0.0136,0.5060,0.7597),v(0.5577,1.0822,-0.0282,0.4978,0.7561),],m["Object"],[no(0.5878,0.0000,0.8090),no(0.0000,0.0000,1.0000),no(0.2764,0.4472,0.8506)]),
			n([v(0.6449,0.9570,-0.0398,0.4963,0.7188),v(0.5539,0.8098,-0.0398,0.4951,0.7165),v(0.4803,0.9570,0.0136,0.5060,0.7597),],m["Object"],[no(0.5878,0.0000,0.8090),no(0.2629,-0.5257,0.8090),no(0.0000,0.0000,1.0000)]),
			n([v(0.5539,0.8098,-0.0398,0.4951,0.7165),v(0.4029,0.8318,-0.0282,0.4958,0.7639),v(0.4803,0.9570,0.0136,0.5060,0.7597),],m["Object"],[no(0.2629,-0.5257,0.8090),no(-0.2764,-0.4472,0.8506),no(0.0000,0.0000,1.0000)]),
			n([v(0.3158,0.9570,-0.0398,0.4916,0.8058),v(0.2140,0.9570,-0.1798,0.4452,0.8277),v(0.2777,1.0822,-0.1192,0.4699,0.8243),],m["Object"],[no(-0.5878,0.0000,0.8090),no(-0.9510,0.0000,0.3090),no(-0.7236,0.4472,0.5257)]),
			n([v(0.3158,0.9570,-0.0398,0.4916,0.8058),v(0.2876,0.8098,-0.1264,0.4639,0.7939),v(0.2140,0.9570,-0.1798,0.4452,0.8277),],m["Object"],[no(-0.5878,0.0000,0.8090),no(-0.6882,-0.5257,0.5000),no(-0.9510,0.0000,0.3090)]),
			n([v(0.2876,0.8098,-0.1264,0.4639,0.7939),v(0.2299,0.8318,-0.2664,0.4191,0.7991),v(0.2140,0.9570,-0.1798,0.4452,0.8277),],m["Object"],[no(-0.6882,-0.5257,0.5000),no(-0.8944,-0.4472,0.0000),no(-0.9510,0.0000,0.3090)]),
			n([v(0.2140,0.9570,-0.3529,0.4018,0.8052),v(0.3158,0.9570,-0.4929,0.3907,0.7621),v(0.2777,1.0822,-0.4136,0.4038,0.7957),],m["Object"],[no(-0.9510,0.0000,-0.3090),no(-0.5878,0.0000,-0.8090),no(-0.7236,0.4472,-0.5257)]),
			n([v(0.2140,0.9570,-0.3529,0.4018,0.8052),v(0.2876,0.8098,-0.4064,0.3958,0.7588),v(0.3158,0.9570,-0.4929,0.3907,0.7621),],m["Object"],[no(-0.9510,0.0000,-0.3090),no(-0.6882,-0.5257,-0.5000),no(-0.5878,0.0000,-0.8090)]),
			n([v(0.2876,0.8098,-0.4064,0.3958,0.7588),v(0.4029,0.8318,-0.5045,0.3954,0.7226),v(0.3158,0.9570,-0.4929,0.3907,0.7621),],m["Object"],[no(-0.6882,-0.5257,-0.5000),no(-0.2764,-0.4472,-0.8506),no(-0.5878,0.0000,-0.8090)]),
			n([v(0.4803,0.9570,-0.5464,0.4017,0.7231),v(0.6449,0.9570,-0.4929,0.4233,0.6972),v(0.5577,1.0822,-0.5045,0.4177,0.7307),],m["Object"],[no(0.0000,0.0000,-1.0000),no(0.5878,0.0000,-0.8090),no(0.2764,0.4472,-0.8506)]),
			n([v(0.4803,0.9570,-0.5464,0.4017,0.7231),v(0.5539,0.8098,-0.4929,0.4124,0.6888),v(0.6449,0.9570,-0.4929,0.4233,0.6972),],m["Object"],[no(0.0000,0.0000,-1.0000),no(0.2629,-0.5257,-0.8090),no(0.5878,0.0000,-0.8090)]),
			n([v(0.5539,0.8098,-0.4929,0.4124,0.6888),v(0.6829,0.8318,-0.4136,0.4347,0.6738),v(0.6449,0.9570,-0.4929,0.4233,0.6972),],m["Object"],[no(0.2629,-0.5257,-0.8090),no(0.7236,-0.4472,-0.5257),no(0.5878,0.0000,-0.8090)]),
			n([v(0.7466,0.9570,-0.3529,0.4491,0.6871),v(0.7466,0.9570,-0.1798,0.4749,0.6940),v(0.7308,1.0822,-0.2664,0.4624,0.7128),],m["Object"],[no(0.9510,0.0000,-0.3090),no(0.9510,0.0000,0.3090),no(0.8944,0.4472,0.0000)]),
			n([v(0.7466,0.9570,-0.3529,0.4491,0.6871),v(0.7185,0.8098,-0.2664,0.4589,0.6703),v(0.7466,0.9570,-0.1798,0.4749,0.6940),],m["Object"],[no(0.9510,0.0000,-0.3090),no(0.8506,-0.5257,0.0000),no(0.9510,0.0000,0.3090)]),
			n([v(0.7185,0.8098,-0.2664,0.4589,0.6703),v(0.6829,0.8318,-0.1192,0.4825,0.6873),v(0.7466,0.9570,-0.1798,0.4749,0.6940),],m["Object"],[no(0.8506,-0.5257,0.0000),no(0.7236,-0.4472,0.5257),no(0.9510,0.0000,0.3090)]),
			n([v(0.5994,0.7188,-0.1798,0.4676,0.6822),v(0.5539,0.8098,-0.0398,0.4951,0.7165),v(0.6829,0.8318,-0.1192,0.4825,0.6873),],m["Object"],[no(0.4253,-0.8506,0.3090),no(0.2629,-0.5257,0.8090),no(0.7236,-0.4472,0.5257)]),
			n([v(0.5994,0.7188,-0.1798,0.4676,0.6822),v(0.4349,0.7188,-0.1264,0.4714,0.7309),v(0.5539,0.8098,-0.0398,0.4951,0.7165),],m["Object"],[no(0.4253,-0.8506,0.3090),no(-0.1625,-0.8506,0.5000),no(0.2629,-0.5257,0.8090)]),
			n([v(0.4349,0.7188,-0.1264,0.4714,0.7309),v(0.4029,0.8318,-0.0282,0.4958,0.7639),v(0.5539,0.8098,-0.0398,0.4951,0.7165),],m["Object"],[no(-0.1625,-0.8506,0.5000),no(-0.2764,-0.4472,0.8506),no(0.2629,-0.5257,0.8090)]),
			n([v(0.4349,0.7188,-0.1264,0.4714,0.7309),v(0.2876,0.8098,-0.1264,0.4639,0.7939),v(0.4029,0.8318,-0.0282,0.4958,0.7639),],m["Object"],[no(-0.1625,-0.8506,0.5000),no(-0.6882,-0.5257,0.5000),no(-0.2764,-0.4472,0.8506)]),
			n([v(0.4349,0.7188,-0.1264,0.4714,0.7309),v(0.3331,0.7188,-0.2664,0.4285,0.7502),v(0.2876,0.8098,-0.1264,0.4639,0.7939),],m["Object"],[no(-0.1625,-0.8506,0.5000),no(-0.5257,-0.8506,0.0000),no(-0.6882,-0.5257,0.5000)]),
			n([v(0.3331,0.7188,-0.2664,0.4285,0.7502),v(0.2299,0.8318,-0.2664,0.4191,0.7991),v(0.2876,0.8098,-0.1264,0.4639,0.7939),],m["Object"],[no(-0.5257,-0.8506,0.0000),no(-0.8944,-0.4472,0.0000),no(-0.6882,-0.5257,0.5000)]),
			n([v(0.3331,0.7188,-0.2664,0.4285,0.7502),v(0.2876,0.8098,-0.4064,0.3958,0.7588),v(0.2299,0.8318,-0.2664,0.4191,0.7991),],m["Object"],[no(-0.5257,-0.8506,0.0000),no(-0.6882,-0.5257,-0.5000),no(-0.8944,-0.4472,0.0000)]),
			n([v(0.3331,0.7188,-0.2664,0.4285,0.7502),v(0.4349,0.7188,-0.4064,0.4115,0.7054),v(0.2876,0.8098,-0.4064,0.3958,0.7588),],m["Object"],[no(-0.5257,-0.8506,0.0000),no(-0.1625,-0.8506,-0.5000),no(-0.6882,-0.5257,-0.5000)]),
			n([v(0.4349,0.7188,-0.4064,0.4115,0.7054),v(0.4029,0.8318,-0.5045,0.3954,0.7226),v(0.2876,0.8098,-0.4064,0.3958,0.7588),],m["Object"],[no(-0.1625,-0.8506,-0.5000),no(-0.2764,-0.4472,-0.8506),no(-0.6882,-0.5257,-0.5000)]),
			n([v(0.7185,0.8098,-0.2664,0.4589,0.6703),v(0.5994,0.7188,-0.1798,0.4676,0.6822),v(0.6829,0.8318,-0.1192,0.4825,0.6873),],m["Object"],[no(0.8506,-0.5257,0.0000),no(0.4253,-0.8506,0.3090),no(0.7236,-0.4472,0.5257)]),
			n([v(0.7185,0.8098,-0.2664,0.4589,0.6703),v(0.5994,0.7188,-0.3529,0.4361,0.6720),v(0.5994,0.7188,-0.1798,0.4676,0.6822),],m["Object"],[no(0.8506,-0.5257,0.0000),no(0.4253,-0.8506,-0.3090),no(0.4253,-0.8506,0.3090)]),
			n([v(0.5994,0.7188,-0.3529,0.4361,0.6720),v(0.4803,0.6770,-0.2664,0.4420,0.6986),v(0.5994,0.7188,-0.1798,0.4676,0.6822),],m["Object"],[no(0.4253,-0.8506,-0.3090),no(0.0000,-1.0000,0.0000),no(0.4253,-0.8506,0.3090)]),
			n([v(0.4349,0.7188,-0.4064,0.4115,0.7054),v(0.5539,0.8098,-0.4929,0.4124,0.6888),v(0.4029,0.8318,-0.5045,0.3954,0.7226),],m["Object"],[no(-0.1625,-0.8506,-0.5000),no(0.2629,-0.5257,-0.8090),no(-0.2764,-0.4472,-0.8506)]),
			n([v(0.4349,0.7188,-0.4064,0.4115,0.7054),v(0.5994,0.7188,-0.3529,0.4361,0.6720),v(0.5539,0.8098,-0.4929,0.4124,0.6888),],m["Object"],[no(-0.1625,-0.8506,-0.5000),no(0.4253,-0.8506,-0.3090),no(0.2629,-0.5257,-0.8090)]),
			n([v(0.5994,0.7188,-0.3529,0.4361,0.6720),v(0.6829,0.8318,-0.4136,0.4347,0.6738),v(0.5539,0.8098,-0.4929,0.4124,0.6888),],m["Object"],[no(0.4253,-0.8506,-0.3090),no(0.7236,-0.4472,-0.5257),no(0.2629,-0.5257,-0.8090)]),
			// Mesh: Trunk.001.
			n([v(-1.8272,-0.1505,1.7634,0.3817,0.4247),v(-1.8272,3.1495,1.7634,0.3817,2.0747),v(-1.8272,3.1495,2.2634,0.6317,2.0747),v(-1.8272,-0.1505,2.2634,0.6317,0.4247),],m["Pillar"],no(-1.0000,0.0000,-0.0000)),
			n([v(-1.8272,-0.1505,2.2634,0.5864,0.4247),v(-1.8272,3.1495,2.2634,0.5864,2.0747),v(-1.3272,3.1495,2.2634,0.8364,2.0747),v(-1.3272,-0.1505,2.2634,0.8364,0.4247),],m["Pillar"],no(0.0000,0.0000,1.0000)),
			n([v(-1.3272,-0.1505,2.2634,0.6317,0.4247),v(-1.3272,3.1495,2.2634,0.6317,2.0747),v(-1.3272,3.1495,1.7634,0.3817,2.0747),v(-1.3272,-0.1505,1.7634,0.3817,0.4247),],m["Pillar"],no(1.0000,0.0000,-0.0000)),
			n([v(-1.3272,-0.1505,1.7634,0.8364,0.4247),v(-1.3272,3.1495,1.7634,0.8364,2.0747),v(-1.8272,3.1495,1.7634,0.5864,2.0747),v(-1.8272,-0.1505,1.7634,0.5864,0.4247),],m["Pillar"],no(0.0000,0.0000,-1.0000)),
			n([v(-1.8272,-0.1505,2.2634,0.5864,0.6317),v(-1.3272,-0.1505,2.2634,0.8364,0.6317),v(-1.3272,-0.1505,1.7634,0.8364,0.3817),v(-1.8272,-0.1505,1.7634,0.5864,0.3817),],m["Pillar"],no(0.0000,-1.0000,0.0000)),
			n([v(-1.3272,3.1495,2.2634,0.8364,0.6317),v(-1.8272,3.1495,2.2634,0.5864,0.6317),v(-1.8272,3.1495,1.7634,0.5864,0.3817),v(-1.3272,3.1495,1.7634,0.8364,0.3817),],m["Pillar"],no(0.0000,1.0000,-0.0000)),
			// Mesh: House.
			n([v(5.1910,0.0006,3.2819,0.0000,0.0000),v(-4.3190,0.0006,3.2819,0.0000,1.0000),v(-4.3190,0.0006,-3.7181,1.0000,1.0000),v(5.1910,0.0006,-3.7181,1.0000,0.0000),],m["Floor"],no(0.0000,1.0000,-0.0000)),
			n([v(5.1910,3.0006,3.2819,0.0000,0.0000),v(5.1910,3.0006,-3.7181,0.0000,1.0000),v(-4.3191,3.0006,-3.7181,1.0000,1.0000),v(-4.3190,3.0006,3.2819,1.0000,0.0000),],m["Wall"],no(0.0000,-1.0000,0.0000)),
			n([v(5.1910,0.0006,3.2819,0.0000,0.0000),v(5.1910,0.0006,-3.7181,0.0000,1.0000),v(5.1910,3.0006,-3.7181,1.0000,1.0000),v(5.1910,3.0006,3.2819,1.0000,0.0000),],m["Wall"],no(-1.0000,-0.0000,0.0000)),
			n([v(5.1910,0.0006,-3.7181,0.0000,0.0000),v(-4.3190,0.0006,-3.7181,0.0000,1.0000),v(-4.3191,3.0006,-3.7181,1.0000,1.0000),v(5.1910,3.0006,-3.7181,1.0000,0.0000),],m["Wall"],no(0.0000,0.0000,1.0000)),
			n([v(-4.3190,0.0006,-3.7181,0.0000,0.0000),v(-4.3190,0.0006,3.2819,0.0000,1.0000),v(-4.3190,3.0006,3.2819,1.0000,1.0000),v(-4.3191,3.0006,-3.7181,1.0000,0.0000),],m["Wall"],no(1.0000,0.0000,-0.0000)),
			n([v(5.1910,3.0006,3.2819,0.0000,0.0000),v(-4.3190,3.0006,3.2819,0.0000,1.0000),v(-4.3190,0.0006,3.2819,1.0000,1.0000),v(5.1910,0.0006,3.2819,1.0000,0.0000),],m["Wall"],no(-0.0000,-0.0000,-1.0000)),
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
