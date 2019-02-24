/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 * Functions to do with space; like vectors, vertices, etc.
 *
 */

"use strict";

// A collection of ngons, with shared translation and rotation.
// NOTE: Expects to remain immutable.
Rngon.mesh = function(ngons = [Rngon.ngon()],
                      translation = Rngon.vector3(0, 0, 0),
                      rotation = Rngon.vector3(0, 0, 0),
                      scale = Rngon.vector3(1, 1, 1))
{
    Rngon.assert((ngons instanceof Array), "Expected a list of ngons for creating an ngon mesh.");

    // A matrix by which the ngons of this mesh should be transformed to get the ngongs into
    // the mesh's object space.
    const objectSpaceMatrix = Rngon.matrix44.matrices_multiplied(Rngon.matrix44.matrices_multiplied(Rngon.matrix44.translate(translation.x, translation.y, translation.z),
                                                                                                    Rngon.matrix44.rotate(rotation.x, rotation.y,  rotation.z)),
                                                                 Rngon.matrix44.scale(scale.x, scale.y, scale.z));

    ngons = Object.freeze(ngons);
    
    const publicInterface = Object.freeze(
    {
        ngons,
        rotation,
        translation,
        scale,
        objectSpaceMatrix,
    });
    return publicInterface;
}

// A single n-sided ngon.
// NOTE: Expects to remain immutable.
Rngon.ngon = function(vertices = [Rngon.vertex4()], material = {})
{
    Rngon.assert((vertices instanceof Array), "Expected an array of vertices to make an ngon.");
    Rngon.assert((material instanceof Object), "Expected an object containing user-supplied options.");

    // Combine default material options with the user-supplied ones.
    material = Object.freeze(
    {
        ...{
            color: Rngon.color_rgba(127, 127, 127, 255),
            texture: null,
            hasSolidFill: true,
            hasWireframe: false,
            wireframeColor: Rngon.color_rgba(0, 0, 0),
        },
        ...material
    });

    vertices = Object.freeze(vertices);

    const publicInterface = Object.freeze(
    {
        vertices,

        color: material.color,
        texture: material.texture,
        hasSolidFill: material.hasSolidFill,
        hasWireframe: material.hasWireframe,
        wireframeColor: material.wireframeColor,

        // Transforms the ngon into screen-space, such that each vertex's x,y coordinate pair
        // corresponds directly with x,y coordinates on the screen (or screen buffer). Note that
        // you need to provide the function with a valid matrix with which this transformation
        // is possible given the ngon's current space.
        in_screen_space: function(matrixToScreenSpace)
        {
            return Rngon.ngon(vertices.map(vertex=>vertex.transformed(matrixToScreenSpace).perspective_divided()), material);
        },
    });
    return publicInterface;
}

// NOTE: Expects to remain immutable.
Rngon.vector3 = function(x = 0, y = 0, z = 0)
{
    Rngon.assert((typeof x === "number" && typeof y === "number" && typeof z === "number"),
                 "Expected numbers as parameters to the vector3 factory.");

    const publicInterface = Object.freeze(
    {
        x,
        y,
        z,

        cross: function(other = {})
        {
            return Rngon.vector3(((y * other.z) - (z * other.y)),
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
                return Rngon.vector3((x * inv), (y * inv), (z * inv));
            }
            else return Rngon.vector3(x, y, z);
        },
    });

    return publicInterface;
}
// Convenience aliases for vector3.
Rngon.translation_vector = Rngon.vector3;
Rngon.rotation_vector = (x, y, z)=>Rngon.vector3(Rngon.trig.deg(x), Rngon.trig.deg(y), Rngon.trig.deg(z));
Rngon.scaling_vector = Rngon.vector3;

// NOTE: Expects to remain immutable.
Rngon.vertex4 = function(x = 0, y = 0, z = 0, w = 1, u = 0, v = 0)
{
    Rngon.assert((typeof x === "number" && typeof y === "number" && typeof z === "number" &&
                  typeof w === "number" && typeof u === "number" && typeof v === "number"),
                 "Expected numbers as parameters to the vertex4 factory.");

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
            Rngon.assert((m.length === 16), "Expected a 4 x 4 matrix to transform the vertex by.");
            
            const x_ = ((m[0] * x) + (m[4] * y) + (m[ 8] * z) + (m[12] * w));
            const y_ = ((m[1] * x) + (m[5] * y) + (m[ 9] * z) + (m[13] * w));
            const z_ = ((m[2] * x) + (m[6] * y) + (m[10] * z) + (m[14] * w));
            const w_ = ((m[3] * x) + (m[7] * y) + (m[11] * z) + (m[15] * w));

            return Rngon.vertex4(x_, y_, z_, w_, u, v);
        },

        // Returns a copy of the vertex with perspective division applied.
        perspective_divided: function()
        {
            return Rngon.vertex4((x/w), (y/w), (z/w), w, u, v);
        }
    });

    return publicInterface;
}
