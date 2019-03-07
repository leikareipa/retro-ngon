/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 */

"use strict";

// Returns a copy of the given list of ngons such that each ngon in the copy
// has been transformed into screen-space.
Rngon.ngon_transformer = function(ngons = [], screenSpaceMatrix = [])
{
    return ngons.map(ngon=>ngon.transformed(screenSpaceMatrix).perspective_divided());
}
