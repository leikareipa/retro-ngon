/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

"use strict";

// NOTE: The returned object is not immutable.
Rngon.vertex = function(x = 0, y = 0, z = 0,
                        u = 0, v = 0,
                        w = 1,
                        shade = 1,
                        worldX = x, worldY = y, worldZ = z,
                        normalX = 0, normalY = 1, normalZ = 0)
{
    Rngon.assert && (typeof x === "number" && typeof y === "number" && typeof z === "number" &&
                     typeof w === "number" && typeof u === "number" && typeof v === "number" &&
                     typeof worldX === "number" && typeof worldY === "number" && typeof worldZ === "number")
                 || Rngon.throw("Expected numbers as parameters to the vertex factory.");

    const returnObject =
    {
        x,
        y,
        z,
        u,
        v,
        w,

        // A value in the range >= 0 that defines how lit this vertex is. A value of
        // 1 corresponds to fully lit, 0 to fully unlit.
        shade,

        // The vertex's original coordinates, before any transformations.
        worldX,
        worldY,
        worldZ,

        normalX,
        normalY,
        normalZ,
    };

    return returnObject;
}

// Transforms the vertex by the given 4x4 matrix.
Rngon.vertex.transform = function(v, m = [])
{
    Rngon.assert && (m.length === 16)
                    || Rngon.throw("Expected a 4 x 4 matrix to transform the vertex by.");
    
    const x_ = ((m[0] * v.x) + (m[4] * v.y) + (m[ 8] * v.z) + (m[12] * v.w));
    const y_ = ((m[1] * v.x) + (m[5] * v.y) + (m[ 9] * v.z) + (m[13] * v.w));
    const z_ = ((m[2] * v.x) + (m[6] * v.y) + (m[10] * v.z) + (m[14] * v.w));
    const w_ = ((m[3] * v.x) + (m[7] * v.y) + (m[11] * v.z) + (m[15] * v.w));

    v.x = x_;
    v.y = y_;
    v.z = z_;
    v.w = w_;
}

// Applies perspective division to the vertex.
Rngon.vertex.perspective_divide = function(v)
{
    v.x /= v.w;
    v.y /= v.w;
}
