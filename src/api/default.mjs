/*
 * 2023 ArtisaaniSoft
 *
 * Software: Retro n-gon renderer
 *
 */

import {meshDefaultTransform} from "./mesh.mjs";
import {ngonDefaultMaterial} from "./ngon.mjs";
import {textureDefaultData} from "./texture.mjs";
import {contextDefaultName} from "./context.mjs";
import {
    renderDefaultOptions,
    renderDefaultPipeline
} from "./render.mjs";

export const Default = {
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
    context: contextDefaultName,
}
