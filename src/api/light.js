/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

import {validate_object} from "../core/schema.js";
import {vector as Vector} from "./vector.js";

// A light source. This is a work-in-progress implementation.
export function light(
    intensity = 100,
    position = Vector(0, 0, 0),
    options = {}
)
{
    validate_object?.({intensity, position, options}, light.schema.arguments);

    const publicInterface = {
        $constructor: "Light",
        ...options,
        intensity,
        position,
    };

    validate_object?.(publicInterface, light.schema.interface);
    
    return publicInterface;
}

light.schema = {
    arguments: {
        where: "in arguments passed to light()",
        properties: {
            "intensity": ["number"],
            "position": ["Vector"],
            "options": ["object"],
        },
    },
    interface: {
        where: "in the return value of light()",
        allowAdditionalProperties: true,
        properties: {
            "$constructor": {
                value: "Light",
            },
            "intensity": ["number"],
            "position": ["Vector"],
        },
    },
};
