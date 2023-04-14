/*
 * 2019-2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

import "../paletted-canvas/paletted-canvas.js";

import {render} from "./api/render.js";
import {render_async} from "./api/render-async.js";
import {rasterize} from "./pipeline/rasterize.js";
import {surface_wipe} from "./pipeline/surface-wipe.js";
import {transform_clip_light} from "./pipeline/transform-clip-light.js";
import {
    color,
    color_index,
} from "./core/color.js";
import {state} from "./core/internal-state.js";
import {light} from "./core/light.js";
import {material} from "./core/material.js";
import {matrix44} from "./core/matrix44.js";
import {mesh} from "./core/mesh.js";
import {ngon} from "./core/ngon.js";
import {renderShared} from "./core/render-shared.js";
import {surface} from "./core/surface.js";
import {texture} from "./core/texture.js";
import {trig} from "./core/trig.js";
import {
    assert,
    $throw,
    lerp,
    bilinear_sample,
    log,
    renderable_width_of,
    renderable_height_of,
} from "./core/util.js";
import {vector} from "./core/vector.js";
import {vertex} from "./core/vertex.js";

export const Rngon = {
    version: {
        family: "beta",
        major: "5",
        minor: "0",
        dev: true,
    },
    baseModules: {
        rasterize,
        surface_wipe,
        transform_clip_light,
    },
    render,
    render_async,
    assert,
    $throw,
    lerp,
    bilinear_sample,
    log,
    renderable_width_of,
    renderable_height_of,
    color,
    color_index,
    state,
    light,
    material,
    matrix44,
    mesh,
    ngon,
    renderShared,
    surface,
    texture,
    trig,
    vector,
    vertex,
};
