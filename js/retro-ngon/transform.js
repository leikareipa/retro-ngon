/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 */

"use strict";

// Transforms the given n-gons into screen space for rendering.
Rngon.ngon_transformer = function(ngons = [], clipSpaceMatrix = [], screenMatrix = [], cameraPos)
{
    for (const ngon of ngons)
    {
        // Backface culling.
        if (!ngon.material.isTwoSided)
        {
            const viewVector =
            {
                x: (ngon.vertices[0].x - cameraPos.x),
                y: (ngon.vertices[0].y - cameraPos.y),
                z: (ngon.vertices[0].z - cameraPos.z),
            }

            if (ngon.normal.dot(viewVector) >= 0)
            {
                ngon.vertices.length = 0;
                continue;
            }
        }

        // Clipping.
        {
            ngon.transform(clipSpaceMatrix);

            if (Rngon.internalState.applyViewportClipping)
            {
                ngon.clip_to_viewport();
            }
        }

        ngon.transform(screenMatrix);
        ngon.perspective_divide();
    };

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
