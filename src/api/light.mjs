/*
 * 2020-2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

import {validate_object} from "../schema.mjs";

const schema = {
    arguments: {
        where: "in arguments to Rngon::light()",
        properties: {
            "x": ["number"],
            "y": ["number"],
            "z": ["number"],
            "options": {
                subschema: {
                    allowAdditionalProperties: true,
                    properties: {
                        "intensity": ["number"],
                    },
                },
            },
        },
    },
    interface: {
        where: "in the return value of Rngon::light()",
        allowAdditionalProperties: true,
        properties: {
            "$constructor": {
                value: "Light",
            },
            "x": ["number"],
            "y": ["number"],
            "z": ["number"],
        },
    },
};

export function Light(
    x = 0,
    y = 0,
    z = 0,
    options = {}
)
{
    validate_object?.({x, y, z, options}, schema.arguments);

    const publicInterface = {
        $constructor: "Light",
        x,
        y,
        z,
        ...options,
    };

    validate_object?.(publicInterface, schema.interface);
    
    return publicInterface;
}
