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

// Ray-traces light into the scene of n-gons, modifying the n-gons' texture colors
// according to how much light reaches each texel. Produces hard shadows. The n-gons'
// vertices are expected to be in world space.
//
// Returns a Promise that resolves when the process has finished. This will generally
// take roughly the number of seconds provided by the caller via 'secondsToBake'. Due
// to the ray-tracing algorithm used, the resulting lightmap will be of higher quality
// the longer the baking is allowed to run, and vice versa.
//
// WARNING: Modifies the n-gons' underlying data. All textures will be duplicated
// such that the texture of each n-gon is unique to that n-gon. This means a large
// multiplicative increase in the amount of texture data.
export function bake_hard_texture_lightmap(ngons = [Rngon.ngon()],
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

        // Clean up any temporary data we created into the n-gons array.
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
    let updateTimer = 0;

    while ((performance.now() - startTime) < (secondsToBake * 1000))
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

        // Indicate to the user how much time remains in the baking.
        if (!updateTimer ||
            ((performance.now() - updateTimer) > 3000))
        {
            const msRemaining = ((secondsToBake * 1000) - (performance.now() - startTime));
            const sRemaining = Math.round(msRemaining / 1000);
            const mRemaining = Math.round(sRemaining / 60);
            const hRemaining = Math.round(mRemaining / 60);

            const timeLabel = (()=>
            {
                if (sRemaining < 60) return `${sRemaining} sec`;
                if (mRemaining < 60) return `${mRemaining} min`;
                else return `${hRemaining} hr`;
            })();

            console.log(`Baking to textures... ETA = ${timeLabel}`);

            updateTimer = performance.now();
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
            const u = ((triangle.vertices[0].u * intersection.w) +
                       (triangle.vertices[1].u * intersection.u) +
                       (triangle.vertices[2].u * intersection.v));
            const v = ((triangle.vertices[0].v * intersection.w) +
                       (triangle.vertices[1].v * intersection.u) +
                       (triangle.vertices[2].v * intersection.v));

            const texture = triangle.material.texture;
            const texel = texture.shadeMap[~~(u * texture.width) + ~~(v * texture.height) * texture.width];

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
