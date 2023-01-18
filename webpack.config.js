const path = require("path");

module.exports = {
    mode: "development",
    entry: {
        "rngon": "./js/retro-ngon/retro-ngon.js",
    },
    output: {
        library: {
            name: "Rngon",
            type: "umd",
        },
        path: path.resolve(__dirname, "distributable"),
        filename: "[name].js",
    },
};
