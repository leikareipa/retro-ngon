/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

"use strict";

// NOTE: The returned object is not immutable.
Rngon.vector3 = function(x = 0, y = 0, z = 0)
{
    Rngon.assert && (typeof x === "number" && typeof y === "number" && typeof z === "number")
                 || Rngon.throw("Expected numbers as parameters to the vector3 factory.");

    const returnObject =
    {
        x,
        y,
        z,

        // Transforms the vector by the given 4x4 matrix.
        transform: function(m = [])
        {
            Rngon.assert && (m.length === 16)
                         || Rngon.throw("Expected a 4 x 4 matrix to transform the vector by.");
            
            const x_ = ((m[0] * this.x) + (m[4] * this.y) + (m[ 8] * this.z));
            const y_ = ((m[1] * this.x) + (m[5] * this.y) + (m[ 9] * this.z));
            const z_ = ((m[2] * this.x) + (m[6] * this.y) + (m[10] * this.z));

            this.x = x_;
            this.y = y_;
            this.z = z_;
        },

        normalize: function()
        {
            const sn = ((this.x * this.x) + (this.y * this.y) + (this.z * this.z));

            if (sn != 0 && sn != 1)
            {
                const inv = (1 / Math.sqrt(sn));
                this.x *= inv;
                this.y *= inv;
                this.z *= inv;
            }
        },

        dot: function(other)
        {
            return ((this.x * other.x) + (this.y * other.y) + (this.z * other.z));
        },

        cross: function(other)
        {
            const c = Rngon.vector3();

            c.x = ((this.y * other.z) - (this.z * other.y));
            c.y = ((this.z * other.x) - (this.x * other.z));
            c.z = ((this.x * other.y) - (this.y * other.x));

            return c;
        },
    };

    return returnObject;
}

// Convenience aliases for vector3.
Rngon.translation_vector = Rngon.vector3;
Rngon.rotation_vector = (x, y, z)=>Rngon.vector3(Rngon.trig.deg(x), Rngon.trig.deg(y), Rngon.trig.deg(z));
Rngon.scaling_vector = Rngon.vector3;
