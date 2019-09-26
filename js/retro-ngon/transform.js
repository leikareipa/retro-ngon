/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 */

"use strict";

// Transforms the given n-gons into screen space for rendering.
Rngon.ngon_transformer = function(ngons = [], clipSpaceMatrix = [], screenMatrix = [])
{
    ngons.forEach(ngon=>
    {
        ngon.transform(clipSpaceMatrix);
        ngon.clip_to_viewport();
        ngon.transform(screenMatrix);
        ngon.perspective_divide();
    });

    // Remove n-gons that have no vertices (e.g. due to all of them having been all clipped away).
    {
        let cur = 0;
        
        for (let i = 0; i < ngons.length; i++)
        {
            if (ngons[i].vertices.length)
            {
                ngons[cur++] = ngons[i];
            }
        }

        ngons.length = cur;
    }

    return;
}
