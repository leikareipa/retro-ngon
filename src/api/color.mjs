/*
 * 2019 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

import {validate_object} from "../core/schema.mjs";
import {assert as Assert} from "../core/assert.mjs";

const schema = {
    arguments: {
        where: "in arguments passed to color()",
        properties: {
            "red": ["number"],
            "green": ["number"],
            "blue": ["number"],
            "alpha": ["number"],
        },
    },
    interface: {
        where: "in the return value of color()",
        properties: {
            "$constructor": {
                value: "Color",
            },
            "red": ["number"],
            "green": ["number"],
            "blue": ["number"],
            "alpha": ["number"],
            "unitRange": {
                subschema: {
                    "red": ["number"],
                    "green": ["number"],
                    "blue": ["number"],
                    "alpha": ["number"],
                }
            },
        },
    },
};

// Red, green, blue, alpha; in the range [0,255].
export function color(
    red = 0,
    green = 0,
    blue = 0,
    alpha = 255
)
{
    validate_object?.({red, green, blue, alpha}, schema.arguments);

    Assert?.(
        (((red   >= 0) && (red   <= 255)) &&
         ((green >= 0) && (green <= 255)) &&
         ((blue  >= 0) && (blue  <= 255)) &&
         ((alpha >= 0) && (alpha <= 255))),
        "One or more of the given color values are out of range."
    );

    const publicInterface = {
        $constructor: "Color",
        red,
        green,
        blue,
        alpha,
        unitRange: {
            red: (red / 255),
            green: (green / 255),
            blue: (blue / 255),
            alpha: (alpha / 255),
        },
    };

    validate_object?.(publicInterface, schema.interface);
    
    return publicInterface;
}
