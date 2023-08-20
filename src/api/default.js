/*
 * 2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

import {meshDefaultTransform} from "./mesh.js";
import {ngonDefaultMaterial} from "./ngon.js";
import {textureDefaultData} from "./texture.js";
import {
    renderDefaultOptions,
    renderDefaultPipeline
} from "./render.js";

export const _default = {
    render: {
        options: renderDefaultOptions,
        pipeline: renderDefaultPipeline,
    },
    mesh: {
        transform: meshDefaultTransform,
    },
    texture: textureDefaultData,
    ngon: {
        material: ngonDefaultMaterial,
    },
}
