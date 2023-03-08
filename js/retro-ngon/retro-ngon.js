/*
 * 2019-2022 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

const version = {
    family: "beta",
    major: "5",
    minor: "0",
    dev: true,
};

import "../paletted-canvas/paletted-canvas.js";

import {render} from "./api/render.js";
import {render_async} from "./api/render-async.js";
import {rasterize} from "./base-modules/rasterize.js";
import {surface_wipe} from "./base-modules/surface-wipe.js";
import {transform_clip_light} from "./base-modules/transform-clip-light.js";
import {
    color_rgba,
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
import {texture_rgba} from "./core/texture.js";
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
import {
    vector3,
    translation_vector,
    rotation_vector,
    scaling_vector
} from "./core/vector3.js";
import {vertex} from "./core/vertex.js";

const baseModules = {
    rasterize,
    surface_wipe,
    transform_clip_light,
};

export {
    version,
    render,
    render_async,
    baseModules,
    assert,
    $throw,
    lerp,
    bilinear_sample,
    log,
    renderable_width_of,
    renderable_height_of,
    color_rgba,
    color_index,
    state,
    light,
    material,
    matrix44,
    mesh,
    ngon,
    renderShared,
    surface,
    texture_rgba,
    trig,
    vector3,
    rotation_vector,
    scaling_vector,
    translation_vector,
    vertex,
};
