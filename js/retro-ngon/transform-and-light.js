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
        if (!ngon.material.color.alpha &&
            !ngon.material.hasWireframe)
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

        // Copy the ngon into the internal n-gon caches, so we can operate on it later
        // along the render pipeline.
        const cachedNgon = transformedNgonsCache.ngons[transformedNgonsCache.count++];
        {
            cachedNgon.vertices.length = 0;

            for (let v = 0; v < ngon.vertices.length; v++)
            {
                cachedNgon.vertices[v] = Rngon.vertex(ngon.vertices[v].x,
                                                      ngon.vertices[v].y,
                                                      ngon.vertices[v].z,
                                                      ngon.vertices[v].u,
                                                      ngon.vertices[v].v,
                                                      ngon.vertices[v].w);

                cachedNgon.vertexNormals[v] = Rngon.vector3(ngon.vertexNormals[v].x,
                                                            ngon.vertexNormals[v].y,
                                                            ngon.vertexNormals[v].z);
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
                cachedNgon.normal.transform(objectMatrix);
                cachedNgon.normal.normalize();

                for (let v = 0; v < cachedNgon.vertices.length; v++)
                {
                    if (cachedNgon.material.shading === "gouraud")
                    {
                        cachedNgon.vertexNormals[v].transform(objectMatrix);
                        cachedNgon.vertexNormals[v].normalize();
                    }

                    cachedNgon.vertices[v].worldX = cachedNgon.vertices[v].x;
                    cachedNgon.vertices[v].worldY = cachedNgon.vertices[v].y;
                    cachedNgon.vertices[v].worldZ = cachedNgon.vertices[v].z;
                }

                if (cachedNgon.material.shading !== "none")
                {
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
                transformedNgonsCache.count--;
                continue;
            }

            cachedNgon.transform(screenSpaceMatrix);
            cachedNgon.perspective_divide();
        }
    };

    // Mark as inactive any cached n-gons that we didn't touch, so the renderer knows
    // to ignore them for the current frame.
    for (let i = transformedNgonsCache.count; i < transformedNgonsCache.ngons.length; i++)
    {
        transformedNgonsCache.ngons[i].isActive = false;
    }

    return;
}

Rngon.ngon_transform_and_light.apply_lighting = function(ngon)
{
    const lightDirection = Rngon.vector3();

    // Get the average XYZ point on this n-gon's face.
    let faceX = 0, faceY = 0, faceZ = 0, faceShade = 0;
    if (ngon.material.shading === "flat")
    {
        for (const vertex of ngon.vertices)
        {
            faceX += vertex.x;
            faceY += vertex.y;
            faceZ += vertex.z;
        }

        faceX /= ngon.vertices.length;
        faceY /= ngon.vertices.length;
        faceZ /= ngon.vertices.length;
    }

    // Find the brightest shade falling on this n-gon.
    for (const light of Rngon.internalState.lights)
    {
        // If we've already found the maximum brightness, we don't need to continue.
        //if (shade >= 255) break;

        /// TODO: These should be properties of the light object.
        const lightReach = (1000 * 1000);
        const lightIntensity = 1;

        if (ngon.material.shading === "gouraud")
        {
            for (let v = 0; v < ngon.vertices.length; v++)
            {
                const vertex = ngon.vertices[v];

                vertex.shade = 0;

                const distance = (((vertex.x - light.position.x) * (vertex.x - light.position.x)) +
                                  ((vertex.y - light.position.y) * (vertex.y - light.position.y)) +
                                  ((vertex.z - light.position.z) * (vertex.z - light.position.z)));

                const distanceMul = Math.max(0, Math.min(1, (1 - (distance / lightReach))));

                lightDirection.x = (light.position.x - vertex.x);
                lightDirection.y = (light.position.y - vertex.y);
                lightDirection.z = (light.position.z - vertex.z);
                lightDirection.normalize();

                const shadeFromThisLight = Math.max(ngon.material.ambientLightLevel, Math.min(1, ngon.vertexNormals[v].dot(lightDirection)));

                vertex.shade = Math.max(vertex.shade, Math.min(1, (shadeFromThisLight * distanceMul * lightIntensity)));
            }
        }
        else if (ngon.material.shading === "flat")
        {
            const distance = (((faceX - light.position.x) * (faceX - light.position.x)) +
                              ((faceY - light.position.y) * (faceY - light.position.y)) +
                              ((faceZ - light.position.z) * (faceZ - light.position.z)));

            const distanceMul = Math.max(0, Math.min(1, (1 - (distance / lightReach))));

            lightDirection.x = (light.position.x - faceX);
            lightDirection.y = (light.position.y - faceY);
            lightDirection.z = (light.position.z - faceZ);
            lightDirection.normalize();

            const shadeFromThisLight = Math.max(ngon.material.ambientLightLevel, Math.min(1, ngon.normal.dot(lightDirection)));

            faceShade = Math.max(faceShade, Math.min(1, (shadeFromThisLight * distanceMul * lightIntensity)));
        }
        else
        {
            Rngon.throw("Unknown shading mode.");
        }
    }

    if (ngon.material.shading === "flat")
    {
        for (let v = 0; v < ngon.vertices.length; v++)
        {
            ngon.vertices[v].shade = faceShade;
        }
    }

    return;
}
