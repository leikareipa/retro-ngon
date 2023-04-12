/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

importScripts(
    "../../distributable/rngon.js",
    "./bvh.js",
    "./ray.js",
    "./baker-shared.js"
);

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
                bake_soft_texture_lightmap(message.ngons,
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

// The name of the polygon material property which defines how much light the polygon
// emits.
const LIGHT_EMISSION_PROPERTY = "lightEmit";

// Path-traces light into the scene of n-gons, modifying the n-gons' texture colors
// according to how much light reaches each texel. Produces soft shadows and indirect
// lighting. The n-gons' vertices are expected to be in world space.
function bake_soft_texture_lightmap(ngons = [Rngon.ngon()],
                                    lights = [Rngon.light()],
                                    options = {})
{
    EPSILON = (options.epsilon || EPSILON);

    initialize_shade_maps(ngons, options.maxShadeMapWidth, options.maxShadeMapHeight);
    insert_light_source_meshes(lights, ngons);
    const triangles = triangulate_ngons(ngons);
    bake_shade_map(triangles, options.numMinutesToBake);

    return;
}

// For each light source, creates a cube that emits light when light rays
// intersect with its surface. The cube will be inserted into the given n-gon
// array. Returns the number of n-gons in the given n-gon array prior to
// inserting the light source meshes.
function insert_light_source_meshes(lights = [Rngon.light()],
                                    ngons = [Rngon.ngon()])
{
    const numOriginalNgons = ngons.length;

    for (const light of lights)
    {
        const lightMaterial = {
            [LIGHT_EMISSION_PROPERTY]: light.intensity,
            ambientLightLevel: 1,
            color:Rngon.color_rgba(255,255,255),
        };

        const cubeNgons = [
            Rngon.ngon([Rngon.vertex(-light.meshRadius,  light.meshRadius,  light.meshRadius),
                        Rngon.vertex(-light.meshRadius, -light.meshRadius,  light.meshRadius),
                        Rngon.vertex( light.meshRadius, -light.meshRadius,  light.meshRadius),
                        Rngon.vertex( light.meshRadius,  light.meshRadius,  light.meshRadius)],
                        lightMaterial, Rngon.vector(0, 0, -1)),
            Rngon.ngon([Rngon.vertex(-light.meshRadius,  light.meshRadius, -light.meshRadius),
                        Rngon.vertex(-light.meshRadius, -light.meshRadius, -light.meshRadius),
                        Rngon.vertex( light.meshRadius, -light.meshRadius, -light.meshRadius),
                        Rngon.vertex( light.meshRadius,  light.meshRadius, -light.meshRadius)],
                        lightMaterial, Rngon.vector(0, 0, 1)),
            Rngon.ngon([Rngon.vertex(-light.meshRadius,  light.meshRadius,  light.meshRadius),
                        Rngon.vertex(-light.meshRadius,  light.meshRadius, -light.meshRadius),
                        Rngon.vertex(-light.meshRadius, -light.meshRadius, -light.meshRadius),
                        Rngon.vertex(-light.meshRadius, -light.meshRadius,  light.meshRadius)],
                        lightMaterial, Rngon.vector(-1, 0, 0)),
            Rngon.ngon([Rngon.vertex( light.meshRadius,  light.meshRadius,  light.meshRadius),
                        Rngon.vertex( light.meshRadius,  light.meshRadius, -light.meshRadius),
                        Rngon.vertex( light.meshRadius, -light.meshRadius, -light.meshRadius),
                        Rngon.vertex( light.meshRadius, -light.meshRadius,  light.meshRadius)],
                        lightMaterial, Rngon.vector(1, 0, 0)),
            Rngon.ngon([Rngon.vertex(-light.meshRadius,  light.meshRadius,  light.meshRadius),
                        Rngon.vertex( light.meshRadius,  light.meshRadius,  light.meshRadius),
                        Rngon.vertex( light.meshRadius,  light.meshRadius, -light.meshRadius),
                        Rngon.vertex(-light.meshRadius,  light.meshRadius, -light.meshRadius)],
                        lightMaterial, Rngon.vector(0, 1, 0)),
            Rngon.ngon([Rngon.vertex(-light.meshRadius, -light.meshRadius,  light.meshRadius),
                        Rngon.vertex( light.meshRadius, -light.meshRadius,  light.meshRadius),
                        Rngon.vertex( light.meshRadius, -light.meshRadius, -light.meshRadius),
                        Rngon.vertex(-light.meshRadius, -light.meshRadius, -light.meshRadius)],
                        lightMaterial, Rngon.vector(0, -1, 0)),
        ];

        cubeNgons.map(ngon=>{
            for (const vertex of ngon.vertices)
            {
                vertex.x += light.position.x;
                vertex.y += light.position.y;
                vertex.z += light.position.z;
            }

            ngons.push(ngon);
        });
    }

    return numOriginalNgons;
}

// Renders into each triangle's texture object a shade map based on the amount of
// light reaching a corresponding texel. This process only creates the shade map;
// it doesn't modify the correspinding texels (you'd call multiply_textures_by_shade_map()
// after this function to have the shade map applied).
function bake_shade_map(triangles = [Rngon.ngon()],
                        numMinutesToBake = 1)
{
    const sceneBVH = bvh(triangles);
    const startTime = performance.now();

    while ((performance.now() - startTime) < (numMinutesToBake * 60 * 1000))
    {
        const randomTriangle = triangles[Math.floor(Math.random() * triangles.length)];

        // We don't need to cast light on light sources.
        if (!randomTriangle.material.shadeMap ||
            (randomTriangle.material[LIGHT_EMISSION_PROPERTY] > 0))
        {
            continue;
        }

        // Select a randon point on the triangle.
        const r1 = Math.sqrt(Math.random());
        const r2 = Math.random();
        const x = (1 - r1) * randomTriangle.vertices[0].x + (r1 * (1 - r2)) * randomTriangle.vertices[1].x + (r1 * r2) * randomTriangle.vertices[2].x;
        const y = (1 - r1) * randomTriangle.vertices[0].y + (r1 * (1 - r2)) * randomTriangle.vertices[1].y + (r1 * r2) * randomTriangle.vertices[2].y;
        const z = (1 - r1) * randomTriangle.vertices[0].z + (r1 * (1 - r2)) * randomTriangle.vertices[1].z + (r1 * r2) * randomTriangle.vertices[2].z;
        const randomPointOnTriangle = Rngon.vector(x, y, z);

        const lightRay = ray({...randomPointOnTriangle});
        lightRay.step(EPSILON, randomTriangle.normal);
        
        // Get the interpolated shade map UV coordinates on this point on the triangle.
        const [u, v] = (()=>
        {
            lightRay.dir = {...randomTriangle.normal};
            Rngon.vector.invert(lightRay.dir);
            const [distance, u, v] = lightRay.intersect_triangle(randomTriangle);

            const w = (1 - u - v);

            let tu = ((randomTriangle.vertices[0].u * w) +
                      (randomTriangle.vertices[1].u * u) +
                      (randomTriangle.vertices[2].u * v));

            let tv = ((randomTriangle.vertices[0].v * w) +
                      (randomTriangle.vertices[1].v * u) +
                      (randomTriangle.vertices[2].v * v));

            [tu, tv] = uv_to_texel_coordinates(tu, tv, randomTriangle.material);

            return [tu, tv];
        })();
        
        const shadeMap = randomTriangle.material.shadeMap;
        const texel = shadeMap[Math.floor(u) + Math.floor(v) * shadeMap.width];

        // Cast random rays from this point out into the scene, and add the light
        // contribution from each ray into the point's corresponding shade map element.
        const numSamplesPerTexel = 1;
        for (let i = 0; i < numSamplesPerTexel; i++)
        {
            const lightRay = ray({...randomPointOnTriangle});
            lightRay.aimAt.random_in_hemisphere_cosine_weighted(randomTriangle.normal);
            const brdf = (Rngon.vector.dot(randomTriangle.normal, lightRay.dir) * (0.8 / Math.PI));
            const pdf = (Rngon.vector.dot(randomTriangle.normal, lightRay.dir) / Math.PI); // For cosine-weighted sampling.
            const inLight = ((brdf / pdf) * trace_ray(lightRay, sceneBVH));

            // Write the incoming light into the triangle's shade map.
            if (texel)
            {
                texel.accumulatedLight += inLight;
                texel.numSamples++;
            }
        }
    }

    return;
}

// Traces the given ray of light into the given BVH tree. Returns the amount
// of light arriving from the ray's direction.
function trace_ray(ray, sceneBVH, depth = 0)
{
    if (depth > 6)
    {
        return 0;
    }

    const intersection = ray.intersect_bvh(sceneBVH, EPSILON);

    if (!intersection)
    {
        return 0;
    }

    const triangle = intersection.triangle;

    // If the ray intersected a light source.
    if (triangle.material[LIGHT_EMISSION_PROPERTY])
    {
        return triangle.material[LIGHT_EMISSION_PROPERTY];
    }

    const surfaceNormal = {...triangle.normal};

    // If the ray intersected a triangle from behind.
    if (!triangle.material.isTwoSided &&
        Rngon.vector.dot(surfaceNormal, ray.dir) >= 0)
    {
        return 0;
    }

    // If the ray hit a two-sided triangle from 'behind', flip the normal so
    // that we correctly treat this side of the triangle as a front-facing
    // side.
    if (triangle.material.isTwoSided &&
        Rngon.vector.dot(surfaceNormal, ray.dir) >= 0)
    {
        Rngon.vector.invert(surfaceNormal);
    }

    // If the ray intersected a texel that contains light.
    {
        let u = ((triangle.vertices[0].u * intersection.w) +
                 (triangle.vertices[1].u * intersection.u) +
                 (triangle.vertices[2].u * intersection.v));
        let v = ((triangle.vertices[0].v * intersection.w) +
                 (triangle.vertices[1].v * intersection.u) +
                 (triangle.vertices[2].v * intersection.v));

        [u, v] = uv_to_texel_coordinates(u, v, triangle.material);

        const shadeMap = triangle.material.shadeMap;
        const texel = shadeMap[Math.floor(u) + Math.floor(v) * shadeMap.width];

        if (texel && texel.numSamples)
        {
            return (texel.accumulatedLight / texel.numSamples);
        }
    }

    ray.step(intersection.distance);
    ray.step(EPSILON, surfaceNormal);
    ray.aimAt.random_in_hemisphere_cosine_weighted(surfaceNormal);

    const surfaceAlbedo = 0.8;
    const brdf = (Rngon.vector.dot(surfaceNormal, ray.dir) * (surfaceAlbedo / Math.PI));
    const pdf = (Rngon.vector.dot(surfaceNormal, ray.dir) / Math.PI); // For cosine-weighted sampling.

    return ((brdf / pdf) * trace_ray(ray, sceneBVH, (depth + 1)));
}
