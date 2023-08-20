/*
 * 2019-2023 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

import {validate_object} from "../core/schema.js";
import {vertex as Vertex} from "./vertex.js";
import {vector as Vector} from "./vector.js";
import {color as Color} from "./color.js";

export const ngonDefaultMaterial = {
    color: Color(255, 255, 255, 255),
    wireframeColor: Color(0, 0, 0, 255),
    texture: undefined,
    textureMapping: "ortho",
    textureFiltering: "none",
    uvWrapping: "repeat",
    vertexShading: "none",
    renderVertexShade: true,
    ambientLightLevel: 0,
    hasWireframe: false,
    hasFill: true,
    isTwoSided: true,
    isInScreenSpace: false,
    allowAlphaReject: false,
    allowAlphaBlend: false,
};

const schema = {
    arguments: {
        where: "in arguments passed to ngon()",
        properties: {
            "vertices": [["Vertex"]],
            "material": ["object"],
            "vertexNormals": [["Vector"], "Vector"],
        },
    },
    interface: {
        where: "in the return value of ngon()",
        properties: {
            "$constructor": {
                value: "Ngon",
            },
            "vertices": [["Vertex"]],
            "vertexNormals": [["Vector"]],
            "normal": ["Vector"],
            "material": {
                subschema: {
                    allowAdditionalProperties: true,
                    properties: {
                        "color": ["Color"],
                        "wireframeColor": ["Color"],
                        "texture": ["undefined", "null", "Texture"],
                        "textureMapping": ["string"],
                        "textureFiltering": ["string"],
                        "uvWrapping": ["string"],
                        "vertexShading": ["string"],
                        "renderVertexShade": ["boolean"],
                        "ambientLightLevel": ["number"],
                        "hasWireframe": ["boolean"],
                        "hasFill": ["boolean"],
                        "isTwoSided": ["boolean"],
                        "isInScreenSpace": ["boolean"],
                        "allowAlphaReject": ["boolean"],
                        "allowAlphaBlend": ["boolean"],
                    },
                },
            },
            "mipLevel": ["number"],
        },
    },
};

// A single n-sided ngon.
export function ngon(
    vertices = [Vertex()],
    material = {},
    vertexNormals = Vector(0, 1, 0)
)
{
    // Combine default material options with the user-supplied ones. Note that we
    // want to keep the reference to the original material object intact.
    for (const key of Object.keys(ngonDefaultMaterial))
    {
        material.hasOwnProperty(key)? 1 : (material[key] = ngonDefaultMaterial[key]);
    }

    validate_object?.({vertices, material, vertexNormals}, schema.arguments);

    // Assuming that only a single normal vector was provided, in which case, let's
    // duplicate that normal for all vertices.
    if (!Array.isArray(vertexNormals))
    {
        vertexNormals = new Array(vertices.length).fill().map(n=>Vector(vertexNormals.x, vertexNormals.y, vertexNormals.z));
    }

    const faceNormal = vertexNormals.reduce((faceNormal, vertexNormal)=>{
        faceNormal.x += vertexNormal.x;
        faceNormal.y += vertexNormal.y;
        faceNormal.z += vertexNormal.z;
        return faceNormal;
    }, Vector(0, 0, 0));

    Vector.normalize(faceNormal);

    // If we get vertex U or V coordinates in the range [0,-x], we want to change 0 to
    // -eps to avoid incorrect rounding during texture-mapping.
    {
        const hasNegativeU = vertices.map(v=>v.u).some(u=>(u < 0));
        const hasNegativeV = vertices.map(v=>v.v).some(v=>(v < 0));

        if (hasNegativeU || hasNegativeV)
        {
            for (const vert of vertices)
            {
                if (hasNegativeU && vert.u === 0) vert.u = -Number.EPSILON;
                if (hasNegativeV && vert.v === 0) vert.v = -Number.EPSILON;
            }
        }
    }

    const publicInterface = {
        $constructor: "Ngon",
        vertices,
        vertexNormals,
        normal: faceNormal,
        material,

        // A value in the range [0,1] that defines which mip level of this
        // n-gon's texture (if it has a texture) should be used when rendering.
        // A value of 0 is the maximum-resolution (base) mip level, 1 is the
        // lowest-resolution (1 x 1) mip level.
        mipLevel: 0,
    };

    validate_object?.(publicInterface, schema.interface);

    return publicInterface;
}

export function ngon_perspective_divide(ngon)
{
    for (const vert of ngon.vertices)
    {
        vert.x /= vert.w;
        vert.y /= vert.w;
    }
}

export function ngon_transform(ngon, matrix)
{
    for (const vert of ngon.vertices)
    {
        Vertex.transform(vert, matrix);
    }
}

// Clips all vertices against the sides of the viewport. Adapted from Benny
// Bobaganoosh's 3d software renderer, the source for which is available at
// https://github.com/BennyQBD/3DSoftwareRenderer.
const axes = ["x", "y", "z"];
const factors = [1, -1];
export function ngon_clip_to_viewport(ngon)
{
    for (const axis of axes)
    {
        for (const factor of factors)
        {
            if (!ngon.vertices.length)
            {
                break;
            }

            if (ngon.vertices.length == 1)
            {
                // If the point is fully inside the viewport, allow it to stay.
                if (( ngon.vertices[0].x <= ngon.vertices[0].w) &&
                    (-ngon.vertices[0].x <= ngon.vertices[0].w) &&
                    ( ngon.vertices[0].y <= ngon.vertices[0].w) &&
                    (-ngon.vertices[0].y <= ngon.vertices[0].w) &&
                    ( ngon.vertices[0].z <= ngon.vertices[0].w) &&
                    (-ngon.vertices[0].z <= ngon.vertices[0].w))
                {
                    break;
                }

                ngon.vertices.length = 0;

                break;
            }

            let prevVertex = ngon.vertices[ngon.vertices.length - ((ngon.vertices.length == 2)? 2 : 1)];
            let prevComponent = (prevVertex[axis] * factor);
            let isPrevVertexInside = (prevComponent <= prevVertex.w);
            
            // The vertices array will be modified in-place by appending the clipped vertices
            // onto the end of the array, then removing the previous ones.
            let k = 0;
            let numOriginalVertices = ngon.vertices.length;
            for (let i = 0; i < numOriginalVertices; i++)
            {
                const curComponent = (ngon.vertices[i][axis] * factor);
                const thisVertexIsInside = (curComponent <= ngon.vertices[i].w);

                // If either the current vertex or the previous vertex is inside but the other isn't,
                // and they aren't both inside, interpolate a new vertex between them that lies on
                // the clipping plane.
                if (thisVertexIsInside ^ isPrevVertexInside)
                {
                    const lerpStep = (
                        (prevVertex.w - prevComponent) /
                        ((prevVertex.w - prevComponent) - (ngon.vertices[i].w - curComponent))
                    );

                    ngon.vertices[numOriginalVertices + k++] = Vertex(
                        lerp(prevVertex.x, ngon.vertices[i].x, lerpStep),
                        lerp(prevVertex.y, ngon.vertices[i].y, lerpStep),
                        lerp(prevVertex.z, ngon.vertices[i].z, lerpStep),
                        lerp(prevVertex.u, ngon.vertices[i].u, lerpStep),
                        lerp(prevVertex.v, ngon.vertices[i].v, lerpStep),
                        lerp(prevVertex.w, ngon.vertices[i].w, lerpStep),
                        lerp(prevVertex.shade, ngon.vertices[i].shade, lerpStep),
                        lerp(prevVertex.worldX, ngon.vertices[i].worldX, lerpStep),
                        lerp(prevVertex.worldY, ngon.vertices[i].worldY, lerpStep),
                        lerp(prevVertex.worldZ, ngon.vertices[i].worldZ, lerpStep),
                    );
                }
                
                if (thisVertexIsInside)
                {
                    ngon.vertices[numOriginalVertices + k++] = ngon.vertices[i];
                }

                prevVertex = ngon.vertices[i];
                prevComponent = curComponent;
                isPrevVertexInside = thisVertexIsInside;
            }

            ngon.vertices.splice(0, numOriginalVertices);
        }
    }

    return;
}

function lerp(x, y, interval)
{
    return (x + (interval * (y - x)));
}
