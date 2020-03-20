/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

"use strict";

// A light source.
Rngon.light = function(position = Rngon.translation_vector(0, 0, 0))
{
    Rngon.assert && (typeof position === "object")
                 || Rngon.throw("Expected numbers as parameters to the light factory.");

    const returnObject =
    {
        position,
    };

    return returnObject;
}
