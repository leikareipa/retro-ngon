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
    Rngon.assert && (((red   >= 0) && (red   <= 255)) &&
                     ((green >= 0) && (green <= 255)) &&
                     ((blue  >= 0) && (blue  <= 255)) &&
                     ((alpha >= 0) && (alpha <= 255)))
                 || Rngon.throw("The given color values are out of range.");

    // Alternate range, 0..1.
    const unitRange = Object.freeze({red:red/255, green:green/255, blue:blue/255, alpha:alpha/255});

    const publicInterface = Object.freeze(
    {
        red,
        green,
        blue,
        alpha,

        unitRange,
    });
    
    return publicInterface;
}
