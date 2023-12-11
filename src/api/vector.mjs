/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

import {validate_object} from "../schema.mjs";

const schema = {
    interface: {
        where: "in the return value of Rngon::vector()",
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
        where: "in arguments to Rngon::vector()",
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

Vector.transform = function(v = Vector(), m = Matrix())
{
    const x_ = ((m.data[0] * v.x) + (m.data[4] * v.y) + (m.data[ 8] * v.z));
    const y_ = ((m.data[1] * v.x) + (m.data[5] * v.y) + (m.data[ 9] * v.z));
    const z_ = ((m.data[2] * v.x) + (m.data[6] * v.y) + (m.data[10] * v.z));

    v.x = x_;
    v.y = y_;
    v.z = z_;
}

Vector.normalize = function(v = Vector())
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

Vector.dot = function(v = Vector(), other = Vector())
{
    return ((v.x * other.x) + (v.y * other.y) + (v.z * other.z));
}

Vector.cross = function(v = Vector(), other = Vector())
{
    const c = Vector();

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
