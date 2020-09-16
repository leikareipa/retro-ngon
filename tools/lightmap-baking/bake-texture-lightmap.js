/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

import {bvh} from "./bvh.js";
import {ray} from "./ray.js";

// The smallest non-zero value; used in certain floating-point operations to prevent
// accuracy issues. You can set a custom value via bake_texture_lightmap(). The most
// suitable value depends on your scene - but the default should be ok in most cases.
let EPSILON = 0.00001;

// Traces light rays into the scene of n-gons, modifying the n-gons' texture colors
// according to how much light reaches each texel. The n-gons' vertices are expected
// to be in world space.
//
// Returns a Promise that resolves when the process has finished. This will generally
// take roughly the number of seconds provided by the caller via 'secondsToBake'. Due
// to the ray-tracing algorithm used, the resulting lightmap will be of higher quality
// the longer the baking is allowed to run, and vice versa.
//
// WARNING: Modifies the n-gons' underlying data. All textures will be duplicated
// such that the texture of each n-gon is unique to that n-gon. This means a large
// multiplicative increase in the amount of texture data.
export function bake_texture_lightmap(ngons = [Rngon.ngon()],
                                      lights = [Rngon.light()],
                                      secondsToBake = 10,
                                      epsilon = undefined)
{
    EPSILON = (epsilon || EPSILON);

    return new Promise((resolve)=>
    {
        console.log(`Baking for ${secondsToBake} sec`);

        const triangles = triangulate_faces_and_duplicate_textures(ngons);
        mark_npot_textures(triangles);
        create_shade_map(triangles, lights, secondsToBake);
        multiply_textures_by_shade_map(triangles);

        console.log("Baking finished");

        // Clean up any temporary data we created that won't be needed anymore.
        for (const ngon of ngons)
        {
            if (ngon.material.texture &&
                ngon.material.texture.shadeMap)
            {
                delete ngon.material.texture.shadeMap;
            }
        }

        resolve();
        return;
    });
}

// Renders into each triangle's texture object a shade map based on the amount of
// light reaching a corresponding texel from any of the given lights. This process
// only creates the shade map; it doesn't modify the correspinding texels (you'd
// call multiply_textures_by_shade_map() after this function to have the shade map
// applied).
function create_shade_map(triangles = [Rngon.ngon()],
                          lights = [Rngon.light()],
                          secondsToBake = 1)
{
    const sceneBVH = bvh(triangles);
    const startTime = performance.now();
    let updateTimer = startTime;

    while ((performance.now() - startTime) < (secondsToBake * 1000))
    {
        const randomTriangle = triangles[Math.floor(Math.random() * triangles.length)];

        const r1 = Math.sqrt(Math.random());
        const r2 = Math.random();
        const x = (1 - r1) * randomTriangle.vertices[0].x + (r1 * (1 - r2)) * randomTriangle.vertices[1].x + (r1 * r2) * randomTriangle.vertices[2].x;
        const y = (1 - r1) * randomTriangle.vertices[0].y + (r1 * (1 - r2)) * randomTriangle.vertices[1].y + (r1 * r2) * randomTriangle.vertices[2].y;
        const z = (1 - r1) * randomTriangle.vertices[0].z + (r1 * (1 - r2)) * randomTriangle.vertices[1].z + (r1 * r2) * randomTriangle.vertices[2].z;
        const randomPointOnTriangle = Rngon.vector3(x, y, z);

        for (const light of lights)
        {
            const rayDirection = Rngon.vector3((randomPointOnTriangle.x - light.position.x),
                                               (randomPointOnTriangle.y - light.position.y),
                                               (randomPointOnTriangle.z - light.position.z));

            Rngon.vector3.normalize(rayDirection);

            // If the light ray would hit the triangle from behind.
            if (!randomTriangle.material.isTwoSided &&
                Rngon.vector3.dot(randomTriangle.normal, rayDirection) >= 0)
            {
                continue;
            }

            const lightRay = ray({...light.position}, rayDirection);
            lightRay.lightSource = light;
            lightRay.intensity = light.intensity;

            trace_light_ray(lightRay, sceneBVH);

            if (lightRay.intersection &&
                lightRay.intersection.triangle == randomTriangle)
            {
                // Barycentric interpolation of shade map UV coordinates.
                const u = ((randomTriangle.vertices[0].u * lightRay.intersection.w) +
                           (randomTriangle.vertices[1].u * lightRay.intersection.u) +
                           (randomTriangle.vertices[2].u * lightRay.intersection.v));
                const v = ((randomTriangle.vertices[0].v * lightRay.intersection.w) +
                           (randomTriangle.vertices[1].v * lightRay.intersection.u) +
                           (randomTriangle.vertices[2].v * lightRay.intersection.v));

                const texture = randomTriangle.material.texture;
                const texel = texture.shadeMap[~~(u * texture.width) + ~~(v * texture.height) * texture.width];

                if (texel)
                {
                    // To get soft shadows, we cast 'feeler rays', i.e. additional rays from the
                    // light source toward the target point, with a randomly altered origin
                    // somewhere within the area of the light source.
                    //
                    // For points that are lit by the entire surface of the light source, all feeler
                    // rays are expected to intersect with the corresponding polygon; otherwise,
                    // only a subset of the feeler rays will intersect. We can then modulate the
                    // light intensity arriving at the point from the main ray by the ratio of
                    // intersecting feeler rays to approximate soft shadows.
                    const numFeelerRays = 4;
                    const numFeelerRaysHit = (()=>
                    {
                        let hits = 0;

                        for (let f = 0; f < numFeelerRays; f++)
                        {
                            const lightDiameter = 500;

                            const randomOffsetPos = Rngon.vector3((light.position.x + (lightDiameter * (Math.random() - Math.random()))),
                                                                  (light.position.y + (lightDiameter * (Math.random() - Math.random()))),
                                                                  (light.position.z + (lightDiameter * (Math.random() - Math.random()))));

                            const rayDirection = Rngon.vector3((randomPointOnTriangle.x - randomOffsetPos.x),
                                                               (randomPointOnTriangle.y - randomOffsetPos.y),
                                                               (randomPointOnTriangle.z - randomOffsetPos.z));

                            const feelerRay = ray(randomOffsetPos, rayDirection);
                            feelerRay.lightSource = light;
                            feelerRay.intensity = light.intensity;

                            trace_light_ray(feelerRay, sceneBVH);

                            if (feelerRay.intersection &&
                                feelerRay.intersection.triangle == randomTriangle)
                            {
                                hits++;
                            }
                        }

                        return hits;
                    })();

                    // Ratio of feeler rays + the main ray that intersect the texel's point.
                    const feelerContrib = ((numFeelerRaysHit + 1) / (numFeelerRays + 1));
                    
                    texel.accumulatedLight = Math.max(texel.accumulatedLight, (feelerContrib * Math.min(lightRay.lightSource.clip, lightRay.intensity)));
                    texel.numSamples = 1;
                }
            }

            // Indicate to the user how much time remains in the baking.
            if ((performance.now() - updateTimer) > 1000)
            {
                const msRemaining = ((secondsToBake * 1000) - (performance.now() - startTime));
                const sRemaining = Math.ceil(msRemaining / 1000);
                const mRemaining = Math.floor(sRemaining / 60);
                const hRemaining = Math.floor(mRemaining / 60);

                const timeLabel = hRemaining > 0
                                ? `${hRemaining} hr`
                                : mRemaining > 0
                                ? `${mRemaining} min`
                                : `${sRemaining} sec`;

                console.log(`Baking to textures... ETA = ${timeLabel}`);

                updateTimer = performance.now();
            }
        }
    }

    return;
}

// Multiplies each given triangle's texel color by the triangle's corresponding
// shade map value.
function multiply_textures_by_shade_map(triangles = [Rngon.ngon()])
{
    for (const triangle of triangles)
    {
        const texture = triangle.material.texture;

        for (let i = 0; i < (texture.width * texture.height); i++)
        {
            const shaxel = texture.shadeMap[i];
            const texel = texture.pixels[i];
            const shade = Math.max(triangle.material.ambientLightLevel,
                                   (shaxel.accumulatedLight / (shaxel.numSamples || 1)));

            texel.red   = Math.max(0, Math.min(255,  (texel.red   * shade)));
            texel.green = Math.max(0, Math.min(255, (texel.green * shade)));
            texel.blue  = Math.max(0, Math.min(255, (texel.blue  * shade)));
        }
    }

    return;
}

// Traces the given ray of light into the given scene represented as a BVH tree.
function trace_light_ray(ray, sceneBVH, depth = 1)
{
    if ((depth > 1) ||
        (ray.intensity < (1 / 255))) // If the ray's light contribution would be insignificant.
    {
        return;
    }

    ray.intersection = ray.intersect_bvh(sceneBVH, EPSILON);

    if (ray.intersection)
    {
        const triangle = ray.intersection.triangle;
        const surfaceNormal = {...triangle.normal};

        // If the ray intersected a triangle from behind.
        if (!triangle.material.isTwoSided &&
            Rngon.vector3.dot(surfaceNormal, ray.dir) >= 0)
        {
            ray.intersection = null;

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
        
        // Attenuate the light's intensity as it scatters from this surface.
        const surfaceAlbedo = 0.8;
        const distanceAttenuation = (1 / (1 + (ray.intersection.distance * ray.lightSource.attenuation)));
        ray.intensity *= (distanceAttenuation * surfaceAlbedo);

        // Scatter the ray back out into the scene.
        ray.step(ray.intersection.distance);
        ray.step(EPSILON, surfaceNormal);
        ray.aimAt.random_in_hemisphere_cosine_weighted(surfaceNormal);
        trace_light_ray(ray, sceneBVH, (depth + 1));
    }

    return;
}

// Creates and returns an array containing triangulated versions of the given
// n-gons. The triangles' data are based on references to the n-gon data: e.g.
// vertices and materials are copied by reference, so modifying those data via
// the returned array will generally also modify the original n-gon data.
//
// The texture of each triangle will be deep-copy duplicated, such that modifying
// any triangle's texture will have no effect on the texture of any other triangle.
// Untextured faces will be assigned a deep copy of a blank texture.
function triangulate_faces_and_duplicate_textures(ngons = [])
{
    Rngon.assert && ngons.every(n=>n.vertices.length >= 3)
                 || Rngon.throw("All n-gons must have at least three vertices.");

    return ngons.reduce((triangles, ngon)=>
    {
        const initialVertex = ngon.vertices[0];

        // Create a deep copy of each polygon's texture. Untextured polygons are
        // assigned a deep copy of a blank texture whose color matches the polygon's
        // material color.
        {
            const texture = (ngon.material.texture || {width:64, height:64});
            const copiedPixels = new Array(texture.width * texture.height * 4);

            for (let t = 0; t < (texture.width * texture.height); t++)
            {
                const texelColor = (texture.pixels? texture.pixels[t] : ngon.material.color);

                copiedPixels[t*4+0] = texelColor.red;
                copiedPixels[t*4+1] = texelColor.green;
                copiedPixels[t*4+2] = texelColor.blue;
                copiedPixels[t*4+3] = texelColor.alpha;
            }

            const newTexture = Rngon.texture_rgba({
                width: texture.width,
                height: texture.height,
                pixels: copiedPixels,
                needsFlip: false,
            });

            newTexture.shadeMap = new Array(texture.width * texture.height).fill().map(e=>({
                accumulatedLight: 0.0,
                numSamples: 0,
            }));

            ngon.material.texture = newTexture;
        }

        // Triangulate the n-gon.
        for (let i = 1; i < (ngon.vertices.length - 1); i++)
        {
            triangles.push({
                normal: ngon.normal,
                material: ngon.material,
                vertices: [
                    initialVertex,
                    ngon.vertices[i],
                    ngon.vertices[i+1]
                ],
            });
        }

        return triangles;
    }, []);
}

// Marks any non-power-of-two affine-mapped faces in the given array of triangles
// as using the non-power-of-two affine texture mapper. This needs to be done since
// the default affine mapper expects textures to be power-of-two.
function mark_npot_textures(triangles = [Rngon.ngon()])
{
    for (const triangle of triangles)
    {
        const texture = triangle.material.texture;

        if (texture &&
            triangle.material.textureMapping === "affine")
        {
            let widthIsPOT = ((texture.width & (texture.width - 1)) === 0);
            let heightIsPOT = ((texture.height & (texture.height - 1)) === 0);

            if (texture.width === 0) widthIsPOT = false;
            if (texture.height === 0) heightIsPOT = false;

            if (!widthIsPOT || !heightIsPOT)
            {
                triangle.material.textureMapping = "affine-npot";
            }
        }
    }

    return;
}
