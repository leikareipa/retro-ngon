import testRoom from "../shared/models/test-room.rngon-model.js";

export const scene = {
	...testRoom,
	initialize: async function() {
		await testRoom.initialize();
		testRoom.materials["Object"].hasHalo = true;
	}
};
