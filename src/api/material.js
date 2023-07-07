/*
 * 2021 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

import {validate_object} from "../core/schema.js";
import {color as Color} from "./color.js";

// Material for n-gons.
export function material(properties = {})
{
    const publicInterface = {
        $constructor: "Material",
        ...material.default,
        ...properties,
    };

    validate_object?.(publicInterface, material.schema.interface);

    return publicInterface;
}

material.default = {
    color: Color(255, 255, 255, 255),
    wireframeColor: Color(0, 0, 0, 255),
    texture: undefined,
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

material.schema = {
    interface: {
        where: "in the return value of material()",
        allowAdditionalProperties: true,
        properties: {
            "$constructor": {
                value: "Material",
            },
            "color": ["Color"],
            "wireframeColor": ["Color"],
            "texture": ["undefined", "null", "Texture"],
            "textureMapping": ["string"],
            "textureFiltering": ["string"],
            "uvWrapping": ["string"],
            "vertexShading": ["string"],
            "renderVertexShade": ["boolean"],
            "ambientLightLevel": ["number"],
            "hasWireframe": ["boolean"],
            "hasFill": ["boolean"],
            "isTwoSided": ["boolean"],
            "isInScreenSpace": ["boolean"],
            "allowAlphaReject": ["boolean"],
            "allowAlphaBlend": ["boolean"],
        },
    },
};
