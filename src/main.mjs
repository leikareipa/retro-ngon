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
import {Color} from "./api/color.mjs";
import {Light} from "./api/light.mjs";
import {Matrix} from "./api/matrix.mjs";
import {Mesh} from "./api/mesh.mjs";
import {Ngon} from "./api/ngon.mjs";
import {Texture} from "./api/texture.mjs";
import {Vector} from "./api/vector.mjs";
import {Vertex} from "./api/vertex.mjs";
import {Default} from "./api/default.mjs";
import {Context} from "./api/context.mjs";

// The public API.
export const Rngon = {
    version: Object.freeze({
        major: 0,
        minor: 4,
        isProductionBuild: IS_PRODUCTION_BUILD,
    }),
    default: Default,
    render,
    color: Color,
    context: Context.list,
    light: Light,
    mesh: Mesh,
    matrix: Matrix,
    ngon: Ngon,
    texture: Texture,
    vector: Vector,
    vertex: Vertex,
};
