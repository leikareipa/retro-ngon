/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

// Creates and returns an array containing triangulated versions of the given
// n-gons. The triangles' data are based on references to the n-gon data: e.g.
// vertices and materials are copied by reference, so modifying those data via
// the returned array will generally also modify the original n-gon data.
function triangulate_ngons(ngons = [Rngon.ngon()])
{
    Rngon.assert && ngons.every(n=>n.vertices.length >= 3)
                 || Rngon.throw("All n-gons must have at least three vertices.");

    return ngons.reduce((triangles, ngon)=>
    {
        const initialVertex = ngon.vertices[0];

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

// Creates the shade maps that will be used in baking. This function should be
// called on the original n-gons, before their triangulation.
function initialize_shade_maps(ngons = [Rngon.ngon()],
                               maxShadeMapWidth = 2,
                               maxShadeMapHeight = 2)
{
    for (const ngon of ngons)
    {
        const texture = (ngon.material.texture || {width:64, height:64});

        const width = Math.max(2, Math.min(maxShadeMapWidth, texture.width));
        const height = Math.max(2, Math.min(maxShadeMapHeight, texture.height));

        SHADE_MAPS.push(new Array(width * height)
                                 .fill()
                                 .map(pixel=>({
            accumulatedLight: 0.0,
            numSamples: 0,
        })));

        ngon.material.shadeMap = SHADE_MAPS[SHADE_MAPS.length - 1];
        ngon.material.shadeMap.width = width;
        ngon.material.shadeMap.height = height;
    }
}

// Maps the given UV coordinates into the n-gon material's texel coordinates.
// (The code here should match that in rasterize.js.)
function uv_to_texel_coordinates(u, v, material)
{
    const texture = material.shadeMap;

    Rngon.assert && (texture)
                 || Rngon.throw("The material must have a shade map.");

    switch (material.textureMapping)
    {
        // Affine mapping for power-of-two textures.
        case "affine":
        {
            switch (material.uvWrapping)
            {
                case "clamp":
                {
                    const signU = Math.sign(u);
                    const signV = Math.sign(v);
                    const upperLimit = (1 - Number.EPSILON);

                    u = Math.max(0, Math.min(Math.abs(u), upperLimit));
                    v = Math.max(0, Math.min(Math.abs(v), upperLimit));

                    // Negative UV coordinates flip the texture.
                    if (signU === -1) u = (upperLimit - u);
                    if (signV === -1) v = (upperLimit - v);

                    u *= texture.width;
                    v *= texture.height;

                    break;
                }
                case "repeat":
                {
                    u -= Math.floor(u);
                    v -= Math.floor(v);

                    u *= texture.width;
                    v *= texture.height;

                    // Modulo for power-of-two. This will also flip the texture for
                    // negative UV coordinates.
                    u = (u & (texture.width - 1));
                    v = (v & (texture.height - 1));

                    break;
                }
                default: Rngon.throw("Unrecognized UV wrapping mode."); break;
            }

            break;
        }
        // Affine mapping for wrapping non-power-of-two textures.
        /// FIXME: This implementation is a bit kludgy.
        /// TODO: Add clamped UV wrapping mode (we can just use the one for
        /// power-of-two textures).
        case "affine-npot":
        {
            u *= texture.width;
            v *= texture.height;

            // Wrap with repetition.
            /// FIXME: Why do we need to test for UV < 0 even when using positive
            /// but tiling UV coordinates? Doesn't render properly unless we do.
            if ((u < 0) ||
                (v < 0) ||
                (u >= texture.width) ||
                (v >= texture.height))
            {
                const uWasNeg = (u < 0);
                const vWasNeg = (v < 0);

                u = (Math.abs(u) % texture.width);
                v = (Math.abs(v) % texture.height);

                if (uWasNeg) u = (texture.width - u);
                if (vWasNeg) v = (texture.height - v);
            }

            break;
        }
        // Screen-space UV mapping, as used e.g. in the DOS game Rally-Sport.
        case "ortho":
        {
            break;
        }
        default: Rngon.throw("Unknown texture-mapping mode."); break;
    }

    return [u, v];
}
