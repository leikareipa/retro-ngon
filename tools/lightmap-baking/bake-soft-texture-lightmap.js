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

// The name of the polygon material property which defines how much light the polygon
// emits.
const LIGHT_EMISSION_PROPERTY_NAME = "lightEmit";

// Path-traces light into the scene of n-gons, modifying the n-gons' texture colors
// according to how much light reaches each texel. Produces soft shadows and indirect
// lighting. The n-gons' vertices are expected to be in world space.
//
// Returns a Promise that resolves when the process has finished. This will generally
// take roughly the number of seconds provided by the caller via 'secondsToBake'. Due
// to the ray-tracing algorithm used, the resulting lightmap will be of higher quality
// the longer the baking is allowed to run, and vice versa.
//
// WARNING: Modifies the n-gons' underlying data. All textures will be duplicated
// such that the texture of each n-gon is unique to that n-gon. This means a large
// multiplicative increase in the amount of texture data.
export function bake_soft_texture_lightmap(ngons = [Rngon.ngon()],
                                           lights = [Rngon.light()],
                                           secondsToBake = 10,
                                           epsilon = undefined)
{
    EPSILON = (epsilon || EPSILON);

    return new Promise((resolve)=>
    {
        console.log(`Baking for ${secondsToBake} sec`);

        const numOriginalNgons = ngons.length;
        insert_light_source_meshes(lights, ngons);
        const triangles = triangulate_faces_and_duplicate_textures(ngons);
        mark_npot_textures(triangles);
        bake_shade_map(triangles, secondsToBake);
        multiply_textures_by_shade_map(triangles);

        console.log("Baking finished");

        // Clean up any temporary data we created that won't be needed anymore.
        {
            for (const ngon of ngons)
            {
                if (ngon.material.texture &&
                    ngon.material.texture.shadeMap)
                {
                    delete ngon.material.texture.shadeMap;
                }
            }

            ngons.length = numOriginalNgons;
        }

        resolve();
        return;
    });
}

// For each light source, creates a cube that emits light when light rays
// intersect with its surface. The cube will be inserted into the given n-gon
// array. Returns the number of n-gons in the given n-gon array prior to
// inserting the light source meshes.
function insert_light_source_meshes(lights = [Rngon.light()],
                                    ngons = [Rngon.ngon()])
{
    const numOriginalNgons = ngons.length;

    const cubeRadius = 300;

    for (const light of lights)
    {
        const lightMaterial = {
            [LIGHT_EMISSION_PROPERTY_NAME]: (light.intensity / 256),
            ambientLightLevel: 1,
            color:Rngon.color_rgba(255,255,255),
        };

        const cubeNgons = [
            Rngon.ngon([Rngon.vertex(-cubeRadius,  cubeRadius,  cubeRadius),
                        Rngon.vertex(-cubeRadius, -cubeRadius,  cubeRadius),
                        Rngon.vertex( cubeRadius, -cubeRadius,  cubeRadius),
                        Rngon.vertex( cubeRadius,  cubeRadius,  cubeRadius)],
                        lightMaterial, Rngon.vector3(0, 0, -1)),
            Rngon.ngon([Rngon.vertex(-cubeRadius,  cubeRadius, -cubeRadius),
                        Rngon.vertex(-cubeRadius, -cubeRadius, -cubeRadius),
                        Rngon.vertex( cubeRadius, -cubeRadius, -cubeRadius),
                        Rngon.vertex( cubeRadius,  cubeRadius, -cubeRadius)],
                        lightMaterial, Rngon.vector3(0, 0, 1)),
            Rngon.ngon([Rngon.vertex(-cubeRadius,  cubeRadius,  cubeRadius),
                        Rngon.vertex(-cubeRadius,  cubeRadius, -cubeRadius),
                        Rngon.vertex(-cubeRadius, -cubeRadius, -cubeRadius),
                        Rngon.vertex(-cubeRadius, -cubeRadius,  cubeRadius)],
                        lightMaterial, Rngon.vector3(-1, 0, 0)),
            Rngon.ngon([Rngon.vertex( cubeRadius,  cubeRadius,  cubeRadius),
                        Rngon.vertex( cubeRadius,  cubeRadius, -cubeRadius),
                        Rngon.vertex( cubeRadius, -cubeRadius, -cubeRadius),
                        Rngon.vertex( cubeRadius, -cubeRadius,  cubeRadius)],
                        lightMaterial, Rngon.vector3(1, 0, 0)),
            Rngon.ngon([Rngon.vertex(-cubeRadius,  cubeRadius,  cubeRadius),
                        Rngon.vertex( cubeRadius,  cubeRadius,  cubeRadius),
                        Rngon.vertex( cubeRadius,  cubeRadius, -cubeRadius),
                        Rngon.vertex(-cubeRadius,  cubeRadius, -cubeRadius)],
                        lightMaterial, Rngon.vector3(0, 1, 0)),
            Rngon.ngon([Rngon.vertex(-cubeRadius, -cubeRadius,  cubeRadius),
                        Rngon.vertex( cubeRadius, -cubeRadius,  cubeRadius),
                        Rngon.vertex( cubeRadius, -cubeRadius, -cubeRadius),
                        Rngon.vertex(-cubeRadius, -cubeRadius, -cubeRadius)],
                        lightMaterial, Rngon.vector3(0, -1, 0)),
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
                        secondsToBake = 1)
{
    const sceneBVH = bvh(triangles);
    const startTime = performance.now();
    let updateTimer = 0;

    while ((performance.now() - startTime) < (secondsToBake * 1000))
    {
        const randomTriangle = triangles[Math.floor(Math.random() * triangles.length)];

        // We don't need to cast light on light sources.
        if (randomTriangle.material[LIGHT_EMISSION_PROPERTY_NAME] > 0)
        {
            continue;
        }

        // Select a randon point on the triangle.
        const r1 = Math.sqrt(Math.random());
        const r2 = Math.random();
        const x = (1 - r1) * randomTriangle.vertices[0].x + (r1 * (1 - r2)) * randomTriangle.vertices[1].x + (r1 * r2) * randomTriangle.vertices[2].x;
        const y = (1 - r1) * randomTriangle.vertices[0].y + (r1 * (1 - r2)) * randomTriangle.vertices[1].y + (r1 * r2) * randomTriangle.vertices[2].y;
        const z = (1 - r1) * randomTriangle.vertices[0].z + (r1 * (1 - r2)) * randomTriangle.vertices[1].z + (r1 * r2) * randomTriangle.vertices[2].z;
        const randomPointOnTriangle = Rngon.vector3(x, y, z);

        const lightRay = ray({...randomPointOnTriangle});
        lightRay.step(EPSILON, randomTriangle.normal);
        
        // Get the interpolated shade map UV coordinates on this point on the triangle.
        const [u, v] = (()=>
        {
            lightRay.dir = {...randomTriangle.normal};
            Rngon.vector3.invert(lightRay.dir);
            const [distance, u, v] = lightRay.intersect_triangle(randomTriangle);

            const w = (1 - u - v);

            return [
                ((randomTriangle.vertices[0].u * w) +
                 (randomTriangle.vertices[1].u * u) +
                 (randomTriangle.vertices[2].u * v)),

                ((randomTriangle.vertices[0].v * w) +
                 (randomTriangle.vertices[1].v * u) +
                 (randomTriangle.vertices[2].v * v)),
            ];
        })();

        const texture = randomTriangle.material.texture;
        const texel = texture.shadeMap[Math.floor(u * texture.width) + Math.floor(v * texture.height) * texture.width];

        // Cast random rays from this point out into the scene, and add the light
        // contribution from each ray into the point's corresponding shade map element.
        const numSamplesPerTexel = 50;
        for (let i = 0; i < numSamplesPerTexel; i++)
        {
            const lightRay = ray({...randomPointOnTriangle});
            lightRay.aimAt.random_in_hemisphere_cosine_weighted(randomTriangle.normal);
            const brdf = (Rngon.vector3.dot(randomTriangle.normal, lightRay.dir) * (0.8 / Math.PI));
            const pdf = (Rngon.vector3.dot(randomTriangle.normal, lightRay.dir) / Math.PI); // For cosine-weighted sampling.
            const inLight = ((brdf / pdf) * trace_ray(lightRay, sceneBVH));

            // Write the incoming light into the triangle's shade map.
            if (texel)
            {
                texel.accumulatedLight += inLight;
                texel.numSamples++;
            }

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
            const shade = Math.max(0,
                                   (shaxel.accumulatedLight / (shaxel.numSamples || 1)));

            texel.red   = Math.max(0, Math.min(texel.red,   (texel.red   * shade)));
            texel.green = Math.max(0, Math.min(texel.green, (texel.green * shade)));
            texel.blue  = Math.max(0, Math.min(texel.blue,  (texel.blue  * shade)));
        }
    }

    return;
}

// Traces the given ray of light into the given scene represented as a BVH tree.
function trace_ray(ray, sceneBVH, depth = 0)
{
    if (depth > 3)
    {
        return 0;
    }

    const intersection = ray.intersect_bvh(sceneBVH, EPSILON);

    if (!intersection)
    {
        return 0;
    }

    if (intersection.triangle.material[LIGHT_EMISSION_PROPERTY_NAME])
    {
        return intersection.triangle.material[LIGHT_EMISSION_PROPERTY_NAME];
    }

    // If the ray intersected a triangle from behind.
    if (Rngon.vector3.dot(intersection.triangle.normal, ray.dir) >= 0)
    {
        return 0;
    }

    // If the ray intersected a texel that contains light.
    {
        const u = ((intersection.triangle.vertices[0].u * intersection.w) +
                   (intersection.triangle.vertices[1].u * intersection.u) +
                   (intersection.triangle.vertices[2].u * intersection.v));
        const v = ((intersection.triangle.vertices[0].v * intersection.w) +
                   (intersection.triangle.vertices[1].v * intersection.u) +
                   (intersection.triangle.vertices[2].v * intersection.v));

        const texture = intersection.triangle.material.texture;
        const texel = texture.shadeMap[Math.floor(u * texture.width) + Math.floor(v * texture.height) * texture.width];

        if (texel && texel.numSamples)
        {
            return (texel.accumulatedLight / texel.numSamples);
        }
    }

    ray.step(intersection.distance);
    ray.step(EPSILON, intersection.triangle.normal);
    ray.aimAt.random_in_hemisphere_cosine_weighted(intersection.triangle.normal);

    const surfaceAlbedo = 0.8;
    const brdf = (Rngon.vector3.dot(intersection.triangle.normal, ray.dir) * (surfaceAlbedo / Math.PI));
    const pdf = (Rngon.vector3.dot(intersection.triangle.normal, ray.dir) / Math.PI); // For cosine-weighted sampling.

    return ((brdf / pdf) * trace_ray(ray, sceneBVH, (depth + 1)));
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
