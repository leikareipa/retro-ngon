/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

import {validate_object} from "../core/schema.js";
import {assert as Assert} from "../core/assert.js";

export function vertex(
    x = 0,
    y = 0,
    z = 0,
    u = 0,
    v = 0,
    w = 1,
    shade = 1,
    worldX = x,
    worldY = y,
    worldZ = z,
)
{
    validate_object?.({x, y, z, u, v, w, shade, worldX, worldY, worldZ}, vertex.schema.arguments);

    const publicInterface = {
        $constructor: "Vertex",
        
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
    };

    validate_object?.(publicInterface, vertex.schema.interface);

    return publicInterface;
}

vertex.schema = {
    arguments: {
        where: "in arguments passed to vertex()",
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
        },
    },
    interface: {
        where: "in the return value of vertex()",
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
        },
    },
};

// Transforms the vertex by the given 4x4 matrix.
vertex.transform = function(v, m = [])
{
    Assert?.(
        (m.length === 16),
        "Expected a 4 x 4 matrix to transform the vertex by."
    );
    
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
vertex.perspective_divide = function(v)
{
    v.x /= v.w;
    v.y /= v.w;
}
