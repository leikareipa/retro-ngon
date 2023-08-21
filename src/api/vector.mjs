/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

import {validate_object} from "../core/schema.mjs";
import {Assert} from "../core/assert.mjs";

const schema = {
    interface: {
        where: "in the return value of vector()",
        properties: {
            "$constructor": {
                value: "Vector",
            },
            "x": ["number"],
            "y": ["number"],
            "z": ["number"],
        },
    },
    arguments: {
        where: "in arguments passed to vector()",
        properties: {
            "x": ["number"],
            "y": ["number"],
            "z": ["number"],
        },
    },
};

export function Vector(x = 0, y = 0, z = 0)
{
    validate_object?.({x, y, z}, schema.arguments);

    const publicInterface = {
        $constructor: "Vector",
        x,
        y,
        z,
    };

    validate_object?.(publicInterface, schema.interface);

    return publicInterface;
}

// Transforms the vector by the given 4x4 matrix.
Vector.transform = function(v = vector(), m)
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

Vector.normalize = function(v = vector())
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

Vector.dot = function(v = vector(), other = vector())
{
    return ((v.x * other.x) + (v.y * other.y) + (v.z * other.z));
}

Vector.cross = function(v = vector(), other = vector())
{
    const c = vector();

    c.x = ((v.y * other.z) - (v.z * other.y));
    c.y = ((v.z * other.x) - (v.x * other.z));
    c.z = ((v.x * other.y) - (v.y * other.x));

    return c;
}

Vector.invert = function(v = vector())
{
    v.x *= -1;
    v.y *= -1;
    v.z *= -1;
}
