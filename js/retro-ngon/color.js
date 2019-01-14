/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 */

"use strict"

// Red, green, blue, alpha; in the range 0..255.
// NOTE: Expects to remain immutable.
Rngon.color_rgba = function(red = 55, green = 55, blue = 55, alpha = 255)
{
    k_assert((((red   >= 0) && (red   <= 255)) &&
              ((green >= 0) && (green <= 255)) &&
              ((blue  >= 0) && (blue  <= 255)) &&
              ((alpha >= 0) && (alpha <= 255))), "The given color values are out of range.");

    const publicInterface = Object.freeze(
    {
        red,
        green,
        blue,
        alpha,

        // Returns the color as a "#rrggbb" string. Ignores alpha.
        to_hex: function()
        {
            const hex_value = (value)=>(((value < 10)? "0" : "") + value.toString(16));
            return ("#" + hex_value(red) + hex_value(green) + hex_value(blue));
        },
    });
    return publicInterface;
}
