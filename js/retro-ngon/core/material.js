/*
 * 2021 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

// Material for n-gons.
export function material(properties = {})
{
    material.default = (
        material.default ||
        {
            color: Rngon.color_rgba(),
            wireframeColor: Rngon.color_rgba(),
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
            allowTransform: true,
            allowAlphaReject: false,
            allowAlphaBlend: false,
            auxiliary: {},
        }
    );

    const publicInterface = {
        ...material.default,
        ...properties,
    };

    return publicInterface;
}
