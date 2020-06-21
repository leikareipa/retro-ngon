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
    const ngonCache = Rngon.internalState.ngonCache;
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

            if (Rngon.vector3.dot(ngon.normal, viewVector) >= 0)
            {
                continue;
            }
        }

        // Copy the ngon into the internal n-gon cache, so we can operate on it without
        // mutating the original n-gon's data.
        const cachedNgon = ngonCache.ngons[ngonCache.count++];
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

                if (ngon.material.vertexShading === "gouraud")
                {
                    cachedNgon.vertexNormals[v] = Rngon.vector3(ngon.vertexNormals[v].x,
                                                                ngon.vertexNormals[v].y,
                                                                ngon.vertexNormals[v].z);
                }
            }

            cachedNgon.material = ngon.material;
            
            // If Gouraud shading is enabled, we won't transform the face normal, only the
            // vertex normals, so the face normal can be copied by reference in that case.
            cachedNgon.normal = ((cachedNgon.material.vertexShading === "gouraud")? ngon.normal : {...ngon.normal});

            cachedNgon.isActive = true;
        }

        // Transform vertices into screen space and apply clipping. We'll do the transforming
        // in steps: first into object space, then into clip space, and finally into screen
        // space.
        if (cachedNgon.material.allowTransform)
        {
            // Object space. Any built-in lighting is applied, if requested by the n-gon's
            // material.
            {
                Rngon.ngon.transform(cachedNgon, objectMatrix);

                // Interpolated world XYZ coordinates will be made available to shaders,
                // but aren't needed if shaders are disabled.
                if (Rngon.internalState.usePixelShaders)
                {
                    for (let v = 0; v < cachedNgon.vertices.length; v++)
                    {
                        cachedNgon.vertices[v].worldX = cachedNgon.vertices[v].x;
                        cachedNgon.vertices[v].worldY = cachedNgon.vertices[v].y;
                        cachedNgon.vertices[v].worldZ = cachedNgon.vertices[v].z;
                    }
                }

                // If using Gouraud shading, we need to transform all vertex normals; but
                // the face normal won't be used and so can be ignored.
                if (cachedNgon.material.vertexShading === "gouraud")
                {
                    for (let v = 0; v < cachedNgon.vertices.length; v++)
                    {
                        Rngon.vector3.transform(cachedNgon.vertexNormals[v], objectMatrix);
                        Rngon.vector3.normalize(cachedNgon.vertexNormals[v]);
                    }
                }
                // With shading other than Gouraud, only the face normal will be used, and
                // we can ignore the vertex normals.
                else
                {
                    Rngon.vector3.transform(cachedNgon.normal, objectMatrix);
                    Rngon.vector3.normalize(cachedNgon.normal);
                }

                if (cachedNgon.material.vertexShading !== "none")
                {
                    Rngon.ngon_transform_and_light.apply_lighting(cachedNgon);
                }
            }

            // Clip space. Vertices that fall outside of the view frustum will be removed.
            {
                Rngon.ngon.transform(cachedNgon, clipSpaceMatrix);

                if (Rngon.internalState.applyViewportClipping)
                {
                    Rngon.ngon.clip_to_viewport(cachedNgon);
                }

                // If there are no vertices left after clipping, it means this n-gon is
                // not visible on the screen at all, and so we don't need to consider it
                // for rendering.
                if (!cachedNgon.vertices.length)
                {
                    ngonCache.count--;
                    continue;
                }
            }

            // Apply an optional, user-defined vertex shader.
            if (Rngon.internalState.vertex_shader_function)
            {
                Rngon.internalState.vertex_shader_function(cachedNgon);
            }

            // Screen space. Vertices will be transformed such that their XY coordinates
            // map directly into XY pixel coordinates in the rendered image (although
            // the values may still be in floating-point).
            {
                Rngon.ngon.transform(cachedNgon, screenSpaceMatrix);
                Rngon.ngon.perspective_divide(cachedNgon);
            }
        }
    };

    // Mark as inactive any cached n-gons that we didn't touch, so the renderer knows
    // to ignore them for the current frame.
    for (let i = ngonCache.count; i < ngonCache.ngons.length; i++)
    {
        ngonCache.ngons[i].isActive = false;
    }

    return;
}

Rngon.ngon_transform_and_light.apply_lighting = function(ngon)
{
    const lightDirection = Rngon.vector3();

    // Get the average XYZ point on this n-gon's face.
    let faceX = 0, faceY = 0, faceZ = 0, faceShade = 0;
    if (ngon.material.vertexShading === "flat")
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

        if (ngon.material.vertexShading === "gouraud")
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
                Rngon.vector3.normalize(lightDirection);

                const shadeFromThisLight = Math.max(ngon.material.ambientLightLevel, Math.min(1, Rngon.vector3.dot(ngon.vertexNormals[v], lightDirection)));

                vertex.shade = Math.max(vertex.shade, Math.min(1, (shadeFromThisLight * distanceMul * lightIntensity)));
            }
        }
        else if (ngon.material.vertexShading === "flat")
        {
            const distance = (((faceX - light.position.x) * (faceX - light.position.x)) +
                              ((faceY - light.position.y) * (faceY - light.position.y)) +
                              ((faceZ - light.position.z) * (faceZ - light.position.z)));

            const distanceMul = Math.max(0, Math.min(1, (1 - (distance / lightReach))));

            lightDirection.x = (light.position.x - faceX);
            lightDirection.y = (light.position.y - faceY);
            lightDirection.z = (light.position.z - faceZ);
            Rngon.vector3.normalize(lightDirection);

            const shadeFromThisLight = Math.max(ngon.material.ambientLightLevel, Math.min(1, Rngon.vector3.dot(ngon.normal, lightDirection)));

            faceShade = Math.max(faceShade, Math.min(1, (shadeFromThisLight * distanceMul * lightIntensity)));
        }
        else
        {
            Rngon.throw("Unknown shading mode.");
        }
    }

    if (ngon.material.vertexShading === "flat")
    {
        for (let v = 0; v < ngon.vertices.length; v++)
        {
            ngon.vertices[v].shade = faceShade;
        }
    }

    return;
}
