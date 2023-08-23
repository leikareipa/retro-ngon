export const scene = {
	ngons: [],
	initialize: async function()
	{
		const texture = await Rngon.texture.load("../samples/shared/textures/flowers.rngon-texture.json");
		const material = {
			color: Rngon.color(255,255,255),
			texture,
			textureMapping: "affine",
		};

		const n = Rngon.ngon;
		const v = Rngon.vertex;
		const normal = Rngon.vector;
		this.ngons.push(
			// Mipmapped quad.
			n([v(-1.4954,0.5775,2.0000,0.0001,0.0001),v(-1.4954,0.5775,4.0000,0.9999,0.0001),v(-1.4954,2.5775,4.0000,0.9999,0.9999),v(-1.4954,2.5775,2.0000,0.0001,0.9999),],{...material, hasMipmapping:true},normal(1.0000,0.0000,-0.0000)),

			// Non-mipmapped quad.
			n([v(-1.4954,0.5775,-0.5000,0.0001,0.0001),v(-1.4954,0.5775,1.5000,0.9999,0.0001),v(-1.4954,2.5775,1.5000,0.9999,0.9999),v(-1.4954,2.5775,-0.5000,0.0001,0.9999),],{...material, hasMipmapping:false},normal(1.0000,0.0000,-0.0000)),
		);
	}
};
