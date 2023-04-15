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
            color: Rngon.color(255, 255, 255, 255),
            wireframeColor: Rngon.color(0, 0, 0, 255),
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
        }
    );

    const publicInterface = {
        ...material.default,
        ...properties,
    };

    return publicInterface;
}
