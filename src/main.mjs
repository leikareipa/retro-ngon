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

import {render} from "./api/render.mjs";
import {color} from "./api/color.mjs";
import {light} from "./api/light.mjs";
import {mesh} from "./api/mesh.mjs";
import {ngon} from "./api/ngon.mjs";
import {texture} from "./api/texture.mjs";
import {vector} from "./api/vector.mjs";
import {vertex} from "./api/vertex.mjs";
import {_default} from "./api/default.mjs";
import {state} from "./api/state.mjs";

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
