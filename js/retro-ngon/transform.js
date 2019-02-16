/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 */

"use strict";

// Returns a copy of the given list of ngons such that each ngon in the copy
// has been transformed into screen-space. Any ngons whose vertices (any of them)
// have negative depth will be excluded from the copy.
Rngon.ngon_transformer = function(ngons = [], clipSpaceMatrix = [], screenSpaceMatrix = [])
{
    return ngons.map(ngon=>ngon.in_screen_space(screenSpaceMatrix))
                // Filter out ngons whose vertices (any of them) have negative depth.
                // We do this as a cheap alternative to clipping.
                .filter(ngon=>ngon.vertices.every(v=>(v.w > 0)));
}
