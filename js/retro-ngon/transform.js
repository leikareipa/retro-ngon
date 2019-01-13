/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 */

"use strict"

// Returns a copy of the given list of ngons such that each ngon in the copy
// has been transformed into screen-space. Any ngons whose vertices (any of them)
// have negative depth will be excluded from the copy.
RNGon.ngon_transformer = function(ngons = [], clipSpaceMatrix = [], screenSpaceMatrix = [])
{
    if (ngons.length === 0) return;

    k_assert((clipSpaceMatrix.length === 16), "Expected a 4 x 4 camera matrix.");
    k_assert((screenSpaceMatrix.length === 16), "Expected a 4 x 4 perspective matrix.");

    return ngons.map((ngon)=>(ngon.in_screen_space(screenSpaceMatrix)))
                .filter((ngon)=>
                {
                    // Filter out ngons whose vertices (any of them) have negative depth.
                    // We do this as a cheap alternative to clipping, to prevent graphical
                    // errors when clipping isn't used.
                    return ngon.vertices.every(v => (v.w > 0));
                });
}
