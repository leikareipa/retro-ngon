/*
 * 2019-2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

if (!IS_PRODUCTION_BUILD) {
    console.log(
        "This is a %cnon-production build %cof the retro n-gon renderer that performs additional runtime data validation and error reporting. For best render throughput, switch to a production build.",
        "font-weight: bold;",
        "font-weight: normal;"
    );
}

import {render} from "./api/render.js";
import {color} from "./api/color.js";
import {light} from "./api/light.js";
import {mesh} from "./api/mesh.js";
import {ngon} from "./api/ngon.js";
import {texture} from "./api/texture.js";
import {vector} from "./api/vector.js";
import {vertex} from "./api/vertex.js";
import {_default} from "./api/default.js";

import {state} from "./core/internal-state.js";

// The public API.
export const Rngon = {
    version: {
        major: 0,
        minor: 2,
        isProductionBuild: IS_PRODUCTION_BUILD,
    },
    default: _default,
    render,
    color,
    state,
    light,
    mesh,
    ngon,
    texture,
    vector,
    vertex,
};
