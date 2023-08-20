const path = require("path");
const webpack = require('webpack');

module.exports = (env, argv)=>{
    const mode = (argv.mode || "production");
    return {
        mode,
        entry: {
            "rngon": "./src/main.mjs",
        },
        output: {
            library: {
                type: "global",
            },
            path: path.resolve(__dirname, "distributable"),
            filename: "[name].js",
        },
        plugins: [
            new webpack.DefinePlugin({
                IS_PRODUCTION_BUILD: JSON.stringify(mode === "production"),
            }),
        ],
    };
};
