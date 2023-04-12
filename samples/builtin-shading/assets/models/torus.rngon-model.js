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

export const torusModel =
{
	ngons:[],
	initialize: async function()
	{
		// Shorthands.
		const n = Rngon.ngon;
		const no = Rngon.vector; // Normal.
		const v = Rngon.vertex;
		const c = Rngon.color_rgba;
		const ct = Rngon.texture.create_with_data_from_file;

		// Load the textures.
		const t = {
		};

		// Set up the materials.
		const m = {
			"Torus":{color:c(0,150,150),shading:"flat",ambientLightLevel:0.3},
		};

		// Create the n-gons.
		this.ngons = Object.freeze([
			// Mesh: Torus.
			n([v(1.3100,0.0000,0.0000),v(1.2310,0.0000,0.4480),v(1.1628,0.1993,0.4232),v(1.2375,0.1993,0.0000),],m["Torus"],[no(1.0000,0.0000,0.0000),no(0.9397,0.0000,0.3420),no(0.7337,0.6247,0.2670),no(0.7808,0.6247,0.0000)]),
			n([v(1.2375,0.1993,0.0000),v(1.1628,0.1993,0.4232),v(0.9903,0.3053,0.3604),v(1.0538,0.3053,0.0000),],m["Torus"],[no(0.7808,0.6247,0.0000),no(0.7337,0.6247,0.2670),no(0.1973,0.9777,0.0718),no(0.2100,0.9777,0.0000)]),
			n([v(1.0538,0.3053,0.0000),v(0.9903,0.3053,0.3604),v(0.7940,0.2685,0.2890),v(0.8450,0.2685,0.0000),],m["Torus"],[no(0.2100,0.9777,0.0000),no(0.1973,0.9777,0.0718),no(-0.4421,0.8824,-0.1609),no(-0.4704,0.8824,0.0000)]),
			n([v(0.8450,0.2685,0.0000),v(0.7940,0.2685,0.2890),v(0.6660,0.1060,0.2424),v(0.7087,0.1060,0.0000),],m["Torus"],[no(-0.4704,0.8824,0.0000),no(-0.4421,0.8824,-0.1609),no(-0.8785,0.3548,-0.3197),no(-0.9349,0.3548,0.0000)]),
			n([v(0.7087,0.1060,0.0000),v(0.6660,0.1060,0.2424),v(0.6660,-0.1060,0.2424),v(0.7087,-0.1060,0.0000),],m["Torus"],[no(-0.9349,0.3548,0.0000),no(-0.8785,0.3548,-0.3197),no(-0.8785,-0.3548,-0.3197),no(-0.9349,-0.3548,0.0000)]),
			n([v(0.7087,-0.1060,0.0000),v(0.6660,-0.1060,0.2424),v(0.7940,-0.2685,0.2890),v(0.8450,-0.2685,0.0000),],m["Torus"],[no(-0.9349,-0.3548,0.0000),no(-0.8785,-0.3548,-0.3197),no(-0.4421,-0.8824,-0.1609),no(-0.4704,-0.8824,0.0000)]),
			n([v(0.8450,-0.2685,0.0000),v(0.7940,-0.2685,0.2890),v(0.9903,-0.3053,0.3604),v(1.0538,-0.3053,0.0000),],m["Torus"],[no(-0.4704,-0.8824,0.0000),no(-0.4421,-0.8824,-0.1609),no(0.1973,-0.9777,0.0718),no(0.2100,-0.9777,0.0000)]),
			n([v(1.0538,-0.3053,0.0000),v(0.9903,-0.3053,0.3604),v(1.1628,-0.1993,0.4232),v(1.2375,-0.1993,0.0000),],m["Torus"],[no(0.2100,-0.9777,0.0000),no(0.1973,-0.9777,0.0718),no(0.7337,-0.6247,0.2670),no(0.7808,-0.6247,0.0000)]),
			n([v(1.2375,-0.1993,0.0000),v(1.1628,-0.1993,0.4232),v(1.2310,0.0000,0.4480),v(1.3100,0.0000,0.0000),],m["Torus"],[no(0.7808,-0.6247,0.0000),no(0.7337,-0.6247,0.2670),no(0.9397,0.0000,0.3420),no(1.0000,0.0000,0.0000)]),
			n([v(1.2310,0.0000,0.4480),v(1.0035,0.0000,0.8421),v(0.9480,0.1993,0.7954),v(1.1628,0.1993,0.4232),],m["Torus"],[no(0.9397,0.0000,0.3420),no(0.7660,0.0000,0.6428),no(0.5981,0.6247,0.5019),no(0.7337,0.6247,0.2670)]),
			n([v(1.1628,0.1993,0.4232),v(0.9480,0.1993,0.7954),v(0.8073,0.3053,0.6774),v(0.9903,0.3053,0.3604),],m["Torus"],[no(0.7337,0.6247,0.2670),no(0.5981,0.6247,0.5019),no(0.1608,0.9777,0.1350),no(0.1973,0.9777,0.0718)]),
			n([v(0.9903,0.3053,0.3604),v(0.8073,0.3053,0.6774),v(0.6473,0.2685,0.5432),v(0.7940,0.2685,0.2890),],m["Torus"],[no(0.1973,0.9777,0.0718),no(0.1608,0.9777,0.1350),no(-0.3604,0.8824,-0.3024),no(-0.4421,0.8824,-0.1609)]),
			n([v(0.7940,0.2685,0.2890),v(0.6473,0.2685,0.5432),v(0.5429,0.1060,0.4555),v(0.6660,0.1060,0.2424),],m["Torus"],[no(-0.4421,0.8824,-0.1609),no(-0.3604,0.8824,-0.3024),no(-0.7162,0.3548,-0.6009),no(-0.8785,0.3548,-0.3197)]),
			n([v(0.6660,0.1060,0.2424),v(0.5429,0.1060,0.4555),v(0.5429,-0.1060,0.4555),v(0.6660,-0.1060,0.2424),],m["Torus"],[no(-0.8785,0.3548,-0.3197),no(-0.7162,0.3548,-0.6009),no(-0.7162,-0.3548,-0.6009),no(-0.8785,-0.3548,-0.3197)]),
			n([v(0.6660,-0.1060,0.2424),v(0.5429,-0.1060,0.4555),v(0.6473,-0.2685,0.5432),v(0.7940,-0.2685,0.2890),],m["Torus"],[no(-0.8785,-0.3548,-0.3197),no(-0.7162,-0.3548,-0.6009),no(-0.3604,-0.8824,-0.3024),no(-0.4421,-0.8824,-0.1609)]),
			n([v(0.7940,-0.2685,0.2890),v(0.6473,-0.2685,0.5432),v(0.8073,-0.3053,0.6774),v(0.9903,-0.3053,0.3604),],m["Torus"],[no(-0.4421,-0.8824,-0.1609),no(-0.3604,-0.8824,-0.3024),no(0.1608,-0.9777,0.1350),no(0.1973,-0.9777,0.0718)]),
			n([v(0.9903,-0.3053,0.3604),v(0.8073,-0.3053,0.6774),v(0.9480,-0.1993,0.7954),v(1.1628,-0.1993,0.4232),],m["Torus"],[no(0.1973,-0.9777,0.0718),no(0.1608,-0.9777,0.1350),no(0.5981,-0.6247,0.5019),no(0.7337,-0.6247,0.2670)]),
			n([v(1.1628,-0.1993,0.4232),v(0.9480,-0.1993,0.7954),v(1.0035,0.0000,0.8421),v(1.2310,0.0000,0.4480),],m["Torus"],[no(0.7337,-0.6247,0.2670),no(0.5981,-0.6247,0.5019),no(0.7660,0.0000,0.6428),no(0.9397,0.0000,0.3420)]),
			n([v(1.0035,0.0000,0.8421),v(0.6550,0.0000,1.1345),v(0.6187,0.1993,1.0717),v(0.9480,0.1993,0.7954),],m["Torus"],[no(0.7660,0.0000,0.6428),no(0.5000,0.0000,0.8660),no(0.3904,0.6247,0.6762),no(0.5981,0.6247,0.5019)]),
			n([v(0.9480,0.1993,0.7954),v(0.6187,0.1993,1.0717),v(0.5269,0.3053,0.9126),v(0.8073,0.3053,0.6774),],m["Torus"],[no(0.5981,0.6247,0.5019),no(0.3904,0.6247,0.6762),no(0.1050,0.9777,0.1818),no(0.1608,0.9777,0.1350)]),
			n([v(0.8073,0.3053,0.6774),v(0.5269,0.3053,0.9126),v(0.4225,0.2685,0.7318),v(0.6473,0.2685,0.5432),],m["Torus"],[no(0.1608,0.9777,0.1350),no(0.1050,0.9777,0.1818),no(-0.2352,0.8824,-0.4074),no(-0.3604,0.8824,-0.3024)]),
			n([v(0.6473,0.2685,0.5432),v(0.4225,0.2685,0.7318),v(0.3543,0.1060,0.6137),v(0.5429,0.1060,0.4555),],m["Torus"],[no(-0.3604,0.8824,-0.3024),no(-0.2352,0.8824,-0.4074),no(-0.4675,0.3548,-0.8097),no(-0.7162,0.3548,-0.6009)]),
			n([v(0.5429,0.1060,0.4555),v(0.3543,0.1060,0.6137),v(0.3543,-0.1060,0.6137),v(0.5429,-0.1060,0.4555),],m["Torus"],[no(-0.7162,0.3548,-0.6009),no(-0.4675,0.3548,-0.8097),no(-0.4675,-0.3548,-0.8097),no(-0.7162,-0.3548,-0.6009)]),
			n([v(0.5429,-0.1060,0.4555),v(0.3543,-0.1060,0.6137),v(0.4225,-0.2685,0.7318),v(0.6473,-0.2685,0.5432),],m["Torus"],[no(-0.7162,-0.3548,-0.6009),no(-0.4675,-0.3548,-0.8097),no(-0.2352,-0.8824,-0.4074),no(-0.3604,-0.8824,-0.3024)]),
			n([v(0.6473,-0.2685,0.5432),v(0.4225,-0.2685,0.7318),v(0.5269,-0.3053,0.9126),v(0.8073,-0.3053,0.6774),],m["Torus"],[no(-0.3604,-0.8824,-0.3024),no(-0.2352,-0.8824,-0.4074),no(0.1050,-0.9777,0.1818),no(0.1608,-0.9777,0.1350)]),
			n([v(0.8073,-0.3053,0.6774),v(0.5269,-0.3053,0.9126),v(0.6187,-0.1993,1.0717),v(0.9480,-0.1993,0.7954),],m["Torus"],[no(0.1608,-0.9777,0.1350),no(0.1050,-0.9777,0.1818),no(0.3904,-0.6247,0.6762),no(0.5981,-0.6247,0.5019)]),
			n([v(0.9480,-0.1993,0.7954),v(0.6187,-0.1993,1.0717),v(0.6550,0.0000,1.1345),v(1.0035,0.0000,0.8421),],m["Torus"],[no(0.5981,-0.6247,0.5019),no(0.3904,-0.6247,0.6762),no(0.5000,0.0000,0.8660),no(0.7660,0.0000,0.6428)]),
			n([v(0.6550,0.0000,1.1345),v(0.2275,0.0000,1.2901),v(0.2149,0.1993,1.2187),v(0.6187,0.1993,1.0717),],m["Torus"],[no(0.5000,0.0000,0.8660),no(0.1736,0.0000,0.9848),no(0.1356,0.6247,0.7690),no(0.3904,0.6247,0.6762)]),
			n([v(0.6187,0.1993,1.0717),v(0.2149,0.1993,1.2187),v(0.1830,0.3053,1.0378),v(0.5269,0.3053,0.9126),],m["Torus"],[no(0.3904,0.6247,0.6762),no(0.1356,0.6247,0.7690),no(0.0364,0.9777,0.2068),no(0.1050,0.9777,0.1818)]),
			n([v(0.5269,0.3053,0.9126),v(0.1830,0.3053,1.0378),v(0.1467,0.2685,0.8322),v(0.4225,0.2685,0.7318),],m["Torus"],[no(0.1050,0.9777,0.1818),no(0.0364,0.9777,0.2068),no(-0.0817,0.8824,-0.4633),no(-0.2352,0.8824,-0.4074)]),
			n([v(0.4225,0.2685,0.7318),v(0.1467,0.2685,0.8322),v(0.1231,0.1060,0.6979),v(0.3543,0.1060,0.6137),],m["Torus"],[no(-0.2352,0.8824,-0.4074),no(-0.0817,0.8824,-0.4633),no(-0.1623,0.3548,-0.9207),no(-0.4675,0.3548,-0.8097)]),
			n([v(0.3543,0.1060,0.6137),v(0.1231,0.1060,0.6979),v(0.1231,-0.1060,0.6979),v(0.3543,-0.1060,0.6137),],m["Torus"],[no(-0.4675,0.3548,-0.8097),no(-0.1623,0.3548,-0.9207),no(-0.1623,-0.3548,-0.9207),no(-0.4675,-0.3548,-0.8097)]),
			n([v(0.3543,-0.1060,0.6137),v(0.1231,-0.1060,0.6979),v(0.1467,-0.2685,0.8322),v(0.4225,-0.2685,0.7318),],m["Torus"],[no(-0.4675,-0.3548,-0.8097),no(-0.1623,-0.3548,-0.9207),no(-0.0817,-0.8824,-0.4633),no(-0.2352,-0.8824,-0.4074)]),
			n([v(0.4225,-0.2685,0.7318),v(0.1467,-0.2685,0.8322),v(0.1830,-0.3053,1.0378),v(0.5269,-0.3053,0.9126),],m["Torus"],[no(-0.2352,-0.8824,-0.4074),no(-0.0817,-0.8824,-0.4633),no(0.0364,-0.9777,0.2068),no(0.1050,-0.9777,0.1818)]),
			n([v(0.5269,-0.3053,0.9126),v(0.1830,-0.3053,1.0378),v(0.2149,-0.1993,1.2187),v(0.6187,-0.1993,1.0717),],m["Torus"],[no(0.1050,-0.9777,0.1818),no(0.0364,-0.9777,0.2068),no(0.1356,-0.6247,0.7690),no(0.3904,-0.6247,0.6762)]),
			n([v(0.6187,-0.1993,1.0717),v(0.2149,-0.1993,1.2187),v(0.2275,0.0000,1.2901),v(0.6550,0.0000,1.1345),],m["Torus"],[no(0.3904,-0.6247,0.6762),no(0.1356,-0.6247,0.7690),no(0.1736,0.0000,0.9848),no(0.5000,0.0000,0.8660)]),
			n([v(0.2275,0.0000,1.2901),v(-0.2275,0.0000,1.2901),v(-0.2149,0.1993,1.2187),v(0.2149,0.1993,1.2187),],m["Torus"],[no(0.1736,0.0000,0.9848),no(-0.1736,0.0000,0.9848),no(-0.1356,0.6247,0.7690),no(0.1356,0.6247,0.7690)]),
			n([v(0.2149,0.1993,1.2187),v(-0.2149,0.1993,1.2187),v(-0.1830,0.3053,1.0378),v(0.1830,0.3053,1.0378),],m["Torus"],[no(0.1356,0.6247,0.7690),no(-0.1356,0.6247,0.7690),no(-0.0364,0.9777,0.2068),no(0.0364,0.9777,0.2068)]),
			n([v(0.1830,0.3053,1.0378),v(-0.1830,0.3053,1.0378),v(-0.1467,0.2685,0.8322),v(0.1467,0.2685,0.8322),],m["Torus"],[no(0.0364,0.9777,0.2068),no(-0.0364,0.9777,0.2068),no(0.0817,0.8824,-0.4633),no(-0.0817,0.8824,-0.4633)]),
			n([v(0.1467,0.2685,0.8322),v(-0.1467,0.2685,0.8322),v(-0.1231,0.1060,0.6979),v(0.1231,0.1060,0.6979),],m["Torus"],[no(-0.0817,0.8824,-0.4633),no(0.0817,0.8824,-0.4633),no(0.1623,0.3548,-0.9207),no(-0.1623,0.3548,-0.9207)]),
			n([v(0.1231,0.1060,0.6979),v(-0.1231,0.1060,0.6979),v(-0.1231,-0.1060,0.6979),v(0.1231,-0.1060,0.6979),],m["Torus"],[no(-0.1623,0.3548,-0.9207),no(0.1623,0.3548,-0.9207),no(0.1623,-0.3548,-0.9207),no(-0.1623,-0.3548,-0.9207)]),
			n([v(0.1231,-0.1060,0.6979),v(-0.1231,-0.1060,0.6979),v(-0.1467,-0.2685,0.8322),v(0.1467,-0.2685,0.8322),],m["Torus"],[no(-0.1623,-0.3548,-0.9207),no(0.1623,-0.3548,-0.9207),no(0.0817,-0.8824,-0.4633),no(-0.0817,-0.8824,-0.4633)]),
			n([v(0.1467,-0.2685,0.8322),v(-0.1467,-0.2685,0.8322),v(-0.1830,-0.3053,1.0378),v(0.1830,-0.3053,1.0378),],m["Torus"],[no(-0.0817,-0.8824,-0.4633),no(0.0817,-0.8824,-0.4633),no(-0.0364,-0.9777,0.2068),no(0.0364,-0.9777,0.2068)]),
			n([v(0.1830,-0.3053,1.0378),v(-0.1830,-0.3053,1.0378),v(-0.2149,-0.1993,1.2187),v(0.2149,-0.1993,1.2187),],m["Torus"],[no(0.0364,-0.9777,0.2068),no(-0.0364,-0.9777,0.2068),no(-0.1356,-0.6247,0.7690),no(0.1356,-0.6247,0.7690)]),
			n([v(0.2149,-0.1993,1.2187),v(-0.2149,-0.1993,1.2187),v(-0.2275,0.0000,1.2901),v(0.2275,0.0000,1.2901),],m["Torus"],[no(0.1356,-0.6247,0.7690),no(-0.1356,-0.6247,0.7690),no(-0.1736,0.0000,0.9848),no(0.1736,0.0000,0.9848)]),
			n([v(-0.2275,0.0000,1.2901),v(-0.6550,0.0000,1.1345),v(-0.6187,0.1993,1.0717),v(-0.2149,0.1993,1.2187),],m["Torus"],[no(-0.1736,0.0000,0.9848),no(-0.5000,0.0000,0.8660),no(-0.3904,0.6247,0.6762),no(-0.1356,0.6247,0.7690)]),
			n([v(-0.2149,0.1993,1.2187),v(-0.6187,0.1993,1.0717),v(-0.5269,0.3053,0.9126),v(-0.1830,0.3053,1.0378),],m["Torus"],[no(-0.1356,0.6247,0.7690),no(-0.3904,0.6247,0.6762),no(-0.1050,0.9777,0.1818),no(-0.0364,0.9777,0.2068)]),
			n([v(-0.1830,0.3053,1.0378),v(-0.5269,0.3053,0.9126),v(-0.4225,0.2685,0.7318),v(-0.1467,0.2685,0.8322),],m["Torus"],[no(-0.0364,0.9777,0.2068),no(-0.1050,0.9777,0.1818),no(0.2352,0.8824,-0.4074),no(0.0817,0.8824,-0.4633)]),
			n([v(-0.1467,0.2685,0.8322),v(-0.4225,0.2685,0.7318),v(-0.3543,0.1060,0.6137),v(-0.1231,0.1060,0.6979),],m["Torus"],[no(0.0817,0.8824,-0.4633),no(0.2352,0.8824,-0.4074),no(0.4675,0.3548,-0.8097),no(0.1623,0.3548,-0.9207)]),
			n([v(-0.1231,0.1060,0.6979),v(-0.3543,0.1060,0.6137),v(-0.3543,-0.1060,0.6137),v(-0.1231,-0.1060,0.6979),],m["Torus"],[no(0.1623,0.3548,-0.9207),no(0.4675,0.3548,-0.8097),no(0.4675,-0.3548,-0.8097),no(0.1623,-0.3548,-0.9207)]),
			n([v(-0.1231,-0.1060,0.6979),v(-0.3543,-0.1060,0.6137),v(-0.4225,-0.2685,0.7318),v(-0.1467,-0.2685,0.8322),],m["Torus"],[no(0.1623,-0.3548,-0.9207),no(0.4675,-0.3548,-0.8097),no(0.2352,-0.8824,-0.4074),no(0.0817,-0.8824,-0.4633)]),
			n([v(-0.1467,-0.2685,0.8322),v(-0.4225,-0.2685,0.7318),v(-0.5269,-0.3053,0.9126),v(-0.1830,-0.3053,1.0378),],m["Torus"],[no(0.0817,-0.8824,-0.4633),no(0.2352,-0.8824,-0.4074),no(-0.1050,-0.9777,0.1818),no(-0.0364,-0.9777,0.2068)]),
			n([v(-0.1830,-0.3053,1.0378),v(-0.5269,-0.3053,0.9126),v(-0.6187,-0.1993,1.0717),v(-0.2149,-0.1993,1.2187),],m["Torus"],[no(-0.0364,-0.9777,0.2068),no(-0.1050,-0.9777,0.1818),no(-0.3904,-0.6247,0.6762),no(-0.1356,-0.6247,0.7690)]),
			n([v(-0.2149,-0.1993,1.2187),v(-0.6187,-0.1993,1.0717),v(-0.6550,0.0000,1.1345),v(-0.2275,0.0000,1.2901),],m["Torus"],[no(-0.1356,-0.6247,0.7690),no(-0.3904,-0.6247,0.6762),no(-0.5000,0.0000,0.8660),no(-0.1736,0.0000,0.9848)]),
			n([v(-0.6550,0.0000,1.1345),v(-1.0035,0.0000,0.8421),v(-0.9480,0.1993,0.7954),v(-0.6187,0.1993,1.0717),],m["Torus"],[no(-0.5000,0.0000,0.8660),no(-0.7660,0.0000,0.6428),no(-0.5981,0.6247,0.5019),no(-0.3904,0.6247,0.6762)]),
			n([v(-0.6187,0.1993,1.0717),v(-0.9480,0.1993,0.7954),v(-0.8073,0.3053,0.6774),v(-0.5269,0.3053,0.9126),],m["Torus"],[no(-0.3904,0.6247,0.6762),no(-0.5981,0.6247,0.5019),no(-0.1608,0.9777,0.1350),no(-0.1050,0.9777,0.1818)]),
			n([v(-0.5269,0.3053,0.9126),v(-0.8073,0.3053,0.6774),v(-0.6473,0.2685,0.5432),v(-0.4225,0.2685,0.7318),],m["Torus"],[no(-0.1050,0.9777,0.1818),no(-0.1608,0.9777,0.1350),no(0.3604,0.8824,-0.3024),no(0.2352,0.8824,-0.4074)]),
			n([v(-0.4225,0.2685,0.7318),v(-0.6473,0.2685,0.5432),v(-0.5429,0.1060,0.4555),v(-0.3543,0.1060,0.6137),],m["Torus"],[no(0.2352,0.8824,-0.4074),no(0.3604,0.8824,-0.3024),no(0.7162,0.3548,-0.6009),no(0.4675,0.3548,-0.8097)]),
			n([v(-0.3543,0.1060,0.6137),v(-0.5429,0.1060,0.4555),v(-0.5429,-0.1060,0.4555),v(-0.3543,-0.1060,0.6137),],m["Torus"],[no(0.4675,0.3548,-0.8097),no(0.7162,0.3548,-0.6009),no(0.7162,-0.3548,-0.6009),no(0.4675,-0.3548,-0.8097)]),
			n([v(-0.3543,-0.1060,0.6137),v(-0.5429,-0.1060,0.4555),v(-0.6473,-0.2685,0.5432),v(-0.4225,-0.2685,0.7318),],m["Torus"],[no(0.4675,-0.3548,-0.8097),no(0.7162,-0.3548,-0.6009),no(0.3604,-0.8824,-0.3024),no(0.2352,-0.8824,-0.4074)]),
			n([v(-0.4225,-0.2685,0.7318),v(-0.6473,-0.2685,0.5432),v(-0.8073,-0.3053,0.6774),v(-0.5269,-0.3053,0.9126),],m["Torus"],[no(0.2352,-0.8824,-0.4074),no(0.3604,-0.8824,-0.3024),no(-0.1608,-0.9777,0.1350),no(-0.1050,-0.9777,0.1818)]),
			n([v(-0.5269,-0.3053,0.9126),v(-0.8073,-0.3053,0.6774),v(-0.9480,-0.1993,0.7954),v(-0.6187,-0.1993,1.0717),],m["Torus"],[no(-0.1050,-0.9777,0.1818),no(-0.1608,-0.9777,0.1350),no(-0.5981,-0.6247,0.5019),no(-0.3904,-0.6247,0.6762)]),
			n([v(-0.6187,-0.1993,1.0717),v(-0.9480,-0.1993,0.7954),v(-1.0035,0.0000,0.8421),v(-0.6550,0.0000,1.1345),],m["Torus"],[no(-0.3904,-0.6247,0.6762),no(-0.5981,-0.6247,0.5019),no(-0.7660,0.0000,0.6428),no(-0.5000,0.0000,0.8660)]),
			n([v(-1.0035,0.0000,0.8421),v(-1.2310,0.0000,0.4480),v(-1.1628,0.1993,0.4232),v(-0.9480,0.1993,0.7954),],m["Torus"],[no(-0.7660,0.0000,0.6428),no(-0.9397,0.0000,0.3420),no(-0.7337,0.6247,0.2670),no(-0.5981,0.6247,0.5019)]),
			n([v(-0.9480,0.1993,0.7954),v(-1.1628,0.1993,0.4232),v(-0.9903,0.3053,0.3604),v(-0.8073,0.3053,0.6774),],m["Torus"],[no(-0.5981,0.6247,0.5019),no(-0.7337,0.6247,0.2670),no(-0.1973,0.9777,0.0718),no(-0.1608,0.9777,0.1350)]),
			n([v(-0.8073,0.3053,0.6774),v(-0.9903,0.3053,0.3604),v(-0.7940,0.2685,0.2890),v(-0.6473,0.2685,0.5432),],m["Torus"],[no(-0.1608,0.9777,0.1350),no(-0.1973,0.9777,0.0718),no(0.4421,0.8824,-0.1609),no(0.3604,0.8824,-0.3024)]),
			n([v(-0.6473,0.2685,0.5432),v(-0.7940,0.2685,0.2890),v(-0.6660,0.1060,0.2424),v(-0.5429,0.1060,0.4555),],m["Torus"],[no(0.3604,0.8824,-0.3024),no(0.4421,0.8824,-0.1609),no(0.8785,0.3548,-0.3197),no(0.7162,0.3548,-0.6009)]),
			n([v(-0.5429,0.1060,0.4555),v(-0.6660,0.1060,0.2424),v(-0.6660,-0.1060,0.2424),v(-0.5429,-0.1060,0.4555),],m["Torus"],[no(0.7162,0.3548,-0.6009),no(0.8785,0.3548,-0.3197),no(0.8785,-0.3548,-0.3197),no(0.7162,-0.3548,-0.6009)]),
			n([v(-0.5429,-0.1060,0.4555),v(-0.6660,-0.1060,0.2424),v(-0.7940,-0.2685,0.2890),v(-0.6473,-0.2685,0.5432),],m["Torus"],[no(0.7162,-0.3548,-0.6009),no(0.8785,-0.3548,-0.3197),no(0.4421,-0.8824,-0.1609),no(0.3604,-0.8824,-0.3024)]),
			n([v(-0.6473,-0.2685,0.5432),v(-0.7940,-0.2685,0.2890),v(-0.9903,-0.3053,0.3604),v(-0.8073,-0.3053,0.6774),],m["Torus"],[no(0.3604,-0.8824,-0.3024),no(0.4421,-0.8824,-0.1609),no(-0.1973,-0.9777,0.0718),no(-0.1608,-0.9777,0.1350)]),
			n([v(-0.8073,-0.3053,0.6774),v(-0.9903,-0.3053,0.3604),v(-1.1628,-0.1993,0.4232),v(-0.9480,-0.1993,0.7954),],m["Torus"],[no(-0.1608,-0.9777,0.1350),no(-0.1973,-0.9777,0.0718),no(-0.7337,-0.6247,0.2670),no(-0.5981,-0.6247,0.5019)]),
			n([v(-0.9480,-0.1993,0.7954),v(-1.1628,-0.1993,0.4232),v(-1.2310,0.0000,0.4480),v(-1.0035,0.0000,0.8421),],m["Torus"],[no(-0.5981,-0.6247,0.5019),no(-0.7337,-0.6247,0.2670),no(-0.9397,0.0000,0.3420),no(-0.7660,0.0000,0.6428)]),
			n([v(-1.2310,0.0000,0.4480),v(-1.3100,0.0000,0.0000),v(-1.2375,0.1993,0.0000),v(-1.1628,0.1993,0.4232),],m["Torus"],[no(-0.9397,0.0000,0.3420),no(-1.0000,0.0000,0.0000),no(-0.7808,0.6247,0.0000),no(-0.7337,0.6247,0.2670)]),
			n([v(-1.1628,0.1993,0.4232),v(-1.2375,0.1993,0.0000),v(-1.0538,0.3053,0.0000),v(-0.9903,0.3053,0.3604),],m["Torus"],[no(-0.7337,0.6247,0.2670),no(-0.7808,0.6247,0.0000),no(-0.2100,0.9777,0.0000),no(-0.1973,0.9777,0.0718)]),
			n([v(-0.9903,0.3053,0.3604),v(-1.0538,0.3053,0.0000),v(-0.8450,0.2685,0.0000),v(-0.7940,0.2685,0.2890),],m["Torus"],[no(-0.1973,0.9777,0.0718),no(-0.2100,0.9777,0.0000),no(0.4704,0.8824,0.0000),no(0.4421,0.8824,-0.1609)]),
			n([v(-0.7940,0.2685,0.2890),v(-0.8450,0.2685,0.0000),v(-0.7087,0.1060,0.0000),v(-0.6660,0.1060,0.2424),],m["Torus"],[no(0.4421,0.8824,-0.1609),no(0.4704,0.8824,0.0000),no(0.9349,0.3548,0.0000),no(0.8785,0.3548,-0.3197)]),
			n([v(-0.6660,0.1060,0.2424),v(-0.7087,0.1060,0.0000),v(-0.7087,-0.1060,0.0000),v(-0.6660,-0.1060,0.2424),],m["Torus"],[no(0.8785,0.3548,-0.3197),no(0.9349,0.3548,0.0000),no(0.9349,-0.3548,0.0000),no(0.8785,-0.3548,-0.3197)]),
			n([v(-0.6660,-0.1060,0.2424),v(-0.7087,-0.1060,0.0000),v(-0.8450,-0.2685,0.0000),v(-0.7940,-0.2685,0.2890),],m["Torus"],[no(0.8785,-0.3548,-0.3197),no(0.9349,-0.3548,0.0000),no(0.4704,-0.8824,0.0000),no(0.4421,-0.8824,-0.1609)]),
			n([v(-0.7940,-0.2685,0.2890),v(-0.8450,-0.2685,0.0000),v(-1.0538,-0.3053,0.0000),v(-0.9903,-0.3053,0.3604),],m["Torus"],[no(0.4421,-0.8824,-0.1609),no(0.4704,-0.8824,0.0000),no(-0.2100,-0.9777,0.0000),no(-0.1973,-0.9777,0.0718)]),
			n([v(-0.9903,-0.3053,0.3604),v(-1.0538,-0.3053,0.0000),v(-1.2375,-0.1993,0.0000),v(-1.1628,-0.1993,0.4232),],m["Torus"],[no(-0.1973,-0.9777,0.0718),no(-0.2100,-0.9777,0.0000),no(-0.7808,-0.6247,0.0000),no(-0.7337,-0.6247,0.2670)]),
			n([v(-1.1628,-0.1993,0.4232),v(-1.2375,-0.1993,0.0000),v(-1.3100,0.0000,0.0000),v(-1.2310,0.0000,0.4480),],m["Torus"],[no(-0.7337,-0.6247,0.2670),no(-0.7808,-0.6247,0.0000),no(-1.0000,0.0000,0.0000),no(-0.9397,0.0000,0.3420)]),
			n([v(-1.3100,0.0000,0.0000),v(-1.2310,0.0000,-0.4480),v(-1.1628,0.1993,-0.4232),v(-1.2375,0.1993,0.0000),],m["Torus"],[no(-1.0000,0.0000,0.0000),no(-0.9397,0.0000,-0.3420),no(-0.7337,0.6247,-0.2670),no(-0.7808,0.6247,0.0000)]),
			n([v(-1.2375,0.1993,0.0000),v(-1.1628,0.1993,-0.4232),v(-0.9903,0.3053,-0.3604),v(-1.0538,0.3053,0.0000),],m["Torus"],[no(-0.7808,0.6247,0.0000),no(-0.7337,0.6247,-0.2670),no(-0.1973,0.9777,-0.0718),no(-0.2100,0.9777,0.0000)]),
			n([v(-1.0538,0.3053,0.0000),v(-0.9903,0.3053,-0.3604),v(-0.7940,0.2685,-0.2890),v(-0.8450,0.2685,0.0000),],m["Torus"],[no(-0.2100,0.9777,0.0000),no(-0.1973,0.9777,-0.0718),no(0.4421,0.8824,0.1609),no(0.4704,0.8824,0.0000)]),
			n([v(-0.8450,0.2685,0.0000),v(-0.7940,0.2685,-0.2890),v(-0.6660,0.1060,-0.2424),v(-0.7087,0.1060,0.0000),],m["Torus"],[no(0.4704,0.8824,0.0000),no(0.4421,0.8824,0.1609),no(0.8785,0.3548,0.3197),no(0.9349,0.3548,0.0000)]),
			n([v(-0.7087,0.1060,0.0000),v(-0.6660,0.1060,-0.2424),v(-0.6660,-0.1060,-0.2424),v(-0.7087,-0.1060,0.0000),],m["Torus"],[no(0.9349,0.3548,0.0000),no(0.8785,0.3548,0.3197),no(0.8785,-0.3548,0.3197),no(0.9349,-0.3548,0.0000)]),
			n([v(-0.7087,-0.1060,0.0000),v(-0.6660,-0.1060,-0.2424),v(-0.7940,-0.2685,-0.2890),v(-0.8450,-0.2685,0.0000),],m["Torus"],[no(0.9349,-0.3548,0.0000),no(0.8785,-0.3548,0.3197),no(0.4421,-0.8824,0.1609),no(0.4704,-0.8824,0.0000)]),
			n([v(-0.8450,-0.2685,0.0000),v(-0.7940,-0.2685,-0.2890),v(-0.9903,-0.3053,-0.3604),v(-1.0538,-0.3053,0.0000),],m["Torus"],[no(0.4704,-0.8824,0.0000),no(0.4421,-0.8824,0.1609),no(-0.1973,-0.9777,-0.0718),no(-0.2100,-0.9777,0.0000)]),
			n([v(-1.0538,-0.3053,0.0000),v(-0.9903,-0.3053,-0.3604),v(-1.1628,-0.1993,-0.4232),v(-1.2375,-0.1993,0.0000),],m["Torus"],[no(-0.2100,-0.9777,0.0000),no(-0.1973,-0.9777,-0.0718),no(-0.7337,-0.6247,-0.2670),no(-0.7808,-0.6247,0.0000)]),
			n([v(-1.2375,-0.1993,0.0000),v(-1.1628,-0.1993,-0.4232),v(-1.2310,0.0000,-0.4480),v(-1.3100,0.0000,0.0000),],m["Torus"],[no(-0.7808,-0.6247,0.0000),no(-0.7337,-0.6247,-0.2670),no(-0.9397,0.0000,-0.3420),no(-1.0000,0.0000,0.0000)]),
			n([v(-1.2310,0.0000,-0.4480),v(-1.0035,0.0000,-0.8421),v(-0.9480,0.1993,-0.7954),v(-1.1628,0.1993,-0.4232),],m["Torus"],[no(-0.9397,0.0000,-0.3420),no(-0.7660,0.0000,-0.6428),no(-0.5981,0.6247,-0.5019),no(-0.7337,0.6247,-0.2670)]),
			n([v(-1.1628,0.1993,-0.4232),v(-0.9480,0.1993,-0.7954),v(-0.8073,0.3053,-0.6774),v(-0.9903,0.3053,-0.3604),],m["Torus"],[no(-0.7337,0.6247,-0.2670),no(-0.5981,0.6247,-0.5019),no(-0.1608,0.9777,-0.1350),no(-0.1973,0.9777,-0.0718)]),
			n([v(-0.9903,0.3053,-0.3604),v(-0.8073,0.3053,-0.6774),v(-0.6473,0.2685,-0.5432),v(-0.7940,0.2685,-0.2890),],m["Torus"],[no(-0.1973,0.9777,-0.0718),no(-0.1608,0.9777,-0.1350),no(0.3604,0.8824,0.3024),no(0.4421,0.8824,0.1609)]),
			n([v(-0.7940,0.2685,-0.2890),v(-0.6473,0.2685,-0.5432),v(-0.5429,0.1060,-0.4555),v(-0.6660,0.1060,-0.2424),],m["Torus"],[no(0.4421,0.8824,0.1609),no(0.3604,0.8824,0.3024),no(0.7162,0.3548,0.6009),no(0.8785,0.3548,0.3197)]),
			n([v(-0.6660,0.1060,-0.2424),v(-0.5429,0.1060,-0.4555),v(-0.5429,-0.1060,-0.4555),v(-0.6660,-0.1060,-0.2424),],m["Torus"],[no(0.8785,0.3548,0.3197),no(0.7162,0.3548,0.6009),no(0.7162,-0.3548,0.6009),no(0.8785,-0.3548,0.3197)]),
			n([v(-0.6660,-0.1060,-0.2424),v(-0.5429,-0.1060,-0.4555),v(-0.6473,-0.2685,-0.5432),v(-0.7940,-0.2685,-0.2890),],m["Torus"],[no(0.8785,-0.3548,0.3197),no(0.7162,-0.3548,0.6009),no(0.3604,-0.8824,0.3024),no(0.4421,-0.8824,0.1609)]),
			n([v(-0.7940,-0.2685,-0.2890),v(-0.6473,-0.2685,-0.5432),v(-0.8073,-0.3053,-0.6774),v(-0.9903,-0.3053,-0.3604),],m["Torus"],[no(0.4421,-0.8824,0.1609),no(0.3604,-0.8824,0.3024),no(-0.1608,-0.9777,-0.1350),no(-0.1973,-0.9777,-0.0718)]),
			n([v(-0.9903,-0.3053,-0.3604),v(-0.8073,-0.3053,-0.6774),v(-0.9480,-0.1993,-0.7954),v(-1.1628,-0.1993,-0.4232),],m["Torus"],[no(-0.1973,-0.9777,-0.0718),no(-0.1608,-0.9777,-0.1350),no(-0.5981,-0.6247,-0.5019),no(-0.7337,-0.6247,-0.2670)]),
			n([v(-1.1628,-0.1993,-0.4232),v(-0.9480,-0.1993,-0.7954),v(-1.0035,0.0000,-0.8421),v(-1.2310,0.0000,-0.4480),],m["Torus"],[no(-0.7337,-0.6247,-0.2670),no(-0.5981,-0.6247,-0.5019),no(-0.7660,0.0000,-0.6428),no(-0.9397,0.0000,-0.3420)]),
			n([v(-1.0035,0.0000,-0.8421),v(-0.6550,0.0000,-1.1345),v(-0.6187,0.1993,-1.0717),v(-0.9480,0.1993,-0.7954),],m["Torus"],[no(-0.7660,0.0000,-0.6428),no(-0.5000,0.0000,-0.8660),no(-0.3904,0.6247,-0.6762),no(-0.5981,0.6247,-0.5019)]),
			n([v(-0.9480,0.1993,-0.7954),v(-0.6187,0.1993,-1.0717),v(-0.5269,0.3053,-0.9126),v(-0.8073,0.3053,-0.6774),],m["Torus"],[no(-0.5981,0.6247,-0.5019),no(-0.3904,0.6247,-0.6762),no(-0.1050,0.9777,-0.1818),no(-0.1608,0.9777,-0.1350)]),
			n([v(-0.8073,0.3053,-0.6774),v(-0.5269,0.3053,-0.9126),v(-0.4225,0.2685,-0.7318),v(-0.6473,0.2685,-0.5432),],m["Torus"],[no(-0.1608,0.9777,-0.1350),no(-0.1050,0.9777,-0.1818),no(0.2352,0.8824,0.4074),no(0.3604,0.8824,0.3024)]),
			n([v(-0.6473,0.2685,-0.5432),v(-0.4225,0.2685,-0.7318),v(-0.3543,0.1060,-0.6137),v(-0.5429,0.1060,-0.4555),],m["Torus"],[no(0.3604,0.8824,0.3024),no(0.2352,0.8824,0.4074),no(0.4675,0.3548,0.8097),no(0.7162,0.3548,0.6009)]),
			n([v(-0.5429,0.1060,-0.4555),v(-0.3543,0.1060,-0.6137),v(-0.3543,-0.1060,-0.6137),v(-0.5429,-0.1060,-0.4555),],m["Torus"],[no(0.7162,0.3548,0.6009),no(0.4675,0.3548,0.8097),no(0.4675,-0.3548,0.8097),no(0.7162,-0.3548,0.6009)]),
			n([v(-0.5429,-0.1060,-0.4555),v(-0.3543,-0.1060,-0.6137),v(-0.4225,-0.2685,-0.7318),v(-0.6473,-0.2685,-0.5432),],m["Torus"],[no(0.7162,-0.3548,0.6009),no(0.4675,-0.3548,0.8097),no(0.2352,-0.8824,0.4074),no(0.3604,-0.8824,0.3024)]),
			n([v(-0.6473,-0.2685,-0.5432),v(-0.4225,-0.2685,-0.7318),v(-0.5269,-0.3053,-0.9126),v(-0.8073,-0.3053,-0.6774),],m["Torus"],[no(0.3604,-0.8824,0.3024),no(0.2352,-0.8824,0.4074),no(-0.1050,-0.9777,-0.1818),no(-0.1608,-0.9777,-0.1350)]),
			n([v(-0.8073,-0.3053,-0.6774),v(-0.5269,-0.3053,-0.9126),v(-0.6187,-0.1993,-1.0717),v(-0.9480,-0.1993,-0.7954),],m["Torus"],[no(-0.1608,-0.9777,-0.1350),no(-0.1050,-0.9777,-0.1818),no(-0.3904,-0.6247,-0.6762),no(-0.5981,-0.6247,-0.5019)]),
			n([v(-0.9480,-0.1993,-0.7954),v(-0.6187,-0.1993,-1.0717),v(-0.6550,0.0000,-1.1345),v(-1.0035,0.0000,-0.8421),],m["Torus"],[no(-0.5981,-0.6247,-0.5019),no(-0.3904,-0.6247,-0.6762),no(-0.5000,0.0000,-0.8660),no(-0.7660,0.0000,-0.6428)]),
			n([v(-0.6550,0.0000,-1.1345),v(-0.2275,0.0000,-1.2901),v(-0.2149,0.1993,-1.2187),v(-0.6187,0.1993,-1.0717),],m["Torus"],[no(-0.5000,0.0000,-0.8660),no(-0.1736,0.0000,-0.9848),no(-0.1356,0.6247,-0.7690),no(-0.3904,0.6247,-0.6762)]),
			n([v(-0.6187,0.1993,-1.0717),v(-0.2149,0.1993,-1.2187),v(-0.1830,0.3053,-1.0378),v(-0.5269,0.3053,-0.9126),],m["Torus"],[no(-0.3904,0.6247,-0.6762),no(-0.1356,0.6247,-0.7690),no(-0.0364,0.9777,-0.2068),no(-0.1050,0.9777,-0.1818)]),
			n([v(-0.5269,0.3053,-0.9126),v(-0.1830,0.3053,-1.0378),v(-0.1467,0.2685,-0.8322),v(-0.4225,0.2685,-0.7318),],m["Torus"],[no(-0.1050,0.9777,-0.1818),no(-0.0364,0.9777,-0.2068),no(0.0817,0.8824,0.4633),no(0.2352,0.8824,0.4074)]),
			n([v(-0.4225,0.2685,-0.7318),v(-0.1467,0.2685,-0.8322),v(-0.1231,0.1060,-0.6979),v(-0.3543,0.1060,-0.6137),],m["Torus"],[no(0.2352,0.8824,0.4074),no(0.0817,0.8824,0.4633),no(0.1623,0.3548,0.9207),no(0.4675,0.3548,0.8097)]),
			n([v(-0.3543,0.1060,-0.6137),v(-0.1231,0.1060,-0.6979),v(-0.1231,-0.1060,-0.6979),v(-0.3543,-0.1060,-0.6137),],m["Torus"],[no(0.4675,0.3548,0.8097),no(0.1623,0.3548,0.9207),no(0.1623,-0.3548,0.9207),no(0.4675,-0.3548,0.8097)]),
			n([v(-0.3543,-0.1060,-0.6137),v(-0.1231,-0.1060,-0.6979),v(-0.1467,-0.2685,-0.8322),v(-0.4225,-0.2685,-0.7318),],m["Torus"],[no(0.4675,-0.3548,0.8097),no(0.1623,-0.3548,0.9207),no(0.0817,-0.8824,0.4633),no(0.2352,-0.8824,0.4074)]),
			n([v(-0.4225,-0.2685,-0.7318),v(-0.1467,-0.2685,-0.8322),v(-0.1830,-0.3053,-1.0378),v(-0.5269,-0.3053,-0.9126),],m["Torus"],[no(0.2352,-0.8824,0.4074),no(0.0817,-0.8824,0.4633),no(-0.0364,-0.9777,-0.2068),no(-0.1050,-0.9777,-0.1818)]),
			n([v(-0.5269,-0.3053,-0.9126),v(-0.1830,-0.3053,-1.0378),v(-0.2149,-0.1993,-1.2187),v(-0.6187,-0.1993,-1.0717),],m["Torus"],[no(-0.1050,-0.9777,-0.1818),no(-0.0364,-0.9777,-0.2068),no(-0.1356,-0.6247,-0.7690),no(-0.3904,-0.6247,-0.6762)]),
			n([v(-0.6187,-0.1993,-1.0717),v(-0.2149,-0.1993,-1.2187),v(-0.2275,0.0000,-1.2901),v(-0.6550,0.0000,-1.1345),],m["Torus"],[no(-0.3904,-0.6247,-0.6762),no(-0.1356,-0.6247,-0.7690),no(-0.1736,0.0000,-0.9848),no(-0.5000,0.0000,-0.8660)]),
			n([v(-0.2275,0.0000,-1.2901),v(0.2275,0.0000,-1.2901),v(0.2149,0.1993,-1.2187),v(-0.2149,0.1993,-1.2187),],m["Torus"],[no(-0.1736,0.0000,-0.9848),no(0.1736,0.0000,-0.9848),no(0.1356,0.6247,-0.7690),no(-0.1356,0.6247,-0.7690)]),
			n([v(-0.2149,0.1993,-1.2187),v(0.2149,0.1993,-1.2187),v(0.1830,0.3053,-1.0378),v(-0.1830,0.3053,-1.0378),],m["Torus"],[no(-0.1356,0.6247,-0.7690),no(0.1356,0.6247,-0.7690),no(0.0364,0.9777,-0.2068),no(-0.0364,0.9777,-0.2068)]),
			n([v(-0.1830,0.3053,-1.0378),v(0.1830,0.3053,-1.0378),v(0.1467,0.2685,-0.8322),v(-0.1467,0.2685,-0.8322),],m["Torus"],[no(-0.0364,0.9777,-0.2068),no(0.0364,0.9777,-0.2068),no(-0.0817,0.8824,0.4633),no(0.0817,0.8824,0.4633)]),
			n([v(-0.1467,0.2685,-0.8322),v(0.1467,0.2685,-0.8322),v(0.1231,0.1060,-0.6979),v(-0.1231,0.1060,-0.6979),],m["Torus"],[no(0.0817,0.8824,0.4633),no(-0.0817,0.8824,0.4633),no(-0.1623,0.3548,0.9207),no(0.1623,0.3548,0.9207)]),
			n([v(-0.1231,0.1060,-0.6979),v(0.1231,0.1060,-0.6979),v(0.1231,-0.1060,-0.6979),v(-0.1231,-0.1060,-0.6979),],m["Torus"],[no(0.1623,0.3548,0.9207),no(-0.1623,0.3548,0.9207),no(-0.1623,-0.3548,0.9207),no(0.1623,-0.3548,0.9207)]),
			n([v(-0.1231,-0.1060,-0.6979),v(0.1231,-0.1060,-0.6979),v(0.1467,-0.2685,-0.8322),v(-0.1467,-0.2685,-0.8322),],m["Torus"],[no(0.1623,-0.3548,0.9207),no(-0.1623,-0.3548,0.9207),no(-0.0817,-0.8824,0.4633),no(0.0817,-0.8824,0.4633)]),
			n([v(-0.1467,-0.2685,-0.8322),v(0.1467,-0.2685,-0.8322),v(0.1830,-0.3053,-1.0378),v(-0.1830,-0.3053,-1.0378),],m["Torus"],[no(0.0817,-0.8824,0.4633),no(-0.0817,-0.8824,0.4633),no(0.0364,-0.9777,-0.2068),no(-0.0364,-0.9777,-0.2068)]),
			n([v(-0.1830,-0.3053,-1.0378),v(0.1830,-0.3053,-1.0378),v(0.2149,-0.1993,-1.2187),v(-0.2149,-0.1993,-1.2187),],m["Torus"],[no(-0.0364,-0.9777,-0.2068),no(0.0364,-0.9777,-0.2068),no(0.1356,-0.6247,-0.7690),no(-0.1356,-0.6247,-0.7690)]),
			n([v(-0.2149,-0.1993,-1.2187),v(0.2149,-0.1993,-1.2187),v(0.2275,0.0000,-1.2901),v(-0.2275,0.0000,-1.2901),],m["Torus"],[no(-0.1356,-0.6247,-0.7690),no(0.1356,-0.6247,-0.7690),no(0.1736,0.0000,-0.9848),no(-0.1736,0.0000,-0.9848)]),
			n([v(0.2275,0.0000,-1.2901),v(0.6550,0.0000,-1.1345),v(0.6187,0.1993,-1.0717),v(0.2149,0.1993,-1.2187),],m["Torus"],[no(0.1736,0.0000,-0.9848),no(0.5000,0.0000,-0.8660),no(0.3904,0.6247,-0.6762),no(0.1356,0.6247,-0.7690)]),
			n([v(0.2149,0.1993,-1.2187),v(0.6187,0.1993,-1.0717),v(0.5269,0.3053,-0.9126),v(0.1830,0.3053,-1.0378),],m["Torus"],[no(0.1356,0.6247,-0.7690),no(0.3904,0.6247,-0.6762),no(0.1050,0.9777,-0.1818),no(0.0364,0.9777,-0.2068)]),
			n([v(0.1830,0.3053,-1.0378),v(0.5269,0.3053,-0.9126),v(0.4225,0.2685,-0.7318),v(0.1467,0.2685,-0.8322),],m["Torus"],[no(0.0364,0.9777,-0.2068),no(0.1050,0.9777,-0.1818),no(-0.2352,0.8824,0.4074),no(-0.0817,0.8824,0.4633)]),
			n([v(0.1467,0.2685,-0.8322),v(0.4225,0.2685,-0.7318),v(0.3543,0.1060,-0.6137),v(0.1231,0.1060,-0.6979),],m["Torus"],[no(-0.0817,0.8824,0.4633),no(-0.2352,0.8824,0.4074),no(-0.4675,0.3548,0.8097),no(-0.1623,0.3548,0.9207)]),
			n([v(0.1231,0.1060,-0.6979),v(0.3543,0.1060,-0.6137),v(0.3543,-0.1060,-0.6137),v(0.1231,-0.1060,-0.6979),],m["Torus"],[no(-0.1623,0.3548,0.9207),no(-0.4675,0.3548,0.8097),no(-0.4675,-0.3548,0.8097),no(-0.1623,-0.3548,0.9207)]),
			n([v(0.1231,-0.1060,-0.6979),v(0.3543,-0.1060,-0.6137),v(0.4225,-0.2685,-0.7318),v(0.1467,-0.2685,-0.8322),],m["Torus"],[no(-0.1623,-0.3548,0.9207),no(-0.4675,-0.3548,0.8097),no(-0.2352,-0.8824,0.4074),no(-0.0817,-0.8824,0.4633)]),
			n([v(0.1467,-0.2685,-0.8322),v(0.4225,-0.2685,-0.7318),v(0.5269,-0.3053,-0.9126),v(0.1830,-0.3053,-1.0378),],m["Torus"],[no(-0.0817,-0.8824,0.4633),no(-0.2352,-0.8824,0.4074),no(0.1050,-0.9777,-0.1818),no(0.0364,-0.9777,-0.2068)]),
			n([v(0.1830,-0.3053,-1.0378),v(0.5269,-0.3053,-0.9126),v(0.6187,-0.1993,-1.0717),v(0.2149,-0.1993,-1.2187),],m["Torus"],[no(0.0364,-0.9777,-0.2068),no(0.1050,-0.9777,-0.1818),no(0.3904,-0.6247,-0.6762),no(0.1356,-0.6247,-0.7690)]),
			n([v(0.2149,-0.1993,-1.2187),v(0.6187,-0.1993,-1.0717),v(0.6550,0.0000,-1.1345),v(0.2275,0.0000,-1.2901),],m["Torus"],[no(0.1356,-0.6247,-0.7690),no(0.3904,-0.6247,-0.6762),no(0.5000,0.0000,-0.8660),no(0.1736,0.0000,-0.9848)]),
			n([v(0.6550,0.0000,-1.1345),v(1.0035,0.0000,-0.8421),v(0.9480,0.1993,-0.7954),v(0.6187,0.1993,-1.0717),],m["Torus"],[no(0.5000,0.0000,-0.8660),no(0.7660,0.0000,-0.6428),no(0.5981,0.6247,-0.5019),no(0.3904,0.6247,-0.6762)]),
			n([v(0.6187,0.1993,-1.0717),v(0.9480,0.1993,-0.7954),v(0.8073,0.3053,-0.6774),v(0.5269,0.3053,-0.9126),],m["Torus"],[no(0.3904,0.6247,-0.6762),no(0.5981,0.6247,-0.5019),no(0.1608,0.9777,-0.1350),no(0.1050,0.9777,-0.1818)]),
			n([v(0.5269,0.3053,-0.9126),v(0.8073,0.3053,-0.6774),v(0.6473,0.2685,-0.5432),v(0.4225,0.2685,-0.7318),],m["Torus"],[no(0.1050,0.9777,-0.1818),no(0.1608,0.9777,-0.1350),no(-0.3604,0.8824,0.3024),no(-0.2352,0.8824,0.4074)]),
			n([v(0.4225,0.2685,-0.7318),v(0.6473,0.2685,-0.5432),v(0.5429,0.1060,-0.4555),v(0.3543,0.1060,-0.6137),],m["Torus"],[no(-0.2352,0.8824,0.4074),no(-0.3604,0.8824,0.3024),no(-0.7162,0.3548,0.6009),no(-0.4675,0.3548,0.8097)]),
			n([v(0.3543,0.1060,-0.6137),v(0.5429,0.1060,-0.4555),v(0.5429,-0.1060,-0.4555),v(0.3543,-0.1060,-0.6137),],m["Torus"],[no(-0.4675,0.3548,0.8097),no(-0.7162,0.3548,0.6009),no(-0.7162,-0.3548,0.6009),no(-0.4675,-0.3548,0.8097)]),
			n([v(0.3543,-0.1060,-0.6137),v(0.5429,-0.1060,-0.4555),v(0.6473,-0.2685,-0.5432),v(0.4225,-0.2685,-0.7318),],m["Torus"],[no(-0.4675,-0.3548,0.8097),no(-0.7162,-0.3548,0.6009),no(-0.3604,-0.8824,0.3024),no(-0.2352,-0.8824,0.4074)]),
			n([v(0.4225,-0.2685,-0.7318),v(0.6473,-0.2685,-0.5432),v(0.8073,-0.3053,-0.6774),v(0.5269,-0.3053,-0.9126),],m["Torus"],[no(-0.2352,-0.8824,0.4074),no(-0.3604,-0.8824,0.3024),no(0.1608,-0.9777,-0.1350),no(0.1050,-0.9777,-0.1818)]),
			n([v(0.5269,-0.3053,-0.9126),v(0.8073,-0.3053,-0.6774),v(0.9480,-0.1993,-0.7954),v(0.6187,-0.1993,-1.0717),],m["Torus"],[no(0.1050,-0.9777,-0.1818),no(0.1608,-0.9777,-0.1350),no(0.5981,-0.6247,-0.5019),no(0.3904,-0.6247,-0.6762)]),
			n([v(0.6187,-0.1993,-1.0717),v(0.9480,-0.1993,-0.7954),v(1.0035,0.0000,-0.8421),v(0.6550,0.0000,-1.1345),],m["Torus"],[no(0.3904,-0.6247,-0.6762),no(0.5981,-0.6247,-0.5019),no(0.7660,0.0000,-0.6428),no(0.5000,0.0000,-0.8660)]),
			n([v(1.0035,0.0000,-0.8421),v(1.2310,0.0000,-0.4480),v(1.1628,0.1993,-0.4232),v(0.9480,0.1993,-0.7954),],m["Torus"],[no(0.7660,0.0000,-0.6428),no(0.9397,0.0000,-0.3420),no(0.7337,0.6247,-0.2670),no(0.5981,0.6247,-0.5019)]),
			n([v(0.9480,0.1993,-0.7954),v(1.1628,0.1993,-0.4232),v(0.9903,0.3053,-0.3604),v(0.8073,0.3053,-0.6774),],m["Torus"],[no(0.5981,0.6247,-0.5019),no(0.7337,0.6247,-0.2670),no(0.1973,0.9777,-0.0718),no(0.1608,0.9777,-0.1350)]),
			n([v(0.8073,0.3053,-0.6774),v(0.9903,0.3053,-0.3604),v(0.7940,0.2685,-0.2890),v(0.6473,0.2685,-0.5432),],m["Torus"],[no(0.1608,0.9777,-0.1350),no(0.1973,0.9777,-0.0718),no(-0.4421,0.8824,0.1609),no(-0.3604,0.8824,0.3024)]),
			n([v(0.6473,0.2685,-0.5432),v(0.7940,0.2685,-0.2890),v(0.6660,0.1060,-0.2424),v(0.5429,0.1060,-0.4555),],m["Torus"],[no(-0.3604,0.8824,0.3024),no(-0.4421,0.8824,0.1609),no(-0.8785,0.3548,0.3197),no(-0.7162,0.3548,0.6009)]),
			n([v(0.5429,0.1060,-0.4555),v(0.6660,0.1060,-0.2424),v(0.6660,-0.1060,-0.2424),v(0.5429,-0.1060,-0.4555),],m["Torus"],[no(-0.7162,0.3548,0.6009),no(-0.8785,0.3548,0.3197),no(-0.8785,-0.3548,0.3197),no(-0.7162,-0.3548,0.6009)]),
			n([v(0.5429,-0.1060,-0.4555),v(0.6660,-0.1060,-0.2424),v(0.7940,-0.2685,-0.2890),v(0.6473,-0.2685,-0.5432),],m["Torus"],[no(-0.7162,-0.3548,0.6009),no(-0.8785,-0.3548,0.3197),no(-0.4421,-0.8824,0.1609),no(-0.3604,-0.8824,0.3024)]),
			n([v(0.6473,-0.2685,-0.5432),v(0.7940,-0.2685,-0.2890),v(0.9903,-0.3053,-0.3604),v(0.8073,-0.3053,-0.6774),],m["Torus"],[no(-0.3604,-0.8824,0.3024),no(-0.4421,-0.8824,0.1609),no(0.1973,-0.9777,-0.0718),no(0.1608,-0.9777,-0.1350)]),
			n([v(0.8073,-0.3053,-0.6774),v(0.9903,-0.3053,-0.3604),v(1.1628,-0.1993,-0.4232),v(0.9480,-0.1993,-0.7954),],m["Torus"],[no(0.1608,-0.9777,-0.1350),no(0.1973,-0.9777,-0.0718),no(0.7337,-0.6247,-0.2670),no(0.5981,-0.6247,-0.5019)]),
			n([v(0.9480,-0.1993,-0.7954),v(1.1628,-0.1993,-0.4232),v(1.2310,0.0000,-0.4480),v(1.0035,0.0000,-0.8421),],m["Torus"],[no(0.5981,-0.6247,-0.5019),no(0.7337,-0.6247,-0.2670),no(0.9397,0.0000,-0.3420),no(0.7660,0.0000,-0.6428)]),
			n([v(1.2310,0.0000,-0.4480),v(1.3100,0.0000,0.0000),v(1.2375,0.1993,0.0000),v(1.1628,0.1993,-0.4232),],m["Torus"],[no(0.9397,0.0000,-0.3420),no(1.0000,0.0000,0.0000),no(0.7808,0.6247,0.0000),no(0.7337,0.6247,-0.2670)]),
			n([v(1.1628,0.1993,-0.4232),v(1.2375,0.1993,0.0000),v(1.0538,0.3053,0.0000),v(0.9903,0.3053,-0.3604),],m["Torus"],[no(0.7337,0.6247,-0.2670),no(0.7808,0.6247,0.0000),no(0.2100,0.9777,0.0000),no(0.1973,0.9777,-0.0718)]),
			n([v(0.9903,0.3053,-0.3604),v(1.0538,0.3053,0.0000),v(0.8450,0.2685,0.0000),v(0.7940,0.2685,-0.2890),],m["Torus"],[no(0.1973,0.9777,-0.0718),no(0.2100,0.9777,0.0000),no(-0.4704,0.8824,0.0000),no(-0.4421,0.8824,0.1609)]),
			n([v(0.7940,0.2685,-0.2890),v(0.8450,0.2685,0.0000),v(0.7087,0.1060,0.0000),v(0.6660,0.1060,-0.2424),],m["Torus"],[no(-0.4421,0.8824,0.1609),no(-0.4704,0.8824,0.0000),no(-0.9349,0.3548,0.0000),no(-0.8785,0.3548,0.3197)]),
			n([v(0.6660,0.1060,-0.2424),v(0.7087,0.1060,0.0000),v(0.7087,-0.1060,0.0000),v(0.6660,-0.1060,-0.2424),],m["Torus"],[no(-0.8785,0.3548,0.3197),no(-0.9349,0.3548,0.0000),no(-0.9349,-0.3548,0.0000),no(-0.8785,-0.3548,0.3197)]),
			n([v(0.6660,-0.1060,-0.2424),v(0.7087,-0.1060,0.0000),v(0.8450,-0.2685,0.0000),v(0.7940,-0.2685,-0.2890),],m["Torus"],[no(-0.8785,-0.3548,0.3197),no(-0.9349,-0.3548,0.0000),no(-0.4704,-0.8824,0.0000),no(-0.4421,-0.8824,0.1609)]),
			n([v(0.7940,-0.2685,-0.2890),v(0.8450,-0.2685,0.0000),v(1.0538,-0.3053,0.0000),v(0.9903,-0.3053,-0.3604),],m["Torus"],[no(-0.4421,-0.8824,0.1609),no(-0.4704,-0.8824,0.0000),no(0.2100,-0.9777,0.0000),no(0.1973,-0.9777,-0.0718)]),
			n([v(0.9903,-0.3053,-0.3604),v(1.0538,-0.3053,0.0000),v(1.2375,-0.1993,0.0000),v(1.1628,-0.1993,-0.4232),],m["Torus"],[no(0.1973,-0.9777,-0.0718),no(0.2100,-0.9777,0.0000),no(0.7808,-0.6247,0.0000),no(0.7337,-0.6247,-0.2670)]),
			n([v(1.1628,-0.1993,-0.4232),v(1.2375,-0.1993,0.0000),v(1.3100,0.0000,0.0000),v(1.2310,0.0000,-0.4480),],m["Torus"],[no(0.7337,-0.6247,-0.2670),no(0.7808,-0.6247,0.0000),no(1.0000,0.0000,0.0000),no(0.9397,0.0000,-0.3420)]),
		]);
	}
};
