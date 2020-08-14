/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 *
 */

"use strict";

// A light source.
Rngon.light = function(position = Rngon.translation_vector(0, 0, 0),
                       settings = {})
{
    Rngon.assert && (typeof position === "object")
                 || Rngon.throw("Expected numbers as parameters to the light factory.");

    settings = {
        ...Rngon.light.defaultSettings,
        ...settings,
    };

    const returnObject =
    {
        position,
        ...settings,
    };

    return returnObject;
}

Rngon.light.defaultSettings = {
    intensity: 3,
    reach: 150, // The distance, in world units, from the light's position to where the light's intensity has fallen to 0.
}
