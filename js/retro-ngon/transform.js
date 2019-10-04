/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 */

"use strict";

// Transforms the given n-gons into screen space for rendering. The transformed n-gons
// are stored in the internal n-gon cache.
Rngon.ngon_transformer = function(ngons = [], clipSpaceMatrix = [], screenSpaceMatrix = [], cameraPos)
{
    const transformedNgonsCache = Rngon.internalState.transformedNgonsCache;

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
                continue;
            }
        }

        // Copy the ngon into the internal n-gon cache, so we can operate on it later in the
        // render pipeline without destroying the original data.
        const cachedNgon = transformedNgonsCache.ngons[transformedNgonsCache.numActiveNgons++];
        {
            cachedNgon.vertices.length = 0;

            // Copy by value.
            for (let v = 0; v < ngon.vertices.length; v++)
            {
                cachedNgon.vertices[v] = Rngon.vertex(ngon.vertices[v].x,
                                                      ngon.vertices[v].y,
                                                      ngon.vertices[v].z,
                                                      ngon.vertices[v].u,
                                                      ngon.vertices[v].v,
                                                      ngon.vertices[v].w,);
            }

            // Copy by value.
            cachedNgon.material = {...ngon.material};

            // Copy by reference.
            cachedNgon.normal = ngon.normal;

            cachedNgon.isActive = true;
        }

        // Clipping.
        cachedNgon.transform(clipSpaceMatrix);
        {
            if (Rngon.internalState.applyViewportClipping)
            {
                cachedNgon.clip_to_viewport();

                // If there are no vertices left after clipping, it means this n-gon is not visible
                // on the screen at all. We can just ignore it.
                if (!cachedNgon.vertices.length)
                {
                    transformedNgonsCache.numActiveNgons--;
                    continue;
                }
            }
        }

        cachedNgon.transform(screenSpaceMatrix);
        cachedNgon.perspective_divide();
    };

    // Mark as inactive any cached n-gons that we didn't touch, so the renderer knows
    // to ignore them for the current frame.
    for (let i = transformedNgonsCache.numActiveNgons; i < transformedNgonsCache.ngons.length; i++)
    {
        transformedNgonsCache.ngons[i].isActive = false;
    }

    return;
}
