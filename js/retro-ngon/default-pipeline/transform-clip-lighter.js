/*
 * 2019-2022 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

// Applies lighting to the given n-gons, and transforms them into screen space
// for rendering. The processed n-gons are stored in the internal n-gon cache.
export function transform_clip_lighter(
    ngons = [],
    objectMatrix = [],
    cameraMatrix = [],
    projectionMatrix = [],
    screenSpaceMatrix = [],
    cameraPos
)
{
    const viewVector = {x:0.0, y:0.0, z:0.0};
    const ngonCache = Rngon.state.active.ngonCache;
    const vertexCache = Rngon.state.active.vertexCache;
    const clipSpaceMatrix = Rngon.matrix44.multiply(projectionMatrix, cameraMatrix);

    for (const ngon of ngons)
    {
        // Ignore fully transparent polygons.
        if (!ngon.material.hasWireframe &&
            ngon.material.allowAlphaReject &&
            (ngon.material.color.alpha <= 0))
        {
            continue;
        }

        // Backface culling.
        if (!ngon.material.isTwoSided)
        {
            viewVector.x = (ngon.vertices[0].x - cameraPos.x);
            viewVector.y = (ngon.vertices[0].y - cameraPos.y);
            viewVector.z = (ngon.vertices[0].z - cameraPos.z);

            if (Rngon.vector.dot(ngon.normal, viewVector) >= 0)
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
                const srcVertex = ngon.vertices[v];
                const dstVertex = cachedNgon.vertices[v] = vertexCache.vertices[vertexCache.count++];

                dstVertex.x = srcVertex.x;
                dstVertex.y = srcVertex.y;
                dstVertex.z = srcVertex.z;
                dstVertex.u = srcVertex.u;
                dstVertex.v = srcVertex.v;
                dstVertex.w = srcVertex.w;
                dstVertex.shade = srcVertex.shade;

                if (Rngon.state.active.useVertexShader ||
                    (ngon.material.vertexShading === "gouraud"))
                {
                    cachedNgon.vertexNormals[v] = Rngon.vector(
                        ngon.vertexNormals[v].x,
                        ngon.vertexNormals[v].y,
                        ngon.vertexNormals[v].z
                    );
                }
            }

            cachedNgon.material = ngon.material;
            cachedNgon.normal.x = ngon.normal.x;
            cachedNgon.normal.y = ngon.normal.y;
            cachedNgon.normal.z = ngon.normal.z;
            cachedNgon.isActive = true;
            cachedNgon.mipLevel = ngon.mipLevel;
        }

        // Transform vertices into screen space and apply clipping. We'll do the transforming
        // in steps: first into world space, then into clip space, and finally into screen
        // space.
        if (cachedNgon.material.allowTransform)
        {
            // World space. Any built-in lighting is applied, if requested by the n-gon's
            // material.
            {
                Rngon.ngon.transform(cachedNgon, objectMatrix);

                // Interpolated world XYZ coordinates will be made available via the fragment
                // buffer, but aren't needed if shaders are disabled.
                if (Rngon.state.active.useFragmentBuffer)
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
                if (Rngon.state.active.useVertexShader ||
                    (cachedNgon.material.vertexShading === "gouraud"))
                {
                    for (let v = 0; v < cachedNgon.vertices.length; v++)
                    {
                        Rngon.vector.transform(cachedNgon.vertexNormals[v], objectMatrix);
                        Rngon.vector.normalize(cachedNgon.vertexNormals[v]);
                    }
                }
                // With shading other than Gouraud, only the face normal will be used, and
                // we can ignore the vertex normals.
                else
                {
                    Rngon.vector.transform(cachedNgon.normal, objectMatrix);
                    Rngon.vector.normalize(cachedNgon.normal);
                }

                if (cachedNgon.material.vertexShading !== "none")
                {
                    apply_lighting(cachedNgon);
                }

                // Apply an optional, user-defined vertex shader.
                if (Rngon.state.active.useVertexShader)
                {
                    const args = [
                        cachedNgon,
                        cameraPos,
                    ];

                    const paramNamesString = "ngon, cameraPos";

                    switch (typeof Rngon.state.active.modules.vertex_shader)
                    {
                        case "function":
                        {
                            Rngon.state.active.modules.vertex_shader(...args);
                            break;
                        }
                        // Shader functions as strings are supported to allow shaders to be
                        // used in Web Workers. These strings are expected to be of - or
                        // equivalent to - the form "(a)=>{console.log(a)}".
                        case "string":
                        {
                            Function(paramNamesString, `(${Rngon.state.active.modules.vertex_shader})(${paramNamesString})`)(...args);
                            break;
                        }
                        default:
                        {
                            Rngon.$throw("Unrecognized type of vertex shader function.");
                            break;
                        }
                    }
                }
            }

            // Clip space. Vertices that fall outside of the view frustum will be removed.
            {
                Rngon.ngon.transform(cachedNgon, clipSpaceMatrix);
                Rngon.ngon.clip_to_viewport(cachedNgon);

                // If there are no vertices left after clipping, it means this n-gon is
                // not visible on the screen at all, and so we don't need to consider it
                // for rendering.
                if (!cachedNgon.vertices.length)
                {
                    ngonCache.count--;
                    continue;
                }
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

function apply_lighting(ngon)
{
    // Pre-allocate a vector object to operate on, so we don't need to create one repeatedly.
    const lightDirection = Rngon.vector();

    let faceShade = ngon.material.ambientLightLevel;
    for (let v = 0; v < ngon.vertices.length; v++)
    {
        ngon.vertices[v].shade = ngon.material.ambientLightLevel;
    }

    // Get the average XYZ point on this n-gon's face.
    let faceX = 0, faceY = 0, faceZ = 0;
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
    for (const light of Rngon.state.active.lights)
    {
        // If we've already found the maximum brightness, we don't need to continue.
        //if (shade >= 255) break;

        if (ngon.material.vertexShading === "gouraud")
        {
            for (let v = 0; v < ngon.vertices.length; v++)
            {
                const vertex = ngon.vertices[v];

                const distance = Math.sqrt(((vertex.x - light.position.x) * (vertex.x - light.position.x)) +
                                           ((vertex.y - light.position.y) * (vertex.y - light.position.y)) +
                                           ((vertex.z - light.position.z) * (vertex.z - light.position.z)));

                const distanceMul = (1 / (1 + (light.attenuation * distance)));

                lightDirection.x = (light.position.x - vertex.x);
                lightDirection.y = (light.position.y - vertex.y);
                lightDirection.z = (light.position.z - vertex.z);
                Rngon.vector.normalize(lightDirection);

                const shadeFromThisLight = Math.max(0, Math.min(1, Rngon.vector.dot(ngon.vertexNormals[v], lightDirection)));
                vertex.shade = Math.max(vertex.shade, Math.min(light.clip, (shadeFromThisLight * distanceMul * light.intensity)));
            }
        }
        else if (ngon.material.vertexShading === "flat")
        {
            const distance = Math.sqrt(((faceX - light.position.x) * (faceX - light.position.x)) +
                                       ((faceY - light.position.y) * (faceY - light.position.y)) +
                                       ((faceZ - light.position.z) * (faceZ - light.position.z)));

            const distanceMul = (1 / (1 + (light.attenuation * distance)));

            lightDirection.x = (light.position.x - faceX);
            lightDirection.y = (light.position.y - faceY);
            lightDirection.z = (light.position.z - faceZ);
            Rngon.vector.normalize(lightDirection);

            const shadeFromThisLight = Math.max(0, Math.min(1, Rngon.vector.dot(ngon.normal, lightDirection)));
            faceShade = Math.max(faceShade, Math.min(light.clip, (shadeFromThisLight * distanceMul * light.intensity)));
        }
        else
        {
            Rngon.$throw("Unknown shading mode.");
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