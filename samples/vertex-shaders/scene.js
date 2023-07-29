import testRoom from "../.shared/assets/test-room.rngon-model.js";

export const scene = {
	...testRoom,
	initialize: async function() {
		await testRoom.initialize();

		testRoom.materials["Object"].isGrowing = true;
		testRoom.materials["Object"].isFlat = true;
		testRoom.materials["Object"].isWavy = true;
		testRoom.materials["Object"].isPointCloud = true;
	}
};
