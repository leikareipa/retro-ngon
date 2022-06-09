/*
 * 2021 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

"use strict";

// Material for n-gons.
Rngon.material = function(properties = {})
{
    const publicInterface = {
        ...Rngon.material.default,
        ...properties,
    };

    return publicInterface;
}

Rngon.material.default = {
    color: Rngon.color_rgba(255, 255, 255, 255),
    texture: null,
    textureMapping: "ortho",
    uvWrapping: "repeat",
    vertexShading: "none",
    renderVertexShade: true,
    ambientLightLevel: 0,
    hasWireframe: false,
    hasFill: true,
    isTwoSided: true,
    wireframeColor: Rngon.color_rgba(0, 0, 0),
    allowTransform: true,
    allowAlphaReject: false,
    allowAlphaBlend: false,
    auxiliary: {},
};
