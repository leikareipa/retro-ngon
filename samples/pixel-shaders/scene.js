import testRoom from "../.shared/assets/test-room.rngon-model.js";

export const scene = {
	...testRoom,
	initialize: async function() {
		await testRoom.initialize();

		testRoom.materials["Object"].isBacklit = true;
		testRoom.materials["Object"].isNeverGrayscale = true;
		testRoom.materials["Object"].hasHalo = true;
		testRoom.materials["Object"].isInFocus = true;
		testRoom.materials["Object"].hasNoScanlines = true;
		testRoom.materials["Object"].vertexShading = "gouraud";
		testRoom.materials["Object"].renderVertexShade = false;
	}
};
