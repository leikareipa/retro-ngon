/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

importScripts("../../distributable/rngon.cat.js",
              "./bvh.js",
              "./ray.js",
              "./baker-aux.js");

onmessage = (message)=>
{
    message = message.data;

    if ((typeof message != "object") ||
        (typeof message.command != "string"))
    {
        postMessage({
            type: "error",
            errorString: "A worker thread received an invalid message.",
        });

        return;
    }

    switch (message.command)
    {
        case "start":
        {
            try
            {
                bake_hard_texture_lightmap(message.ngons,
                                           message.lights,
                                           message.options);
            }
            catch (error)
            {
                postMessage({
                    type: "error",
                    errorMessage: error,
                });

                return;
            }

            postMessage({
                type: "finished",
                shadeMaps: SHADE_MAPS,
            });

            break;
        }
        default:
        {
            postMessage({
                type: "error",
                errorString: "A worker thread received an unrecognized message.",
            });
    
            return;
        }
    }
}

// The smallest non-zero value; used in certain floating-point operations to prevent
// accuracy issues. You can set a custom value via bake_texture_lightmap(). The most
// suitable value depends on your scene - but the default should be ok in most cases.
let EPSILON = 0.00001;

// A shade map for each n-gon in the scene (in the same order as the n-gons array).
// Each shade map is a grayscale image the same resolution as the corresponding n-gon's
// texture; each pixel in the shade map corresponding to a pixel in the texture and
// defining on a scale from 0 (black) to 1+ (white) how much light is falling on that
// texture pixel.
//
// Each element in the shade map is an object of the following form:
//
//   {
//       accumulatedLight: <number>,
//       numSamples: <number>
//   }
//
// To get the final shade value, divide accumulatedLight by numSamples and clamp to
// the desired range (the result without clamping may be higher than 1, dependent on
// the intensity of the scene's lights).
const SHADE_MAPS = [];

// Ray-traces light into the scene of n-gons, modifying the n-gons' texture colors
// according to how much light reaches each texel. Produces hard shadows. The n-gons'
// vertices are expected to be in world space.
//
// Returns a Promise that resolves when the process has finished. This will generally
// take roughly the number of seconds provided by the caller via 'numMinutesToBake'. Due
// to the ray-tracing algorithm used, the resulting lightmap will be of higher quality
// the longer the baking is allowed to run, and vice versa.
//
// WARNING: Modifies the n-gons' underlying data. All textures will be duplicated
// such that the texture of each n-gon is unique to that n-gon. This means a large
// multiplicative increase in the amount of texture data.
function bake_hard_texture_lightmap(ngons = [Rngon.ngon()],
                                    lights = [Rngon.light()],
                                    options = {})
{
    EPSILON = (options.epsilon || EPSILON);

    initialize_shade_maps(ngons);
    const triangles = triangulate_ngons(ngons);
    bake_shade_map(triangles, lights, options.numMinutesToBake);

    return;
}

// Renders into each triangle's texture object a shade map based on the amount of
// light reaching a corresponding texel from any of the given lights. This process
// only creates the shade map; it doesn't modify the correspinding texels (you'd
// call multiply_textures_by_shade_map() after this function to have the shade map
// applied).
function bake_shade_map(triangles = [Rngon.ngon()],
                        lights = [Rngon.light()],
                        numMinutesToBake = 1)
{
    const sceneBVH = bvh(triangles);
    const startTime = performance.now();

    while ((performance.now() - startTime) < (numMinutesToBake * 60 * 1000))
    {
        const randomLight = lights[Math.floor(Math.random() * lights.length)];

        const rayDirection = Rngon.vector3((Math.random() - Math.random()),
                                           (Math.random() - Math.random()),
                                           (Math.random() - Math.random()));

        Rngon.vector3.normalize(rayDirection);

        const lightRay = ray({...randomLight.position}, rayDirection);
        lightRay.lightSource = randomLight;
        lightRay.intensity = randomLight.intensity;

        trace_ray_into_scene(lightRay, sceneBVH);
    }

    return;
}

// Traces the given ray of light into the given scene represented as a BVH tree.
function trace_ray_into_scene(ray, sceneBVH, depth = 1)
{
    if ((depth > 1) ||
        (ray.intensity < (1 / 255))) // If the ray's light contribution would be insignificant.
    {
        return;
    }

    const intersection = ray.intersect_bvh(sceneBVH, EPSILON);

    if (intersection)
    {
        const triangle = intersection.triangle;
        const surfaceNormal = {...triangle.normal};

        // If the ray intersected a triangle from behind.
        if (!triangle.material.isTwoSided &&
            Rngon.vector3.dot(surfaceNormal, ray.dir) >= 0)
        {
            return;
        }

        // If we hit the two-sided triangle from 'behind', flip the normal so
        // that we correctly treat this side of the triangle as a front-facing
        // side.
        if (triangle.material.isTwoSided &&
            Rngon.vector3.dot(surfaceNormal, ray.dir) >= 0)
        {
            Rngon.vector3.invert(surfaceNormal);
        }
        
        // Write the light contribution into the triangle's texture.
        {
            const surfaceAlbedo = 0.8;
            const distanceAttenuation = (1 / (1 + (intersection.distance * ray.lightSource.attenuation)));

            ray.intensity *= (distanceAttenuation * surfaceAlbedo);

            // Barycentric interpolation of texture UV coordinates.
            let u = ((triangle.vertices[0].u * intersection.w) +
                     (triangle.vertices[1].u * intersection.u) +
                     (triangle.vertices[2].u * intersection.v));
            let v = ((triangle.vertices[0].v * intersection.w) +
                     (triangle.vertices[1].v * intersection.u) +
                     (triangle.vertices[2].v * intersection.v));

            [u, v] = uv_to_texel_coordinates(u, v, triangle.material);

            const shadeMap = triangle.material.shadeMap;
            const texel = shadeMap[Math.floor(u) + Math.floor(v) * shadeMap.width];

            if (texel)
            {
                texel.accumulatedLight += Math.min(ray.lightSource.clip, ray.intensity);
                texel.numSamples++;
            }
        }
        
        // Scatter the ray back out into the scene.
        ray.step(intersection.distance);
        ray.step(EPSILON, surfaceNormal);
        ray.aimAt.random_in_hemisphere_cosine_weighted(surfaceNormal);
        trace_ray_into_scene(ray, sceneBVH, (depth + 1));
    }

    return;
}
