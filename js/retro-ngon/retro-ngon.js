/*
 * 2019-2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

if (!IS_PRODUCTION_BUILD) {
    console.log(
        "This is a %cnon-production build %cof the retro n-gon renderer. It performs additional runtime data validation and error reporting. For best render throughput, switch to a production build.",
        "font-weight: bold;",
        "font-weight: normal;");
}

import {rasterizer} from "./default-pipeline/rasterizer.js";
import {surface_wiper} from "./default-pipeline/surface-wiper.js";
import {transform_clip_lighter} from "./default-pipeline/transform-clip-lighter.js";

import {render} from "./api/render.js";
import {color} from "./api/color.js";
import {light} from "./api/light.js";
import {material} from "./api/material.js";
import {mesh} from "./api/mesh.js";
import {ngon} from "./api/ngon.js";
import {texture} from "./api/texture.js";
import {vector} from "./api/vector.js";
import {vertex} from "./api/vertex.js";

import {
    assert,
    $throw,
    lerp,
    bilinear_sample,
    log,
    renderable_width_of,
    renderable_height_of,
} from "./core/util.js";
import {surface} from "./core/surface.js";
import {state} from "./core/internal-state.js";
import {trig} from "./core/trig.js";
import {matrix44} from "./core/matrix44.js";

export const Rngon = {
    version: {
        major: 0,
        minor: 5,
        patch: 0,
        dev: !IS_PRODUCTION_BUILD,
    },
    defaultPipeline: {
        rasterizer,
        surface_wiper,
        transform_clip_lighter,
    },
    render,
    assert,
    $throw,
    lerp,
    bilinear_sample,
    log,
    renderable_width_of,
    renderable_height_of,
    color,
    state,
    light,
    material,
    matrix44,
    mesh,
    ngon,
    surface,
    texture,
    trig,
    vector,
    vertex,
};
