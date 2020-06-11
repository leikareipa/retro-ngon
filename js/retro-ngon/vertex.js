/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

"use strict";

// NOTE: The returned object is not immutable.
Rngon.vertex = function(x = 0, y = 0, z = 0, u = 0, v = 0, w = 1, worldX = x, worldY = y, worldZ = z)
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

        // The vertex's original coordinates, before any transformations.
        worldX,
        worldY,
        worldZ,

        // Transforms the vertex by the given 4x4 matrix.
        transform: function(m = [])
        {
            Rngon.assert && (m.length === 16)
                         || Rngon.throw("Expected a 4 x 4 matrix to transform the vertex by.");
            
            const x_ = ((m[0] * this.x) + (m[4] * this.y) + (m[ 8] * this.z) + (m[12] * this.w));
            const y_ = ((m[1] * this.x) + (m[5] * this.y) + (m[ 9] * this.z) + (m[13] * this.w));
            const z_ = ((m[2] * this.x) + (m[6] * this.y) + (m[10] * this.z) + (m[14] * this.w));
            const w_ = ((m[3] * this.x) + (m[7] * this.y) + (m[11] * this.z) + (m[15] * this.w));

            this.x = x_;
            this.y = y_;
            this.z = z_;
            this.w = w_;
        },

        // Applies perspective division to the vertex.
        perspective_divide: function()
        {
            this.x /= this.w;
            this.y /= this.w;
            this.z /= this.w;
        }
    };

    return returnObject;
}
