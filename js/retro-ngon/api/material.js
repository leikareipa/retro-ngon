/*
 * 2021 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

import {color as Color} from "./color.js";

// Material for n-gons.
export function material(properties = {})
{
    const publicInterface = {
        ...material.default,
        ...properties,
    };

    return publicInterface;
}

material.default = {
    color: Color(255, 255, 255, 255),
    wireframeColor: Color(0, 0, 0, 255),
    texture: null,
    textureMapping: "ortho",
    textureFiltering: "none",
    uvWrapping: "repeat",
    vertexShading: "none",
    renderVertexShade: true,
    ambientLightLevel: 0,
    hasWireframe: false,
    hasFill: true,
    isTwoSided: true,
    isInScreenSpace: false,
    allowAlphaReject: false,
    allowAlphaBlend: false,
};
