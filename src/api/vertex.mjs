/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

import {validate_object} from "../schema.mjs";
import {Matrix} from "./matrix.mjs";

const schema = {
    arguments: {
        where: "in arguments to Rngon::vertex()",
        properties: {
            "x": ["number"],
            "y": ["number"],
            "z": ["number"],
            "u": ["number"],
            "v": ["number"],
            "w": ["number"],
            "shade": ["number"],
            "worldX": ["number"],
            "worldY": ["number"],
            "worldZ": ["number"],
            "normalX": ["number"],
            "normalY": ["number"],
            "normalZ": ["number"],
        },
    },
    interface: {
        where: "in the return value of Rngon::vertex()",
        properties: {
            "$constructor": {
                value: "Vertex",
            },
            "x": ["number"],
            "y": ["number"],
            "z": ["number"],
            "u": ["number"],
            "v": ["number"],
            "w": ["number"],
            "shade": ["number"],
            "worldX": ["number"],
            "worldY": ["number"],
            "worldZ": ["number"],
            "normalX": ["number"],
            "normalY": ["number"],
            "normalZ": ["number"],
        },
    },
};

export function Vertex(
    x = 0,
    y = 0,
    z = 0,
    u = 0,
    v = 0,
    normalX = 1,
    normalY = 0,
    normalZ = 0,
    w = 1,
    shade = 1,
    worldX = x,
    worldY = y,
    worldZ = z,
)
{
    validate_object?.({x, y, z, u, v, w, shade, worldX, worldY, worldZ, normalX, normalY, normalZ}, schema.arguments);

    const publicInterface = {
        $constructor: "Vertex",
        
        x,
        y,
        z,
        u,
        v,
        w,

        shade,

        worldX,
        worldY,
        worldZ,

        normalX,
        normalY,
        normalZ,
    };

    validate_object?.(publicInterface, schema.interface);

    return publicInterface;
}

Vertex.transform = function(v = Vertex(), m = Matrix())
{
    const x_ = ((m.data[0] * v.x) + (m.data[4] * v.y) + (m.data[ 8] * v.z) + (m.data[12] * v.w));
    const y_ = ((m.data[1] * v.x) + (m.data[5] * v.y) + (m.data[ 9] * v.z) + (m.data[13] * v.w));
    const z_ = ((m.data[2] * v.x) + (m.data[6] * v.y) + (m.data[10] * v.z) + (m.data[14] * v.w));
    const w_ = ((m.data[3] * v.x) + (m.data[7] * v.y) + (m.data[11] * v.z) + (m.data[15] * v.w));

    v.x = x_;
    v.y = y_;
    v.z = z_;
    v.w = w_;
}
