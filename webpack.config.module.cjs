const path = require("path");
const baseOptions = require("./webpack.config.cjs");

module.exports = (env, argv)=>{
    return {
        ...baseOptions(env, argv),
        output: {
            library: {
                type: "module",
            },
            path: path.resolve(__dirname, "distributable"),
            filename: "[name].module.js",
        },
        experiments: {
            outputModule: true,
        },
    };
};
