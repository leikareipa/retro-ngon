/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 */

"use strict";

// Red, green, blue, alpha; in the range 0..255.
// NOTE: Expects to remain immutable.
Rngon.color_rgba = function(red = 55, green = 55, blue = 55, alpha = 255)
{
    Rngon.assert((((red   >= 0) && (red   <= 255)) &&
                  ((green >= 0) && (green <= 255)) &&
                  ((blue  >= 0) && (blue  <= 255)) &&
                  ((alpha >= 0) && (alpha <= 255))), "The given color values are out of range.");

    const unitRange = Object.freeze({red:red/255, green:green/255, blue:blue/255, alpha:alpha/255});

    const publicInterface = Object.freeze(
    {
        red,
        green,
        blue,
        alpha,

        unitRange,

        // Returns the color as a "#rrggbbaa" string. You can mask out a particular color
        // channel by providing a bitmask where the corresponding bits are zero. For instance,
        // to mask out the alpha channel and return "#rrggbb", provide the mask 0x1110. When
        // masking out any channel but alpha, the corresponding channel(s) will be set to
        // "00"; e.g. [255,255,255,255](0x1010) -> "#ff00ff".
        as_hex: (channelMask = 0x1111)=>
        {
            const hex_value = (value)=>(((value < 10)? "0" : "") + value.toString(16));
            return ("#"
                    + ((channelMask & 0x1000)? hex_value(red)   : "00")
                    + ((channelMask & 0x0100)? hex_value(green) : "00")
                    + ((channelMask & 0x0010)? hex_value(blue)  : "00")
                    + ((channelMask & 0x0001)? hex_value(alpha) : ""));
        },
    });
    return publicInterface;
}
