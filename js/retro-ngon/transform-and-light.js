/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 */

"use strict";

// Applies lighting to the given n-gons, and transforms them into screen space
// for rendering. The processed n-gons are stored in the internal n-gon cache.
Rngon.ngon_transform_and_light = function(ngons = [],
                                          objectMatrix = [],
                                          cameraMatrix = [],
                                          projectionMatrix = [],
                                          screenSpaceMatrix = [],
                                          cameraPos)
{
    const viewVector = {x:0.0, y:0.0, z:0.0};
    const transformedNgonsCache = Rngon.internalState.transformedNgonsCache;
    const clipSpaceMatrix = Rngon.matrix44.matrices_multiplied(projectionMatrix, cameraMatrix);

    for (const ngon of ngons)
    {
        // Ignore fully transparent polygons.
        if (!ngon.material.color.alpha)
        {
            continue;
        }

        // Backface culling.
        if (!ngon.material.isTwoSided)
        {
            viewVector.x = (ngon.vertices[0].x - cameraPos.x);
            viewVector.y = (ngon.vertices[0].y - cameraPos.y);
            viewVector.z = (ngon.vertices[0].z - cameraPos.z);

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

            cachedNgon.material = {...ngon.material};
            cachedNgon.normal = {...ngon.normal};
            cachedNgon.isActive = true;
        }

        if (cachedNgon.material.allowTransform)
        {
            // Eye space.
            {
                cachedNgon.transform(objectMatrix);

                if (cachedNgon.material.shading !== "none")
                {
                    cachedNgon.normal.transform(objectMatrix);
                    cachedNgon.normal.normalize();
                    Rngon.ngon_transform_and_light.apply_lighting(cachedNgon);
                }
            }

            // Clip space.
            {
                cachedNgon.transform(clipSpaceMatrix);

                if (Rngon.internalState.applyViewportClipping)
                {
                    cachedNgon.clip_to_viewport();
                }
            }

            // If there are no vertices left after clipping, it means this n-gon is not
            // visible on the screen at all, and we don't need to consider it for rendering.
            if (!cachedNgon.vertices.length)
            {
                transformedNgonsCache.numActiveNgons--;
                continue;
            }

            cachedNgon.transform(screenSpaceMatrix);
            cachedNgon.perspective_divide();
        }
    };

    // Mark as inactive any cached n-gons that we didn't touch, so the renderer knows
    // to ignore them for the current frame.
    for (let i = transformedNgonsCache.numActiveNgons; i < transformedNgonsCache.ngons.length; i++)
    {
        transformedNgonsCache.ngons[i].isActive = false;
    }

    return;
}

Rngon.ngon_transform_and_light.apply_lighting = function(ngon)
{
    const lightDirection = Rngon.vector3();

    // Find the brightest shade falling on this n-gon.
    let shade = 0;
    for (const light of Rngon.internalState.lights)
    {
        // If we've already found the maximum brightness, we don't need to continue.
        if (shade >= 255) break;

        lightDirection.x = (light.position.x - ngon.vertices[0].x);
        lightDirection.y = (light.position.y - ngon.vertices[0].y);
        lightDirection.z = (light.position.z - ngon.vertices[0].z);
        lightDirection.normalize();

        const shadeFromThisLight = Math.max(ngon.material.ambientLightLevel, Math.min(1, ngon.normal.dot(lightDirection)));

        shade = Math.max(shade, shadeFromThisLight);
    }

    ngon.material.color = Rngon.color_rgba(ngon.material.color.red   * shade,
                                           ngon.material.color.green * shade,
                                           ngon.material.color.blue  * shade,
                                           ngon.material.color.alpha);

    return;
}
