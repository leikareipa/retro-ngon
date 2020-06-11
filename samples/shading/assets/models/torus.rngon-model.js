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
		const no = Rngon.vector3; // Normal.
		const v = Rngon.vertex;
		const c = Rngon.color_rgba;
		const ct = Rngon.texture_rgba.create_with_data_from_file;

		// Load the textures.
		const t = {
		};

		// Set up the materials.
		const m = {
			"Torus":{color:c(0,150,150),shading:"flat",ambientLightLevel:0.3},
		};

		// Create the n-gons.
		this.ngons = Object.freeze(
		[
			// Mesh: Torus.
			n([v(1.3100,0.0000,0.0000),v(1.2310,0.0000,0.4480),v(1.1628,0.1993,0.4232),v(1.2375,0.1993,0.0000),],m["Torus"],no(0.9271,0.3374,0.1635)),
			n([v(1.2375,0.1993,0.0000),v(1.1628,0.1993,0.4232),v(0.9903,0.3053,0.3604),v(1.0538,0.3053,0.0000),],m["Torus"],no(0.4981,0.8627,0.0878)),
			n([v(1.0538,0.3053,0.0000),v(0.9903,0.3053,0.3604),v(0.7940,0.2685,0.2890),v(0.8450,0.2685,0.0000),],m["Torus"],no(-0.1736,0.9843,-0.0306)),
			n([v(0.8450,0.2685,0.0000),v(0.7940,0.2685,0.2890),v(0.6660,0.1060,0.2424),v(0.7087,0.1060,0.0000),],m["Torus"],no(-0.7592,0.6370,-0.1339)),
			n([v(0.7087,0.1060,0.0000),v(0.6660,0.1060,0.2424),v(0.6660,-0.1060,0.2424),v(0.7087,-0.1060,0.0000),],m["Torus"],no(-0.9848,0.0000,-0.1736)),
			n([v(0.7087,-0.1060,0.0000),v(0.6660,-0.1060,0.2424),v(0.7940,-0.2685,0.2890),v(0.8450,-0.2685,0.0000),],m["Torus"],no(-0.7592,-0.6370,-0.1339)),
			n([v(0.8450,-0.2685,0.0000),v(0.7940,-0.2685,0.2890),v(0.9903,-0.3053,0.3604),v(1.0538,-0.3053,0.0000),],m["Torus"],no(-0.1736,-0.9843,-0.0306)),
			n([v(1.0538,-0.3053,0.0000),v(0.9903,-0.3053,0.3604),v(1.1628,-0.1993,0.4232),v(1.2375,-0.1993,0.0000),],m["Torus"],no(0.4981,-0.8627,0.0878)),
			n([v(1.2375,-0.1993,0.0000),v(1.1628,-0.1993,0.4232),v(1.2310,0.0000,0.4480),v(1.3100,0.0000,0.0000),],m["Torus"],no(0.9271,-0.3374,0.1635)),
			n([v(1.2310,0.0000,0.4480),v(1.0035,0.0000,0.8421),v(0.9480,0.1993,0.7954),v(1.1628,0.1993,0.4232),],m["Torus"],no(0.8152,0.3374,0.4707)),
			n([v(1.1628,0.1993,0.4232),v(0.9480,0.1993,0.7954),v(0.8073,0.3053,0.6774),v(0.9903,0.3053,0.3604),],m["Torus"],no(0.4380,0.8627,0.2529)),
			n([v(0.9903,0.3053,0.3604),v(0.8073,0.3053,0.6774),v(0.6473,0.2685,0.5432),v(0.7940,0.2685,0.2890),],m["Torus"],no(-0.1526,0.9843,-0.0881)),
			n([v(0.7940,0.2685,0.2890),v(0.6473,0.2685,0.5432),v(0.5429,0.1060,0.4555),v(0.6660,0.1060,0.2424),],m["Torus"],no(-0.6676,0.6370,-0.3854)),
			n([v(0.6660,0.1060,0.2424),v(0.5429,0.1060,0.4555),v(0.5429,-0.1060,0.4555),v(0.6660,-0.1060,0.2424),],m["Torus"],no(-0.8660,0.0000,-0.5000)),
			n([v(0.6660,-0.1060,0.2424),v(0.5429,-0.1060,0.4555),v(0.6473,-0.2685,0.5432),v(0.7940,-0.2685,0.2890),],m["Torus"],no(-0.6676,-0.6370,-0.3854)),
			n([v(0.7940,-0.2685,0.2890),v(0.6473,-0.2685,0.5432),v(0.8073,-0.3053,0.6774),v(0.9903,-0.3053,0.3604),],m["Torus"],no(-0.1526,-0.9843,-0.0881)),
			n([v(0.9903,-0.3053,0.3604),v(0.8073,-0.3053,0.6774),v(0.9480,-0.1993,0.7954),v(1.1628,-0.1993,0.4232),],m["Torus"],no(0.4380,-0.8627,0.2529)),
			n([v(1.1628,-0.1993,0.4232),v(0.9480,-0.1993,0.7954),v(1.0035,0.0000,0.8421),v(1.2310,0.0000,0.4480),],m["Torus"],no(0.8152,-0.3374,0.4707)),
			n([v(1.0035,0.0000,0.8421),v(0.6550,0.0000,1.1345),v(0.6187,0.1993,1.0717),v(0.9480,0.1993,0.7954),],m["Torus"],no(0.6051,0.3374,0.7211)),
			n([v(0.9480,0.1993,0.7954),v(0.6187,0.1993,1.0717),v(0.5269,0.3053,0.9126),v(0.8073,0.3053,0.6774),],m["Torus"],no(0.3251,0.8627,0.3874)),
			n([v(0.8073,0.3053,0.6774),v(0.5269,0.3053,0.9126),v(0.4225,0.2685,0.7318),v(0.6473,0.2685,0.5432),],m["Torus"],no(-0.1133,0.9843,-0.1350)),
			n([v(0.6473,0.2685,0.5432),v(0.4225,0.2685,0.7318),v(0.3543,0.1060,0.6137),v(0.5429,0.1060,0.4555),],m["Torus"],no(-0.4955,0.6370,-0.5905)),
			n([v(0.5429,0.1060,0.4555),v(0.3543,0.1060,0.6137),v(0.3543,-0.1060,0.6137),v(0.5429,-0.1060,0.4555),],m["Torus"],no(-0.6428,0.0000,-0.7660)),
			n([v(0.5429,-0.1060,0.4555),v(0.3543,-0.1060,0.6137),v(0.4225,-0.2685,0.7318),v(0.6473,-0.2685,0.5432),],m["Torus"],no(-0.4955,-0.6370,-0.5905)),
			n([v(0.6473,-0.2685,0.5432),v(0.4225,-0.2685,0.7318),v(0.5269,-0.3053,0.9126),v(0.8073,-0.3053,0.6774),],m["Torus"],no(-0.1133,-0.9843,-0.1350)),
			n([v(0.8073,-0.3053,0.6774),v(0.5269,-0.3053,0.9126),v(0.6187,-0.1993,1.0717),v(0.9480,-0.1993,0.7954),],m["Torus"],no(0.3251,-0.8627,0.3874)),
			n([v(0.9480,-0.1993,0.7954),v(0.6187,-0.1993,1.0717),v(0.6550,0.0000,1.1345),v(1.0035,0.0000,0.8421),],m["Torus"],no(0.6051,-0.3374,0.7211)),
			n([v(0.6550,0.0000,1.1345),v(0.2275,0.0000,1.2901),v(0.2149,0.1993,1.2187),v(0.6187,0.1993,1.0717),],m["Torus"],no(0.3220,0.3374,0.8846)),
			n([v(0.6187,0.1993,1.0717),v(0.2149,0.1993,1.2187),v(0.1830,0.3053,1.0378),v(0.5269,0.3053,0.9126),],m["Torus"],no(0.1730,0.8627,0.4753)),
			n([v(0.5269,0.3053,0.9126),v(0.1830,0.3053,1.0378),v(0.1467,0.2685,0.8322),v(0.4225,0.2685,0.7318),],m["Torus"],no(-0.0603,0.9843,-0.1656)),
			n([v(0.4225,0.2685,0.7318),v(0.1467,0.2685,0.8322),v(0.1231,0.1060,0.6979),v(0.3543,0.1060,0.6137),],m["Torus"],no(-0.2637,0.6370,-0.7244)),
			n([v(0.3543,0.1060,0.6137),v(0.1231,0.1060,0.6979),v(0.1231,-0.1060,0.6979),v(0.3543,-0.1060,0.6137),],m["Torus"],no(-0.3420,0.0000,-0.9397)),
			n([v(0.3543,-0.1060,0.6137),v(0.1231,-0.1060,0.6979),v(0.1467,-0.2685,0.8322),v(0.4225,-0.2685,0.7318),],m["Torus"],no(-0.2637,-0.6370,-0.7244)),
			n([v(0.4225,-0.2685,0.7318),v(0.1467,-0.2685,0.8322),v(0.1830,-0.3053,1.0378),v(0.5269,-0.3053,0.9126),],m["Torus"],no(-0.0603,-0.9843,-0.1656)),
			n([v(0.5269,-0.3053,0.9126),v(0.1830,-0.3053,1.0378),v(0.2149,-0.1993,1.2187),v(0.6187,-0.1993,1.0717),],m["Torus"],no(0.1730,-0.8627,0.4753)),
			n([v(0.6187,-0.1993,1.0717),v(0.2149,-0.1993,1.2187),v(0.2275,0.0000,1.2901),v(0.6550,0.0000,1.1345),],m["Torus"],no(0.3220,-0.3374,0.8846)),
			n([v(0.2275,0.0000,1.2901),v(-0.2275,0.0000,1.2901),v(-0.2149,0.1993,1.2187),v(0.2149,0.1993,1.2187),],m["Torus"],no(0.0000,0.3374,0.9414)),
			n([v(0.2149,0.1993,1.2187),v(-0.2149,0.1993,1.2187),v(-0.1830,0.3053,1.0378),v(0.1830,0.3053,1.0378),],m["Torus"],no(0.0000,0.8627,0.5058)),
			n([v(0.1830,0.3053,1.0378),v(-0.1830,0.3053,1.0378),v(-0.1467,0.2685,0.8322),v(0.1467,0.2685,0.8322),],m["Torus"],no(-0.0000,0.9843,-0.1762)),
			n([v(0.1467,0.2685,0.8322),v(-0.1467,0.2685,0.8322),v(-0.1231,0.1060,0.6979),v(0.1231,0.1060,0.6979),],m["Torus"],no(-0.0000,0.6370,-0.7709)),
			n([v(0.1231,0.1060,0.6979),v(-0.1231,0.1060,0.6979),v(-0.1231,-0.1060,0.6979),v(0.1231,-0.1060,0.6979),],m["Torus"],no(-0.0000,0.0000,-1.0000)),
			n([v(0.1231,-0.1060,0.6979),v(-0.1231,-0.1060,0.6979),v(-0.1467,-0.2685,0.8322),v(0.1467,-0.2685,0.8322),],m["Torus"],no(-0.0000,-0.6370,-0.7709)),
			n([v(0.1467,-0.2685,0.8322),v(-0.1467,-0.2685,0.8322),v(-0.1830,-0.3053,1.0378),v(0.1830,-0.3053,1.0378),],m["Torus"],no(-0.0000,-0.9843,-0.1762)),
			n([v(0.1830,-0.3053,1.0378),v(-0.1830,-0.3053,1.0378),v(-0.2149,-0.1993,1.2187),v(0.2149,-0.1993,1.2187),],m["Torus"],no(0.0000,-0.8627,0.5058)),
			n([v(0.2149,-0.1993,1.2187),v(-0.2149,-0.1993,1.2187),v(-0.2275,0.0000,1.2901),v(0.2275,0.0000,1.2901),],m["Torus"],no(0.0000,-0.3374,0.9414)),
			n([v(-0.2275,0.0000,1.2901),v(-0.6550,0.0000,1.1345),v(-0.6187,0.1993,1.0717),v(-0.2149,0.1993,1.2187),],m["Torus"],no(-0.3220,0.3374,0.8846)),
			n([v(-0.2149,0.1993,1.2187),v(-0.6187,0.1993,1.0717),v(-0.5269,0.3053,0.9126),v(-0.1830,0.3053,1.0378),],m["Torus"],no(-0.1730,0.8627,0.4753)),
			n([v(-0.1830,0.3053,1.0378),v(-0.5269,0.3053,0.9126),v(-0.4225,0.2685,0.7318),v(-0.1467,0.2685,0.8322),],m["Torus"],no(0.0603,0.9843,-0.1656)),
			n([v(-0.1467,0.2685,0.8322),v(-0.4225,0.2685,0.7318),v(-0.3543,0.1060,0.6137),v(-0.1231,0.1060,0.6979),],m["Torus"],no(0.2637,0.6370,-0.7244)),
			n([v(-0.1231,0.1060,0.6979),v(-0.3543,0.1060,0.6137),v(-0.3543,-0.1060,0.6137),v(-0.1231,-0.1060,0.6979),],m["Torus"],no(0.3420,0.0000,-0.9397)),
			n([v(-0.1231,-0.1060,0.6979),v(-0.3543,-0.1060,0.6137),v(-0.4225,-0.2685,0.7318),v(-0.1467,-0.2685,0.8322),],m["Torus"],no(0.2637,-0.6370,-0.7244)),
			n([v(-0.1467,-0.2685,0.8322),v(-0.4225,-0.2685,0.7318),v(-0.5269,-0.3053,0.9126),v(-0.1830,-0.3053,1.0378),],m["Torus"],no(0.0603,-0.9843,-0.1656)),
			n([v(-0.1830,-0.3053,1.0378),v(-0.5269,-0.3053,0.9126),v(-0.6187,-0.1993,1.0717),v(-0.2149,-0.1993,1.2187),],m["Torus"],no(-0.1730,-0.8627,0.4753)),
			n([v(-0.2149,-0.1993,1.2187),v(-0.6187,-0.1993,1.0717),v(-0.6550,0.0000,1.1345),v(-0.2275,0.0000,1.2901),],m["Torus"],no(-0.3220,-0.3374,0.8846)),
			n([v(-0.6550,0.0000,1.1345),v(-1.0035,0.0000,0.8421),v(-0.9480,0.1993,0.7954),v(-0.6187,0.1993,1.0717),],m["Torus"],no(-0.6051,0.3374,0.7211)),
			n([v(-0.6187,0.1993,1.0717),v(-0.9480,0.1993,0.7954),v(-0.8073,0.3053,0.6774),v(-0.5269,0.3053,0.9126),],m["Torus"],no(-0.3251,0.8627,0.3874)),
			n([v(-0.5269,0.3053,0.9126),v(-0.8073,0.3053,0.6774),v(-0.6473,0.2685,0.5432),v(-0.4225,0.2685,0.7318),],m["Torus"],no(0.1133,0.9843,-0.1350)),
			n([v(-0.4225,0.2685,0.7318),v(-0.6473,0.2685,0.5432),v(-0.5429,0.1060,0.4555),v(-0.3543,0.1060,0.6137),],m["Torus"],no(0.4955,0.6370,-0.5905)),
			n([v(-0.3543,0.1060,0.6137),v(-0.5429,0.1060,0.4555),v(-0.5429,-0.1060,0.4555),v(-0.3543,-0.1060,0.6137),],m["Torus"],no(0.6428,0.0000,-0.7660)),
			n([v(-0.3543,-0.1060,0.6137),v(-0.5429,-0.1060,0.4555),v(-0.6473,-0.2685,0.5432),v(-0.4225,-0.2685,0.7318),],m["Torus"],no(0.4955,-0.6370,-0.5905)),
			n([v(-0.4225,-0.2685,0.7318),v(-0.6473,-0.2685,0.5432),v(-0.8073,-0.3053,0.6774),v(-0.5269,-0.3053,0.9126),],m["Torus"],no(0.1133,-0.9843,-0.1350)),
			n([v(-0.5269,-0.3053,0.9126),v(-0.8073,-0.3053,0.6774),v(-0.9480,-0.1993,0.7954),v(-0.6187,-0.1993,1.0717),],m["Torus"],no(-0.3251,-0.8627,0.3874)),
			n([v(-0.6187,-0.1993,1.0717),v(-0.9480,-0.1993,0.7954),v(-1.0035,0.0000,0.8421),v(-0.6550,0.0000,1.1345),],m["Torus"],no(-0.6051,-0.3374,0.7211)),
			n([v(-1.0035,0.0000,0.8421),v(-1.2310,0.0000,0.4480),v(-1.1628,0.1993,0.4232),v(-0.9480,0.1993,0.7954),],m["Torus"],no(-0.8152,0.3374,0.4707)),
			n([v(-0.9480,0.1993,0.7954),v(-1.1628,0.1993,0.4232),v(-0.9903,0.3053,0.3604),v(-0.8073,0.3053,0.6774),],m["Torus"],no(-0.4380,0.8627,0.2529)),
			n([v(-0.8073,0.3053,0.6774),v(-0.9903,0.3053,0.3604),v(-0.7940,0.2685,0.2890),v(-0.6473,0.2685,0.5432),],m["Torus"],no(0.1526,0.9843,-0.0881)),
			n([v(-0.6473,0.2685,0.5432),v(-0.7940,0.2685,0.2890),v(-0.6660,0.1060,0.2424),v(-0.5429,0.1060,0.4555),],m["Torus"],no(0.6676,0.6370,-0.3854)),
			n([v(-0.5429,0.1060,0.4555),v(-0.6660,0.1060,0.2424),v(-0.6660,-0.1060,0.2424),v(-0.5429,-0.1060,0.4555),],m["Torus"],no(0.8660,0.0000,-0.5000)),
			n([v(-0.5429,-0.1060,0.4555),v(-0.6660,-0.1060,0.2424),v(-0.7940,-0.2685,0.2890),v(-0.6473,-0.2685,0.5432),],m["Torus"],no(0.6676,-0.6370,-0.3854)),
			n([v(-0.6473,-0.2685,0.5432),v(-0.7940,-0.2685,0.2890),v(-0.9903,-0.3053,0.3604),v(-0.8073,-0.3053,0.6774),],m["Torus"],no(0.1526,-0.9843,-0.0881)),
			n([v(-0.8073,-0.3053,0.6774),v(-0.9903,-0.3053,0.3604),v(-1.1628,-0.1993,0.4232),v(-0.9480,-0.1993,0.7954),],m["Torus"],no(-0.4380,-0.8627,0.2529)),
			n([v(-0.9480,-0.1993,0.7954),v(-1.1628,-0.1993,0.4232),v(-1.2310,0.0000,0.4480),v(-1.0035,0.0000,0.8421),],m["Torus"],no(-0.8152,-0.3374,0.4707)),
			n([v(-1.2310,0.0000,0.4480),v(-1.3100,0.0000,0.0000),v(-1.2375,0.1993,0.0000),v(-1.1628,0.1993,0.4232),],m["Torus"],no(-0.9271,0.3374,0.1635)),
			n([v(-1.1628,0.1993,0.4232),v(-1.2375,0.1993,0.0000),v(-1.0538,0.3053,0.0000),v(-0.9903,0.3053,0.3604),],m["Torus"],no(-0.4981,0.8627,0.0878)),
			n([v(-0.9903,0.3053,0.3604),v(-1.0538,0.3053,0.0000),v(-0.8450,0.2685,0.0000),v(-0.7940,0.2685,0.2890),],m["Torus"],no(0.1736,0.9843,-0.0306)),
			n([v(-0.7940,0.2685,0.2890),v(-0.8450,0.2685,0.0000),v(-0.7087,0.1060,0.0000),v(-0.6660,0.1060,0.2424),],m["Torus"],no(0.7592,0.6370,-0.1339)),
			n([v(-0.6660,0.1060,0.2424),v(-0.7087,0.1060,0.0000),v(-0.7087,-0.1060,0.0000),v(-0.6660,-0.1060,0.2424),],m["Torus"],no(0.9848,0.0000,-0.1736)),
			n([v(-0.6660,-0.1060,0.2424),v(-0.7087,-0.1060,0.0000),v(-0.8450,-0.2685,0.0000),v(-0.7940,-0.2685,0.2890),],m["Torus"],no(0.7592,-0.6370,-0.1339)),
			n([v(-0.7940,-0.2685,0.2890),v(-0.8450,-0.2685,0.0000),v(-1.0538,-0.3053,0.0000),v(-0.9903,-0.3053,0.3604),],m["Torus"],no(0.1736,-0.9843,-0.0306)),
			n([v(-0.9903,-0.3053,0.3604),v(-1.0538,-0.3053,0.0000),v(-1.2375,-0.1993,0.0000),v(-1.1628,-0.1993,0.4232),],m["Torus"],no(-0.4981,-0.8627,0.0878)),
			n([v(-1.1628,-0.1993,0.4232),v(-1.2375,-0.1993,0.0000),v(-1.3100,0.0000,0.0000),v(-1.2310,0.0000,0.4480),],m["Torus"],no(-0.9271,-0.3374,0.1635)),
			n([v(-1.3100,0.0000,0.0000),v(-1.2310,0.0000,-0.4480),v(-1.1628,0.1993,-0.4232),v(-1.2375,0.1993,0.0000),],m["Torus"],no(-0.9271,0.3374,-0.1635)),
			n([v(-1.2375,0.1993,0.0000),v(-1.1628,0.1993,-0.4232),v(-0.9903,0.3053,-0.3604),v(-1.0538,0.3053,0.0000),],m["Torus"],no(-0.4981,0.8627,-0.0878)),
			n([v(-1.0538,0.3053,0.0000),v(-0.9903,0.3053,-0.3604),v(-0.7940,0.2685,-0.2890),v(-0.8450,0.2685,0.0000),],m["Torus"],no(0.1736,0.9843,0.0306)),
			n([v(-0.8450,0.2685,0.0000),v(-0.7940,0.2685,-0.2890),v(-0.6660,0.1060,-0.2424),v(-0.7087,0.1060,0.0000),],m["Torus"],no(0.7592,0.6370,0.1339)),
			n([v(-0.7087,0.1060,0.0000),v(-0.6660,0.1060,-0.2424),v(-0.6660,-0.1060,-0.2424),v(-0.7087,-0.1060,0.0000),],m["Torus"],no(0.9848,0.0000,0.1736)),
			n([v(-0.7087,-0.1060,0.0000),v(-0.6660,-0.1060,-0.2424),v(-0.7940,-0.2685,-0.2890),v(-0.8450,-0.2685,0.0000),],m["Torus"],no(0.7592,-0.6370,0.1339)),
			n([v(-0.8450,-0.2685,0.0000),v(-0.7940,-0.2685,-0.2890),v(-0.9903,-0.3053,-0.3604),v(-1.0538,-0.3053,0.0000),],m["Torus"],no(0.1736,-0.9843,0.0306)),
			n([v(-1.0538,-0.3053,0.0000),v(-0.9903,-0.3053,-0.3604),v(-1.1628,-0.1993,-0.4232),v(-1.2375,-0.1993,0.0000),],m["Torus"],no(-0.4981,-0.8627,-0.0878)),
			n([v(-1.2375,-0.1993,0.0000),v(-1.1628,-0.1993,-0.4232),v(-1.2310,0.0000,-0.4480),v(-1.3100,0.0000,0.0000),],m["Torus"],no(-0.9271,-0.3374,-0.1635)),
			n([v(-1.2310,0.0000,-0.4480),v(-1.0035,0.0000,-0.8421),v(-0.9480,0.1993,-0.7954),v(-1.1628,0.1993,-0.4232),],m["Torus"],no(-0.8152,0.3374,-0.4707)),
			n([v(-1.1628,0.1993,-0.4232),v(-0.9480,0.1993,-0.7954),v(-0.8073,0.3053,-0.6774),v(-0.9903,0.3053,-0.3604),],m["Torus"],no(-0.4380,0.8627,-0.2529)),
			n([v(-0.9903,0.3053,-0.3604),v(-0.8073,0.3053,-0.6774),v(-0.6473,0.2685,-0.5432),v(-0.7940,0.2685,-0.2890),],m["Torus"],no(0.1526,0.9843,0.0881)),
			n([v(-0.7940,0.2685,-0.2890),v(-0.6473,0.2685,-0.5432),v(-0.5429,0.1060,-0.4555),v(-0.6660,0.1060,-0.2424),],m["Torus"],no(0.6676,0.6370,0.3854)),
			n([v(-0.6660,0.1060,-0.2424),v(-0.5429,0.1060,-0.4555),v(-0.5429,-0.1060,-0.4555),v(-0.6660,-0.1060,-0.2424),],m["Torus"],no(0.8660,0.0000,0.5000)),
			n([v(-0.6660,-0.1060,-0.2424),v(-0.5429,-0.1060,-0.4555),v(-0.6473,-0.2685,-0.5432),v(-0.7940,-0.2685,-0.2890),],m["Torus"],no(0.6676,-0.6370,0.3854)),
			n([v(-0.7940,-0.2685,-0.2890),v(-0.6473,-0.2685,-0.5432),v(-0.8073,-0.3053,-0.6774),v(-0.9903,-0.3053,-0.3604),],m["Torus"],no(0.1526,-0.9843,0.0881)),
			n([v(-0.9903,-0.3053,-0.3604),v(-0.8073,-0.3053,-0.6774),v(-0.9480,-0.1993,-0.7954),v(-1.1628,-0.1993,-0.4232),],m["Torus"],no(-0.4380,-0.8627,-0.2529)),
			n([v(-1.1628,-0.1993,-0.4232),v(-0.9480,-0.1993,-0.7954),v(-1.0035,0.0000,-0.8421),v(-1.2310,0.0000,-0.4480),],m["Torus"],no(-0.8152,-0.3374,-0.4707)),
			n([v(-1.0035,0.0000,-0.8421),v(-0.6550,0.0000,-1.1345),v(-0.6187,0.1993,-1.0717),v(-0.9480,0.1993,-0.7954),],m["Torus"],no(-0.6051,0.3374,-0.7211)),
			n([v(-0.9480,0.1993,-0.7954),v(-0.6187,0.1993,-1.0717),v(-0.5269,0.3053,-0.9126),v(-0.8073,0.3053,-0.6774),],m["Torus"],no(-0.3251,0.8627,-0.3874)),
			n([v(-0.8073,0.3053,-0.6774),v(-0.5269,0.3053,-0.9126),v(-0.4225,0.2685,-0.7318),v(-0.6473,0.2685,-0.5432),],m["Torus"],no(0.1133,0.9843,0.1350)),
			n([v(-0.6473,0.2685,-0.5432),v(-0.4225,0.2685,-0.7318),v(-0.3543,0.1060,-0.6137),v(-0.5429,0.1060,-0.4555),],m["Torus"],no(0.4955,0.6370,0.5905)),
			n([v(-0.5429,0.1060,-0.4555),v(-0.3543,0.1060,-0.6137),v(-0.3543,-0.1060,-0.6137),v(-0.5429,-0.1060,-0.4555),],m["Torus"],no(0.6428,0.0000,0.7660)),
			n([v(-0.5429,-0.1060,-0.4555),v(-0.3543,-0.1060,-0.6137),v(-0.4225,-0.2685,-0.7318),v(-0.6473,-0.2685,-0.5432),],m["Torus"],no(0.4955,-0.6370,0.5905)),
			n([v(-0.6473,-0.2685,-0.5432),v(-0.4225,-0.2685,-0.7318),v(-0.5269,-0.3053,-0.9126),v(-0.8073,-0.3053,-0.6774),],m["Torus"],no(0.1133,-0.9843,0.1350)),
			n([v(-0.8073,-0.3053,-0.6774),v(-0.5269,-0.3053,-0.9126),v(-0.6187,-0.1993,-1.0717),v(-0.9480,-0.1993,-0.7954),],m["Torus"],no(-0.3251,-0.8627,-0.3874)),
			n([v(-0.9480,-0.1993,-0.7954),v(-0.6187,-0.1993,-1.0717),v(-0.6550,0.0000,-1.1345),v(-1.0035,0.0000,-0.8421),],m["Torus"],no(-0.6051,-0.3374,-0.7211)),
			n([v(-0.6550,0.0000,-1.1345),v(-0.2275,0.0000,-1.2901),v(-0.2149,0.1993,-1.2187),v(-0.6187,0.1993,-1.0717),],m["Torus"],no(-0.3220,0.3374,-0.8846)),
			n([v(-0.6187,0.1993,-1.0717),v(-0.2149,0.1993,-1.2187),v(-0.1830,0.3053,-1.0378),v(-0.5269,0.3053,-0.9126),],m["Torus"],no(-0.1730,0.8627,-0.4753)),
			n([v(-0.5269,0.3053,-0.9126),v(-0.1830,0.3053,-1.0378),v(-0.1467,0.2685,-0.8322),v(-0.4225,0.2685,-0.7318),],m["Torus"],no(0.0603,0.9843,0.1656)),
			n([v(-0.4225,0.2685,-0.7318),v(-0.1467,0.2685,-0.8322),v(-0.1231,0.1060,-0.6979),v(-0.3543,0.1060,-0.6137),],m["Torus"],no(0.2637,0.6370,0.7244)),
			n([v(-0.3543,0.1060,-0.6137),v(-0.1231,0.1060,-0.6979),v(-0.1231,-0.1060,-0.6979),v(-0.3543,-0.1060,-0.6137),],m["Torus"],no(0.3420,0.0000,0.9397)),
			n([v(-0.3543,-0.1060,-0.6137),v(-0.1231,-0.1060,-0.6979),v(-0.1467,-0.2685,-0.8322),v(-0.4225,-0.2685,-0.7318),],m["Torus"],no(0.2637,-0.6370,0.7244)),
			n([v(-0.4225,-0.2685,-0.7318),v(-0.1467,-0.2685,-0.8322),v(-0.1830,-0.3053,-1.0378),v(-0.5269,-0.3053,-0.9126),],m["Torus"],no(0.0603,-0.9843,0.1656)),
			n([v(-0.5269,-0.3053,-0.9126),v(-0.1830,-0.3053,-1.0378),v(-0.2149,-0.1993,-1.2187),v(-0.6187,-0.1993,-1.0717),],m["Torus"],no(-0.1730,-0.8627,-0.4753)),
			n([v(-0.6187,-0.1993,-1.0717),v(-0.2149,-0.1993,-1.2187),v(-0.2275,0.0000,-1.2901),v(-0.6550,0.0000,-1.1345),],m["Torus"],no(-0.3220,-0.3374,-0.8846)),
			n([v(-0.2275,0.0000,-1.2901),v(0.2275,0.0000,-1.2901),v(0.2149,0.1993,-1.2187),v(-0.2149,0.1993,-1.2187),],m["Torus"],no(0.0000,0.3374,-0.9414)),
			n([v(-0.2149,0.1993,-1.2187),v(0.2149,0.1993,-1.2187),v(0.1830,0.3053,-1.0378),v(-0.1830,0.3053,-1.0378),],m["Torus"],no(0.0000,0.8627,-0.5058)),
			n([v(-0.1830,0.3053,-1.0378),v(0.1830,0.3053,-1.0378),v(0.1467,0.2685,-0.8322),v(-0.1467,0.2685,-0.8322),],m["Torus"],no(-0.0000,0.9843,0.1762)),
			n([v(-0.1467,0.2685,-0.8322),v(0.1467,0.2685,-0.8322),v(0.1231,0.1060,-0.6979),v(-0.1231,0.1060,-0.6979),],m["Torus"],no(-0.0000,0.6370,0.7709)),
			n([v(-0.1231,0.1060,-0.6979),v(0.1231,0.1060,-0.6979),v(0.1231,-0.1060,-0.6979),v(-0.1231,-0.1060,-0.6979),],m["Torus"],no(-0.0000,0.0000,1.0000)),
			n([v(-0.1231,-0.1060,-0.6979),v(0.1231,-0.1060,-0.6979),v(0.1467,-0.2685,-0.8322),v(-0.1467,-0.2685,-0.8322),],m["Torus"],no(-0.0000,-0.6370,0.7709)),
			n([v(-0.1467,-0.2685,-0.8322),v(0.1467,-0.2685,-0.8322),v(0.1830,-0.3053,-1.0378),v(-0.1830,-0.3053,-1.0378),],m["Torus"],no(-0.0000,-0.9843,0.1762)),
			n([v(-0.1830,-0.3053,-1.0378),v(0.1830,-0.3053,-1.0378),v(0.2149,-0.1993,-1.2187),v(-0.2149,-0.1993,-1.2187),],m["Torus"],no(0.0000,-0.8627,-0.5058)),
			n([v(-0.2149,-0.1993,-1.2187),v(0.2149,-0.1993,-1.2187),v(0.2275,0.0000,-1.2901),v(-0.2275,0.0000,-1.2901),],m["Torus"],no(0.0000,-0.3374,-0.9414)),
			n([v(0.2275,0.0000,-1.2901),v(0.6550,0.0000,-1.1345),v(0.6187,0.1993,-1.0717),v(0.2149,0.1993,-1.2187),],m["Torus"],no(0.3220,0.3374,-0.8846)),
			n([v(0.2149,0.1993,-1.2187),v(0.6187,0.1993,-1.0717),v(0.5269,0.3053,-0.9126),v(0.1830,0.3053,-1.0378),],m["Torus"],no(0.1730,0.8627,-0.4753)),
			n([v(0.1830,0.3053,-1.0378),v(0.5269,0.3053,-0.9126),v(0.4225,0.2685,-0.7318),v(0.1467,0.2685,-0.8322),],m["Torus"],no(-0.0603,0.9843,0.1656)),
			n([v(0.1467,0.2685,-0.8322),v(0.4225,0.2685,-0.7318),v(0.3543,0.1060,-0.6137),v(0.1231,0.1060,-0.6979),],m["Torus"],no(-0.2637,0.6370,0.7244)),
			n([v(0.1231,0.1060,-0.6979),v(0.3543,0.1060,-0.6137),v(0.3543,-0.1060,-0.6137),v(0.1231,-0.1060,-0.6979),],m["Torus"],no(-0.3420,0.0000,0.9397)),
			n([v(0.1231,-0.1060,-0.6979),v(0.3543,-0.1060,-0.6137),v(0.4225,-0.2685,-0.7318),v(0.1467,-0.2685,-0.8322),],m["Torus"],no(-0.2637,-0.6370,0.7244)),
			n([v(0.1467,-0.2685,-0.8322),v(0.4225,-0.2685,-0.7318),v(0.5269,-0.3053,-0.9126),v(0.1830,-0.3053,-1.0378),],m["Torus"],no(-0.0603,-0.9843,0.1656)),
			n([v(0.1830,-0.3053,-1.0378),v(0.5269,-0.3053,-0.9126),v(0.6187,-0.1993,-1.0717),v(0.2149,-0.1993,-1.2187),],m["Torus"],no(0.1730,-0.8627,-0.4753)),
			n([v(0.2149,-0.1993,-1.2187),v(0.6187,-0.1993,-1.0717),v(0.6550,0.0000,-1.1345),v(0.2275,0.0000,-1.2901),],m["Torus"],no(0.3220,-0.3374,-0.8846)),
			n([v(0.6550,0.0000,-1.1345),v(1.0035,0.0000,-0.8421),v(0.9480,0.1993,-0.7954),v(0.6187,0.1993,-1.0717),],m["Torus"],no(0.6051,0.3374,-0.7211)),
			n([v(0.6187,0.1993,-1.0717),v(0.9480,0.1993,-0.7954),v(0.8073,0.3053,-0.6774),v(0.5269,0.3053,-0.9126),],m["Torus"],no(0.3251,0.8627,-0.3874)),
			n([v(0.5269,0.3053,-0.9126),v(0.8073,0.3053,-0.6774),v(0.6473,0.2685,-0.5432),v(0.4225,0.2685,-0.7318),],m["Torus"],no(-0.1133,0.9843,0.1350)),
			n([v(0.4225,0.2685,-0.7318),v(0.6473,0.2685,-0.5432),v(0.5429,0.1060,-0.4555),v(0.3543,0.1060,-0.6137),],m["Torus"],no(-0.4955,0.6370,0.5905)),
			n([v(0.3543,0.1060,-0.6137),v(0.5429,0.1060,-0.4555),v(0.5429,-0.1060,-0.4555),v(0.3543,-0.1060,-0.6137),],m["Torus"],no(-0.6428,0.0000,0.7660)),
			n([v(0.3543,-0.1060,-0.6137),v(0.5429,-0.1060,-0.4555),v(0.6473,-0.2685,-0.5432),v(0.4225,-0.2685,-0.7318),],m["Torus"],no(-0.4955,-0.6370,0.5905)),
			n([v(0.4225,-0.2685,-0.7318),v(0.6473,-0.2685,-0.5432),v(0.8073,-0.3053,-0.6774),v(0.5269,-0.3053,-0.9126),],m["Torus"],no(-0.1133,-0.9843,0.1350)),
			n([v(0.5269,-0.3053,-0.9126),v(0.8073,-0.3053,-0.6774),v(0.9480,-0.1993,-0.7954),v(0.6187,-0.1993,-1.0717),],m["Torus"],no(0.3251,-0.8627,-0.3874)),
			n([v(0.6187,-0.1993,-1.0717),v(0.9480,-0.1993,-0.7954),v(1.0035,0.0000,-0.8421),v(0.6550,0.0000,-1.1345),],m["Torus"],no(0.6051,-0.3374,-0.7211)),
			n([v(1.0035,0.0000,-0.8421),v(1.2310,0.0000,-0.4480),v(1.1628,0.1993,-0.4232),v(0.9480,0.1993,-0.7954),],m["Torus"],no(0.8152,0.3374,-0.4707)),
			n([v(0.9480,0.1993,-0.7954),v(1.1628,0.1993,-0.4232),v(0.9903,0.3053,-0.3604),v(0.8073,0.3053,-0.6774),],m["Torus"],no(0.4380,0.8627,-0.2529)),
			n([v(0.8073,0.3053,-0.6774),v(0.9903,0.3053,-0.3604),v(0.7940,0.2685,-0.2890),v(0.6473,0.2685,-0.5432),],m["Torus"],no(-0.1526,0.9843,0.0881)),
			n([v(0.6473,0.2685,-0.5432),v(0.7940,0.2685,-0.2890),v(0.6660,0.1060,-0.2424),v(0.5429,0.1060,-0.4555),],m["Torus"],no(-0.6676,0.6370,0.3854)),
			n([v(0.5429,0.1060,-0.4555),v(0.6660,0.1060,-0.2424),v(0.6660,-0.1060,-0.2424),v(0.5429,-0.1060,-0.4555),],m["Torus"],no(-0.8660,0.0000,0.5000)),
			n([v(0.5429,-0.1060,-0.4555),v(0.6660,-0.1060,-0.2424),v(0.7940,-0.2685,-0.2890),v(0.6473,-0.2685,-0.5432),],m["Torus"],no(-0.6676,-0.6370,0.3854)),
			n([v(0.6473,-0.2685,-0.5432),v(0.7940,-0.2685,-0.2890),v(0.9903,-0.3053,-0.3604),v(0.8073,-0.3053,-0.6774),],m["Torus"],no(-0.1526,-0.9843,0.0881)),
			n([v(0.8073,-0.3053,-0.6774),v(0.9903,-0.3053,-0.3604),v(1.1628,-0.1993,-0.4232),v(0.9480,-0.1993,-0.7954),],m["Torus"],no(0.4380,-0.8627,-0.2529)),
			n([v(0.9480,-0.1993,-0.7954),v(1.1628,-0.1993,-0.4232),v(1.2310,0.0000,-0.4480),v(1.0035,0.0000,-0.8421),],m["Torus"],no(0.8152,-0.3374,-0.4707)),
			n([v(1.2310,0.0000,-0.4480),v(1.3100,0.0000,0.0000),v(1.2375,0.1993,0.0000),v(1.1628,0.1993,-0.4232),],m["Torus"],no(0.9271,0.3374,-0.1635)),
			n([v(1.1628,0.1993,-0.4232),v(1.2375,0.1993,0.0000),v(1.0538,0.3053,0.0000),v(0.9903,0.3053,-0.3604),],m["Torus"],no(0.4981,0.8627,-0.0878)),
			n([v(0.9903,0.3053,-0.3604),v(1.0538,0.3053,0.0000),v(0.8450,0.2685,0.0000),v(0.7940,0.2685,-0.2890),],m["Torus"],no(-0.1736,0.9843,0.0306)),
			n([v(0.7940,0.2685,-0.2890),v(0.8450,0.2685,0.0000),v(0.7087,0.1060,0.0000),v(0.6660,0.1060,-0.2424),],m["Torus"],no(-0.7592,0.6370,0.1339)),
			n([v(0.6660,0.1060,-0.2424),v(0.7087,0.1060,0.0000),v(0.7087,-0.1060,0.0000),v(0.6660,-0.1060,-0.2424),],m["Torus"],no(-0.9848,0.0000,0.1736)),
			n([v(0.6660,-0.1060,-0.2424),v(0.7087,-0.1060,0.0000),v(0.8450,-0.2685,0.0000),v(0.7940,-0.2685,-0.2890),],m["Torus"],no(-0.7592,-0.6370,0.1339)),
			n([v(0.7940,-0.2685,-0.2890),v(0.8450,-0.2685,0.0000),v(1.0538,-0.3053,0.0000),v(0.9903,-0.3053,-0.3604),],m["Torus"],no(-0.1736,-0.9843,0.0306)),
			n([v(0.9903,-0.3053,-0.3604),v(1.0538,-0.3053,0.0000),v(1.2375,-0.1993,0.0000),v(1.1628,-0.1993,-0.4232),],m["Torus"],no(0.4981,-0.8627,-0.0878)),
			n([v(1.1628,-0.1993,-0.4232),v(1.2375,-0.1993,0.0000),v(1.3100,0.0000,0.0000),v(1.2310,0.0000,-0.4480),],m["Torus"],no(0.9271,-0.3374,-0.1635)),
		]);
	}
};