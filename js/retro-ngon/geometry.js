/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 * Functions to do with space; like vectors, vertices, etc.
 *
 */

"use strict"

// A collection of ngons, with shared translation and rotation.
// NOTE: Expects to remain immutable.
RNGon.mesh = function(ngons = [],
                           translation = RNGon.vector3(0, 0, 0),
                           rotation = RNGon.vector3(0, 0, 0),
                           scale = RNGon.vector3(1, 1, 1))
{
    k_assert((ngons instanceof Array), "Expected a list of ngons for creating an ngon mesh.");

    // A matrix by which the ngons of this mesh should be transformed to get the ngongs into
    // the mesh's object space.
    const objectSpaceMatrix = RNGon.matrix44.matrices_multiplied(RNGon.matrix44.matrices_multiplied(RNGon.matrix44.translate(translation.x, translation.y, translation.z),
                                                                                                    RNGon.matrix44.rotate(rotation.x, rotation.y,  rotation.z)),
                                                                 RNGon.matrix44.scale(scale.x, scale.y, scale.z));
    
    const publicInterface = Object.freeze(
    {
        rotation,
        translation,
        scale,
        ngons,
        objectSpaceMatrix,
    });
    return publicInterface;
}

// A single n-sided ngon.
// NOTE: Expects to remain immutable.
RNGon.ngon = function(vertices = [],
                      color = RNGon.color_rgba(127, 127, 127, 255),
                      texture = null,
                      hasSolidFill = true,
                      hasWireframe = false)
{
    k_assert((vertices instanceof Array), "Expected an array of vertices to make an ngon.");

    const publicInterface = Object.freeze(
    {
        color,
        texture,
        vertices,
        hasSolidFill,
        hasWireframe,

        // Transforms the ngon into screen-space, such that each vertex's x,y coordinate pair
        // corresponds directly with x,y coordinates on the screen (or screen buffer). Note that
        // you need to provide the function with a valid matrix with which this transformation
        // is possible given the ngon's current space.
        in_screen_space: function(matrixToScreenSpace)
        {
            return RNGon.ngon(vertices.map(vertex => vertex.transformed(matrixToScreenSpace).perspective_divided()),
                              color, texture, hasSolidFill, hasWireframe);
        },
    });
    return publicInterface;
}

// NOTE: Expects to remain immutable.
RNGon.vector3 = function(x = 0, y = 0, z = 0)
{
    k_assert((typeof x === "number" && typeof y === "number" && typeof z === "number"),
             "Expected numbers as parameters to the vector3 factory.");

    const publicInterface = Object.freeze(
    {
        x,
        y,
        z,

        cross: function(other = {})
        {
            return RNGon.vector3(((y * other.z) - (z * other.y)),
                                 ((z * other.x) - (x * other.z)),
                                 ((x * other.y) - (y * other.x)));
        },

        // Returns a normalized copy of the vector.
        normalized: function()
        {
            const sn = ((x * x) + (y * y) + (z * z));

            if (sn != 0 && sn != 1)
            {
                const inv = (1.0 / Math.sqrt(sn));
                return RNGon.vector3((x * inv), (y * inv), (z * inv));
            }
            else return RNGon.vector3(x, y, z);
        },
    });

    return publicInterface;
}

// NOTE: Expects to remain immutable.
RNGon.vertex4 = function(x = 0, y = 0, z = 0, w = 1, u = 0, v = 0)
{
    k_assert((typeof x === "number" && typeof y === "number" && typeof z === "number" &&
              typeof w === "number" && typeof u === "number" && typeof v === "number"),
             "Expected numbers as parameters to the vevertex4ctor3 factory.");

    const publicInterface = Object.freeze(
    {
        x,
        y,
        z,
        w,
        u,
        v,

        // Returns a copy of the vertex transformed by the given matrix.
        transformed: function(m = [])
        {
            k_assert((m.length === 16), "Expected a 4 x 4 matrix to transform the vertex by.");
            
            const x_ = ((m[0] * x) + (m[4] * y) + (m[ 8] * z) + (m[12] * w));
            const y_ = ((m[1] * x) + (m[5] * y) + (m[ 9] * z) + (m[13] * w));
            const z_ = ((m[2] * x) + (m[6] * y) + (m[10] * z) + (m[14] * w));
            const w_ = ((m[3] * x) + (m[7] * y) + (m[11] * z) + (m[15] * w));

            return RNGon.vertex4(x_, y_, z_, w_, u, v);
        },

        // Returns a copy of the vertex with perspective division applied.
        perspective_divided: function()
        {
            return RNGon.vertex4((x/w), (y/w), (z/w), w, u, v);
        }
    });

    return publicInterface;
}
