import testRoom from "../.shared/assets/test-room.rngon-model.js";

export const scene = {
	...testRoom,
	initialize: async function() {
		await testRoom.initialize();

		testRoom.materials["Object"].isPortal = true;
	}
};
