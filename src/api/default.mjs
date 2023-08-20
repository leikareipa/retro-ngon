/*
 * 2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

import {meshDefaultTransform} from "./mesh.mjs";
import {ngonDefaultMaterial} from "./ngon.mjs";
import {textureDefaultData} from "./texture.mjs";
import {
    renderDefaultOptions,
    renderDefaultPipeline
} from "./render.mjs";

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
