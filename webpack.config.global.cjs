const path = require("path");
const baseOptions = require("./webpack.config.cjs");

module.exports = (env, argv)=>{
    return {
        ...baseOptions(env, argv),
        output: {
            library: {
                type: "global",
            },
            path: path.resolve(__dirname, "distributable"),
            filename: "[name].global.js",
        },
    };
};
