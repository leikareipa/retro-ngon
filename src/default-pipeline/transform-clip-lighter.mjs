/*
 * 2019-2022 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

import {mesh_to_object_space_matrix} from "../api/mesh.mjs";
import {Assert} from "../assert.mjs";
import {Vector} from "../api/vector.mjs";
import {Matrix} from "../matrix.mjs";
import {
    ngon_clip_to_viewport,
    ngon_perspective_divide,
    ngon_transform,
} from "../api/ngon.mjs";

// Applies lighting to the given n-gons, and transforms them into screen space
// for rendering. The processed n-gons are stored in the internal n-gon cache.
export function transform_clip_lighter({
    renderState,
    mesh,
    cameraMatrix,
    perspectiveMatrix,
    screenSpaceMatrix,
} = {})
{
    const viewVector = {x:0.0, y:0.0, z:0.0};
    const ngonCache = renderState.ngonCache;
    const vertexCache = renderState.vertexCache;
    const vertexNormalCache = renderState.vertexNormalCache;
    const clipSpaceMatrix = Matrix.multiply(perspectiveMatrix, cameraMatrix);
    const objectSpaceMatrix = mesh_to_object_space_matrix(mesh);

    for (const ngon of mesh.ngons)
    {
        // Ignore fully transparent polygons.
        if (!ngon.material.hasWireframe &&
            ngon.material.allowAlphaReject &&
            (ngon.material.color.alpha <= 0))
        {
            continue;
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

                cachedNgon.vertexNormals[v] = vertexNormalCache.normals[vertexNormalCache.count++];
                cachedNgon.vertexNormals[v].x = ngon.vertexNormals[v].x;
                cachedNgon.vertexNormals[v].y = ngon.vertexNormals[v].y;
                cachedNgon.vertexNormals[v].z = ngon.vertexNormals[v].z;
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
        if (!cachedNgon.material.isInScreenSpace)
        {
            // World space. Any built-in lighting is applied, if requested by the n-gon's
            // material.
            {
                ngon_transform(cachedNgon, objectSpaceMatrix);

                // Interpolated world XYZ coordinates will be made available via the fragment
                // buffer, but aren't needed if shaders are disabled.
                if (renderState.useFragmentBuffer)
                {
                    for (let v = 0; v < cachedNgon.vertices.length; v++)
                    {
                        cachedNgon.vertices[v].worldX = cachedNgon.vertices[v].x;
                        cachedNgon.vertices[v].worldY = cachedNgon.vertices[v].y;
                        cachedNgon.vertices[v].worldZ = cachedNgon.vertices[v].z;
                    }
                }

                // Transform normals.
                {
                    for (let v = 0; v < cachedNgon.vertices.length; v++)
                    {
                        Vector.transform(cachedNgon.vertexNormals[v], objectSpaceMatrix);
                        Vector.normalize(cachedNgon.vertexNormals[v]);
                    }

                    Vector.transform(cachedNgon.normal, objectSpaceMatrix);
                    Vector.normalize(cachedNgon.normal);
                }

                // Backface culling.
                if (!cachedNgon.material.isTwoSided && (cachedNgon.vertices.length > 2))
                {
                    viewVector.x = (cachedNgon.vertices[0].x - renderState.cameraPosition.x);
                    viewVector.y = (cachedNgon.vertices[0].y - renderState.cameraPosition.y);
                    viewVector.z = (cachedNgon.vertices[0].z - renderState.cameraPosition.z);
        
                    if (Vector.dot(cachedNgon.normal, viewVector) >= 0)
                    {
                        cachedNgon.isActive = false;
                        ngonCache.count--;
                        continue;
                    }
                }

                if (cachedNgon.material.vertexShading !== "none")
                {
                    apply_lighting(cachedNgon, renderState);
                }

                // Apply an optional, user-defined vertex shader.
                if (renderState.useVertexShader)
                {
                    renderState.modules.vertex_shader(cachedNgon, renderState);
                }
            }

            // Clip space. Vertices that fall outside of the view frustum will be removed.
            {
                ngon_transform(cachedNgon, clipSpaceMatrix);
                ngon_clip_to_viewport(cachedNgon);

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
                ngon_transform(cachedNgon, screenSpaceMatrix);
                ngon_perspective_divide(cachedNgon);
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

function apply_lighting(ngon, renderState)
{
    Assert?.(
        ["flat", "gouraud"].includes(ngon.material.vertexShading),
        `Unrecognized shading mode: ${ngon.material.vertexShading}`
    );

    // Pre-allocate a vector object to operate on, so we don't need to create one repeatedly.
    const lightDirection = Vector();

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
    for (const light of renderState.lights)
    {
        // If we've already found the maximum brightness, we don't need to continue.
        //if (shade >= 255) break;

        if (ngon.material.vertexShading === "gouraud")
        {
            for (let v = 0; v < ngon.vertices.length; v++)
            {
                const vertex = ngon.vertices[v];

                const distance = Math.sqrt(
                    ((vertex.x - light.position.x) * (vertex.x - light.position.x)) +
                    ((vertex.y - light.position.y) * (vertex.y - light.position.y)) +
                    ((vertex.z - light.position.z) * (vertex.z - light.position.z))
                );

                const distanceMul = (1 / (1 + distance));

                lightDirection.x = (light.position.x - vertex.x);
                lightDirection.y = (light.position.y - vertex.y);
                lightDirection.z = (light.position.z - vertex.z);
                Vector.normalize(lightDirection);

                const angle = ((ngon.vertices.length < 3)? 1 : Vector.dot(ngon.vertexNormals[v], lightDirection));
                const shadeFromThisLight = Math.max(0, Math.min(1, angle));
                vertex.shade = Math.max(vertex.shade, Math.min(1, (shadeFromThisLight * distanceMul * light.intensity)));
            }
        }
        else if (ngon.material.vertexShading === "flat")
        {
            const distance = Math.sqrt(
                ((faceX - light.position.x) * (faceX - light.position.x)) +
                ((faceY - light.position.y) * (faceY - light.position.y)) +
                ((faceZ - light.position.z) * (faceZ - light.position.z))
            );

            const distanceMul = (1 / (1 + distance));

            lightDirection.x = (light.position.x - faceX);
            lightDirection.y = (light.position.y - faceY);
            lightDirection.z = (light.position.z - faceZ);
            Vector.normalize(lightDirection);

            const angle = ((ngon.vertices.length < 3)? 1 : Vector.dot(ngon.normal, lightDirection));
            const shadeFromThisLight = Math.max(0, Math.min(1, angle));
            faceShade = Math.max(faceShade, Math.min(1, (shadeFromThisLight * distanceMul * light.intensity)));
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
