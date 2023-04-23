/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

import {assert as Assert} from "../core/util.js";

export function vector(x = 0, y = 0, z = 0)
{
    Assert?.(
        ((typeof x === "number") &&
         (typeof y === "number") &&
         (typeof z === "number")),
        "Expected numbers as parameters to the vector factory."
    );

    const publicInterface = {
        x,
        y,
        z,
    };

    return publicInterface;
}

// Transforms the vector by the given 4x4 matrix.
vector.transform = function(v, m = [])
{
    Assert?.(
        (m.length === 16),
        "Expected a 4 x 4 matrix to transform the vector by."
    );

    const x_ = ((m[0] * v.x) + (m[4] * v.y) + (m[ 8] * v.z));
    const y_ = ((m[1] * v.x) + (m[5] * v.y) + (m[ 9] * v.z));
    const z_ = ((m[2] * v.x) + (m[6] * v.y) + (m[10] * v.z));

    v.x = x_;
    v.y = y_;
    v.z = z_;
}

vector.normalize = function(v)
{
    const sn = ((v.x * v.x) + (v.y * v.y) + (v.z * v.z));

    if (sn != 0 && sn != 1)
    {
        const inv = (1 / Math.sqrt(sn));
        v.x *= inv;
        v.y *= inv;
        v.z *= inv;
    }
}

vector.dot = function(v, other)
{
    return ((v.x * other.x) + (v.y * other.y) + (v.z * other.z));
}

vector.cross = function(v, other)
{
    const c = vector();

    c.x = ((v.y * other.z) - (v.z * other.y));
    c.y = ((v.z * other.x) - (v.x * other.z));
    c.z = ((v.x * other.y) - (v.y * other.x));

    return c;
}

vector.invert = function(v)
{
    v.x *= -1;
    v.y *= -1;
    v.z *= -1;
}
