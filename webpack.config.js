const path = require("path");

module.exports = {
    mode: "development",
    entry: {
        "rngon": "./js/retro-ngon/retro-ngon.js",
    },
    output: {
        library: {
            type: "global",
        },
        path: path.resolve(__dirname, "distributable"),
        filename: "[name].js",
    },
};
