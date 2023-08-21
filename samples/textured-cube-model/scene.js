export const scene = {
	ngons: [],
	materials: [],
	initialize: async function()
	{
		const mat1 = this.materials[0] = {
			color: Rngon.color(150, 160, 190),
			texture: await Rngon.texture.load("../samples/shared/textures/wood.rngon-texture.json"),
			textureMapping: "affine",
		};

		const mat2 = this.materials[1] =  {
			color: Rngon.color(255, 255, 255),
			texture: await Rngon.texture.load("../samples/shared/textures/flowers.rngon-texture.json"),
			textureMapping: "affine",
		};

		const n = Rngon.ngon;
		const v = Rngon.vertex;
		const no = Rngon.vector;
		this.ngons.push(
			n([v(1.0000,1.0000,-1.0000,1,1),v(1.0000,-1.0000,-1.0000,1,0),v(-1.0000,-1.0000,-1.0000,0,0),v(-1.0000,1.0000,-1.0000,0,1),],mat2,no(0,0,-1)),
			n([v(1.0000,1.0000,1.0000,0,1),v(-1.0000,1.0000,1.0000,1,1),v(-1.0000,-1.0000,1.0000,1,0),v(1.0000,-1.0000,1.0000,0,0),],mat1,no(0,0,1)),
			n([v(1.0000,1.0000,-1.0000,0,1),v(1.0000,1.0000,1.0000,1,1),v(1.0000,-1.0000,1.0000,1,0),v(1.0000,-1.0000,-1.0000,0,0),],mat1,no(1,0,0)),
			n([v(1.0000,-1.0000,-1.0000,1,1),v(1.0000,-1.0000,1.0000,1,0),v(-1.0000,-1.0000,1.0000,0,0),v(-1.0000,-1.0000,-1.0000,0,1),],mat1,no(0,-1,0)),
			n([v(-1.0000,-1.0000,-1.0000,0,1),v(-1.0000,-1.0000,1.0000,1,1),v(-1.0000,1.0000,1.0000,1,0),v(-1.0000,1.0000,-1.0000,0,0),],mat1,no(-1,0,0)),
			n([v(1.0000,1.0000,1.0000,1,1),v(1.0000,1.0000,-1.0000,1,0),v(-1.0000,1.0000,-1.0000,0,0),v(-1.0000,1.0000,1.0000,0,1),],mat1,no(0,1,0)),
		);
	}
};
