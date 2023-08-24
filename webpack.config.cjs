const webpack = require("webpack");

module.exports = (env, argv)=>{
    const mode = (argv.mode || "production");
    return {
        mode,
        entry: {
            "rngon": "./src/main.mjs",
        },
        plugins: [
            new webpack.DefinePlugin({
                IS_PRODUCTION_BUILD: JSON.stringify(mode === "production"),
            }),
        ],
    };
};
